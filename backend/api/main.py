from __future__ import annotations

import json
import os
import sqlite3
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from backend.models.scoring import compare_matchup, insight_rules
from backend.scripts.build_demo_data import build_database


ROOT = Path(__file__).resolve().parents[1]
DB_PATH = Path(os.getenv("COURTVISION_DB", ROOT / "data" / "courtvision_demo.sqlite"))

app = FastAPI(
    title="CourtVision: March Madness Matchup Intelligence",
    description="Transparent matchup predictions for the 64 main March Madness teams using regular-season profiles only.",
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "http://127.0.0.1:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def ensure_db() -> None:
    if not DB_PATH.exists():
        build_database(DB_PATH)


def connect() -> sqlite3.Connection:
    ensure_db()
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def row_to_dict(row: sqlite3.Row) -> dict[str, Any]:
    return {key: row[key] for key in row.keys()}


def fetch_team(team_id: str) -> dict[str, Any]:
    with connect() as conn:
        row = conn.execute(
            """
            SELECT
                t.id, t.name, t.seed, t.region, t.conference, t.overall_record, t.season, t.data_label,
                s.*,
                m.tempo_score, m.spacing_score, m.rim_pressure_score, m.ball_security_score,
                m.glass_pressure_score, m.defensive_disruption_score, m.rim_protection_score,
                m.transition_defense_score, m.shot_quality_score, m.defensive_rebound_score,
                m.opponent_three_point_attempt_rate_score, m.opponent_free_throw_rate_score,
                m.free_throw_rate_score
            FROM tournament_teams t
            JOIN team_regular_season_stats s ON s.team_id = t.id
            JOIN team_style_metrics m ON m.team_id = t.id
            WHERE t.id = ?
            """,
            (team_id,),
        ).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail=f"Tournament team '{team_id}' not found")
        team = row_to_dict(row)
        team.pop("team_id", None)
        return team


def fetch_all_team_profiles() -> list[dict[str, Any]]:
    with connect() as conn:
        rows = conn.execute(
            """
            SELECT
                t.id, t.name, t.seed, t.region, t.conference, t.overall_record, t.season, t.data_label,
                s.*,
                m.tempo_score, m.spacing_score, m.rim_pressure_score, m.ball_security_score,
                m.glass_pressure_score, m.defensive_disruption_score, m.rim_protection_score,
                m.transition_defense_score, m.shot_quality_score, m.defensive_rebound_score,
                m.opponent_three_point_attempt_rate_score, m.opponent_free_throw_rate_score,
                m.free_throw_rate_score
            FROM tournament_teams t
            JOIN team_regular_season_stats s ON s.team_id = t.id
            JOIN team_style_metrics m ON m.team_id = t.id
            """
        ).fetchall()
    profiles = [row_to_dict(row) for row in rows]
    for profile in profiles:
        profile.pop("team_id", None)
    return profiles


def rank_map(rows: list[dict[str, Any]], key: str, *, lower_is_better: bool = False) -> dict[str, int]:
    sorted_rows = sorted(rows, key=lambda item: item[key], reverse=not lower_is_better)
    ranks: dict[str, int] = {}
    previous_value: Any = None
    current_rank = 0
    for index, row in enumerate(sorted_rows, start=1):
        if row[key] != previous_value:
            current_rank = index
            previous_value = row[key]
        ranks[row["id"]] = current_rank
    return ranks


@app.get("/api/health")
def health() -> dict[str, str]:
    ensure_db()
    return {"status": "ok", "database": str(DB_PATH)}


@app.get("/api/teams")
def teams() -> list[dict[str, Any]]:
    with connect() as conn:
        rows = conn.execute(
            """
            SELECT t.id, t.name, t.seed, t.region, t.conference, t.overall_record, t.season, t.data_label,
                   m.tempo_score, m.spacing_score, m.rim_pressure_score, m.glass_pressure_score,
                   m.defensive_disruption_score, m.rim_protection_score
            FROM tournament_teams t
            JOIN team_style_metrics m ON m.team_id = t.id
            ORDER BY t.region, t.seed
            """
        ).fetchall()
        return [row_to_dict(row) for row in rows]


@app.get("/api/overview")
def overview() -> dict[str, Any]:
    with connect() as conn:
        teams_rows = [row_to_dict(row) for row in conn.execute("SELECT * FROM tournament_teams ORDER BY region, seed").fetchall()]
        joined = [
            row_to_dict(row)
            for row in conn.execute(
                """
                SELECT t.id, t.name, t.seed, t.region, t.conference, s.adjusted_offensive_rating,
                       s.adjusted_defensive_rating, s.volatility_score, m.spacing_score, m.defensive_disruption_score,
                       m.rim_protection_score, m.defensive_rebound_score
                FROM tournament_teams t
                JOIN team_regular_season_stats s ON s.team_id = t.id
                JOIN team_style_metrics m ON m.team_id = t.id
                """
            ).fetchall()
        ]
    return {
        "product_line": "Using regular-season data, CourtVision explains which 64-team tournament matchups create an edge and why.",
        "team_count": len(teams_rows),
        "season_scope": "2025-2026 regular season profiles for the 64 main bracket teams",
        "data_label": teams_rows[0]["data_label"] if teams_rows else "",
        "teams_by_region": teams_rows,
        "strongest_offensive_profiles": sorted(joined, key=lambda item: item["adjusted_offensive_rating"], reverse=True)[:5],
        "strongest_defensive_profiles": sorted(joined, key=lambda item: item["adjusted_defensive_rating"])[:5],
        "most_volatile_teams": sorted(joined, key=lambda item: item["volatility_score"], reverse=True)[:5],
        "upset_vulnerable_higher_seeds": sorted(
            [item for item in joined if item["seed"] <= 5],
            key=lambda item: (item["defensive_rebound_score"] + item["rim_protection_score"]),
        )[:5],
        "dangerous_lower_seeds": sorted(
            [item for item in joined if item["seed"] >= 10],
            key=lambda item: (item["spacing_score"] + item["defensive_disruption_score"]),
            reverse=True,
        )[:5],
    }


@app.get("/api/teams/{team_id}")
def team_profile(team_id: str) -> dict[str, Any]:
    team = fetch_team(team_id)
    all_profiles = fetch_all_team_profiles()
    with connect() as conn:
        trends = [
            row_to_dict(row)
            for row in conn.execute(
                "SELECT game_date, opponent AS opponent_id, offensive_rating, defensive_rating, possessions FROM team_game_logs WHERE team_id = ? ORDER BY game_date",
                (team_id,),
            ).fetchall()
        ]
    score_keys = [
        "tempo_score", "spacing_score", "rim_pressure_score", "ball_security_score", "glass_pressure_score",
        "defensive_disruption_score", "rim_protection_score", "transition_defense_score", "shot_quality_score",
    ]
    strengths = [{"label": key.replace("_score", "").replace("_", " ").title(), "score": team[key]} for key in score_keys if team[key] >= 68]
    weaknesses = [{"label": key.replace("_score", "").replace("_", " ").title(), "score": team[key]} for key in score_keys if team[key] <= 45]
    metric_rank_keys = {
        "seed": True,
        "adjusted_offensive_rating": False,
        "adjusted_defensive_rating": True,
        "volatility_score": False,
    }
    metric_ranks = {
        key: rank_map(all_profiles, key, lower_is_better=lower_is_better)[team_id]
        for key, lower_is_better in metric_rank_keys.items()
    }
    style_ranks = {
        key: rank_map(all_profiles, key)[team_id]
        for key in score_keys + ["defensive_rebound_score"]
    }
    return {
        "team": team,
        "trends": trends,
        "strengths": strengths,
        "weaknesses": weaknesses,
        "metric_ranks": metric_ranks,
        "style_ranks": style_ranks,
        "rank_count": len(all_profiles),
    }


@app.get("/api/matchups/{team_a_id}/{team_b_id}")
def matchup(team_a_id: str, team_b_id: str) -> dict[str, Any]:
    if team_a_id == team_b_id:
        raise HTTPException(status_code=400, detail="Choose two different tournament teams")
    result = compare_matchup(fetch_team(team_a_id), fetch_team(team_b_id))
    with connect() as conn:
        cur = conn.execute(
            "INSERT INTO tournament_matchups (team_a_id, team_b_id, matchup_label) VALUES (?, ?, ?)",
            (team_a_id, team_b_id, f"{result['team_a']['name']} vs {result['team_b']['name']}"),
        )
        matchup_id = cur.lastrowid
        winner_id = team_a_id if result["predicted_winner"] == result["team_a"]["name"] else team_b_id
        conn.execute(
            """
            INSERT INTO matchup_predictions (matchup_id, predicted_winner_id, team_a_win_probability, team_b_win_probability, matchup_score_edge, upset_warning)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (matchup_id, winner_id, result["team_a_win_probability"], result["team_b_win_probability"], result["edge_value"], result["upset_warning"]),
        )
        conn.commit()
    return result


@app.get("/api/scouting-report/{team_a_id}/{team_b_id}")
def scouting_report(team_a_id: str, team_b_id: str) -> dict[str, Any]:
    result = matchup(team_a_id, team_b_id)
    team_a = result["team_a"]
    team_b = result["team_b"]
    team_a_plan = insight_rules(team_a, team_b)
    team_b_plan = insight_rules(team_b, team_a)
    pressure_points = [battle["label"] for battle in result["battles"] if max(battle["team_a"], battle["team_b"]) >= 58]
    caveats = [
        "Regular-season data only; tournament results are not used for training.",
        "The field is limited to the 64 main bracket teams in this demo structure.",
        "Public data does not fully capture injuries, schemes, matchup assignments, or film context.",
        "Predictions are transparent heuristics for scouting support, not betting recommendations.",
    ]
    sections = {
        "matchup_summary": result["overall_edge"],
        "why_team_a_can_win": team_a_plan,
        "why_team_b_can_win": team_b_plan,
        "team_a_attack_plan": team_a_plan,
        "team_b_attack_plan": team_b_plan,
        "key_advantages": [
            f"{team_a['name']} matchup confidence: {result['team_a_win_probability']}%.",
            f"{team_b['name']} matchup confidence: {result['team_b_win_probability']}%.",
            f"Projected winner by profile: {result['predicted_winner']}.",
        ],
        "key_vulnerabilities": [
            result["upset_warning"],
            f"{team_a['name']} volatility score: {team_a['volatility_score']}. {team_b['name']} volatility score: {team_b['volatility_score']}.",
        ],
        "key_pressure_points": pressure_points,
        "tactical_pressure_points": pressure_points,
        "upset_risk": [result["upset_warning"]],
        "tactical_game_plan": team_a_plan + team_b_plan,
        "what_to_watch": [
            "Can the lower seed create extra possessions through turnovers or offensive rebounds?",
            "Does either team dictate tempo enough to move the game away from the opponent's comfort zone?",
            "Which team can protect the rim without fouling?",
        ],
        "data_caveats": caveats,
    }
    with connect() as conn:
        cur = conn.execute("INSERT INTO tournament_matchups (team_a_id, team_b_id, matchup_label) VALUES (?, ?, ?)", (team_a_id, team_b_id, f"Report: {team_a['name']} vs {team_b['name']}"))
        conn.execute(
            """
            INSERT INTO scouting_reports (matchup_id, matchup_summary, why_team_a_can_win, why_team_b_can_win, key_pressure_points, upset_risk, tactical_game_plan, data_caveats)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                cur.lastrowid,
                sections["matchup_summary"],
                json.dumps(sections["why_team_a_can_win"]),
                json.dumps(sections["why_team_b_can_win"]),
                json.dumps(pressure_points),
                result["upset_warning"],
                json.dumps(sections["tactical_game_plan"]),
                json.dumps(caveats),
            ),
        )
        conn.commit()
    return {"matchup": result, "sections": sections}

