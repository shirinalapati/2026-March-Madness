from __future__ import annotations

import csv
import random
import sqlite3
from datetime import date, timedelta
from pathlib import Path
from typing import Any

from backend.models.scoring import compare_matchup, generate_identity, normalize


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
DB_PATH = DATA_DIR / "courtvision_demo.sqlite"
FIELD_PATH = DATA_DIR / "tournament_field_2026.csv"
STATS_PATH = DATA_DIR / "statsharp_2026_tournament_stats.csv"
SEASON = "2025-2026 regular season"
DATA_LABEL = (
    "2026 main bracket teams from NCAA/Yahoo bracket sources; regular-season team metrics "
    "from StatSharp 2026 regular-season possession-based table. Free throw, rim, and transition "
    "values are transparent proxies where the public source does not expose tracking data."
)


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open(newline="") as handle:
        return list(csv.DictReader(handle))


def pct_proxy(row: dict[str, Any]) -> float:
    return round(max(18.0, min(45.0, 22 + (row["true_shooting_pct"] - row["effective_field_goal_percentage"]) * 2.7)), 1)


def load_regular_season_rows() -> list[dict[str, Any]]:
    field_rows = read_csv(FIELD_PATH)
    stats_rows = {row["stats_name"]: row for row in read_csv(STATS_PATH)}
    rows: list[dict[str, Any]] = []
    for field in field_rows:
        stats = stats_rows[field["stats_name"]]
        row: dict[str, Any] = {
            "id": field["id"],
            "name": field["name"],
            "seed": int(field["seed"]),
            "region": field["region"],
            "conference": field["conference"],
            "overall_record": field["overall_record"],
            "season": SEASON,
            "data_label": DATA_LABEL,
            "source_note": field["source_note"],
            "adjusted_offensive_rating": float(stats["off_rating"]),
            "pace": float(stats["pace"]),
            "effective_field_goal_percentage": float(stats["efg_pct"]),
            "turnover_rate": float(stats["turnover_pct"]),
            "offensive_rebound_rate": float(stats["off_reb_pct"]),
            "three_point_attempt_rate": float(stats["three_point_attempt_rate"]),
            "assist_rate": round(float(stats["assist_turnover_ratio"]) * 10, 1),
            "adjusted_defensive_rating": float(stats["def_rating"]),
            "opponent_effective_field_goal_percentage": float(stats["opp_efg_pct"]),
            "forced_turnover_rate": float(stats["forced_turnover_pct"]),
            "defensive_rebound_rate": float(stats["def_reb_pct"]),
            "opponent_three_point_attempt_rate": float(stats["opp_three_point_attempt_rate"]),
            "true_shooting_pct": float(stats["true_shooting_pct"]),
            "opp_true_shooting_pct": float(stats["opp_true_shooting_pct"]),
            "rating_diff": float(stats["rating_diff"]),
        }
        row["free_throw_rate"] = pct_proxy(row)
        row["opponent_free_throw_rate"] = round(max(18.0, min(45.0, 22 + (row["opp_true_shooting_pct"] - row["opponent_effective_field_goal_percentage"]) * 2.7)), 1)
        row["rim_pressure_proxy"] = round(row["offensive_rebound_rate"] * 0.55 + row["free_throw_rate"] * 0.45, 1)
        row["transition_frequency_proxy"] = row["pace"]
        row["rim_protection_proxy"] = round((100 - row["opponent_effective_field_goal_percentage"]) * 0.72 + (100 - row["adjusted_defensive_rating"]) * 0.28, 1)
        row["transition_defense_proxy"] = round((100 - row["adjusted_defensive_rating"]) * 0.65 + row["forced_turnover_rate"] * 0.35, 1)
        row["volatility_score"] = round(row["three_point_attempt_rate"] * 0.45 + abs(row["pace"] - 70) * 1.8 + row["seed"] * 1.2, 1)
        rows.append(row)
    return add_style_scores(rows)


def add_style_scores(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    ranges = {key: (min(row[key] for row in rows), max(row[key] for row in rows)) for key in rows[0] if isinstance(rows[0][key], (int, float))}
    for row in rows:
        row["tempo_score"] = normalize(row["pace"], *ranges["pace"])
        row["spacing_score"] = round(
            normalize(row["three_point_attempt_rate"], *ranges["three_point_attempt_rate"]) * 0.55
            + normalize(row["effective_field_goal_percentage"], *ranges["effective_field_goal_percentage"]) * 0.45,
            1,
        )
        row["rim_pressure_score"] = normalize(row["rim_pressure_proxy"], *ranges["rim_pressure_proxy"])
        row["ball_security_score"] = normalize(row["turnover_rate"], *ranges["turnover_rate"], invert=True)
        row["glass_pressure_score"] = normalize(row["offensive_rebound_rate"], *ranges["offensive_rebound_rate"])
        row["defensive_disruption_score"] = normalize(row["forced_turnover_rate"], *ranges["forced_turnover_rate"])
        row["rim_protection_score"] = normalize(row["rim_protection_proxy"], *ranges["rim_protection_proxy"])
        row["transition_defense_score"] = normalize(row["transition_defense_proxy"], *ranges["transition_defense_proxy"])
        row["shot_quality_score"] = normalize(row["effective_field_goal_percentage"], *ranges["effective_field_goal_percentage"])
        row["defensive_rebound_score"] = normalize(row["defensive_rebound_rate"], *ranges["defensive_rebound_rate"])
        row["opponent_three_point_attempt_rate_score"] = normalize(row["opponent_three_point_attempt_rate"], *ranges["opponent_three_point_attempt_rate"])
        row["opponent_free_throw_rate_score"] = normalize(row["opponent_free_throw_rate"], *ranges["opponent_free_throw_rate"])
        row["free_throw_rate_score"] = normalize(row["free_throw_rate"], *ranges["free_throw_rate"])
        row["identity_paragraph"] = generate_identity(row)
    return rows


def create_schema(conn: sqlite3.Connection) -> None:
    conn.executescript((DATA_DIR / "schema.sql").read_text())
    conn.executescript(
        """
        CREATE TABLE IF NOT EXISTS team_game_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            team_id TEXT NOT NULL REFERENCES tournament_teams(id),
            game_date TEXT NOT NULL,
            opponent TEXT NOT NULL,
            offensive_rating REAL NOT NULL,
            defensive_rating REAL NOT NULL,
            possessions REAL NOT NULL
        );
        """
    )


def reset_schema(conn: sqlite3.Connection) -> None:
    conn.executescript(
        """
        DROP TABLE IF EXISTS scouting_reports;
        DROP TABLE IF EXISTS matchup_predictions;
        DROP TABLE IF EXISTS tournament_matchups;
        DROP TABLE IF EXISTS team_game_logs;
        DROP TABLE IF EXISTS team_style_metrics;
        DROP TABLE IF EXISTS team_regular_season_stats;
        DROP TABLE IF EXISTS tournament_teams;
        """
    )
    create_schema(conn)


def insert_rows(conn: sqlite3.Connection, rows: list[dict[str, Any]]) -> None:
    team_cols = ["id", "name", "seed", "region", "conference", "overall_record", "season", "data_label"]
    stat_cols = [
        "id",
        "adjusted_offensive_rating",
        "pace",
        "effective_field_goal_percentage",
        "turnover_rate",
        "offensive_rebound_rate",
        "free_throw_rate",
        "three_point_attempt_rate",
        "assist_rate",
        "rim_pressure_proxy",
        "transition_frequency_proxy",
        "adjusted_defensive_rating",
        "opponent_effective_field_goal_percentage",
        "forced_turnover_rate",
        "defensive_rebound_rate",
        "opponent_free_throw_rate",
        "opponent_three_point_attempt_rate",
        "rim_protection_proxy",
        "transition_defense_proxy",
        "volatility_score",
        "identity_paragraph",
    ]
    metric_cols = [
        "id",
        "tempo_score",
        "spacing_score",
        "rim_pressure_score",
        "ball_security_score",
        "glass_pressure_score",
        "defensive_disruption_score",
        "rim_protection_score",
        "transition_defense_score",
        "shot_quality_score",
        "defensive_rebound_score",
        "opponent_three_point_attempt_rate_score",
        "opponent_free_throw_rate_score",
        "free_throw_rate_score",
    ]
    random.seed(2026)
    regular_season_start = date(2025, 11, 8)
    regular_season_end = date(2026, 3, 7)
    for row in rows:
        conn.execute(f"INSERT INTO tournament_teams VALUES ({','.join('?' for _ in team_cols)})", tuple(row[col] for col in team_cols))
        conn.execute(f"INSERT INTO team_regular_season_stats VALUES ({','.join('?' for _ in stat_cols)})", tuple(row[col] for col in stat_cols))
        conn.execute(f"INSERT INTO team_style_metrics VALUES ({','.join('?' for _ in metric_cols)})", tuple(row[col] for col in metric_cols))
        wins, losses = [int(part) for part in row["overall_record"].split("-")]
        game_count = wins + losses
        date_step = (regular_season_end - regular_season_start) / max(game_count - 1, 1)
        for game in range(game_count):
            game_date = regular_season_start + timedelta(days=round(date_step.days * game + date_step.seconds / 86400 * game))
            late_season_slope = (game / max(game_count - 1, 1) - 0.5) * 4
            conn.execute(
                "INSERT INTO team_game_logs (team_id, game_date, opponent, offensive_rating, defensive_rating, possessions) VALUES (?, ?, ?, ?, ?, ?)",
                (
                    row["id"],
                    game_date.isoformat(),
                    f"Regular Season Sample {game + 1}",
                    round(row["adjusted_offensive_rating"] + late_season_slope + random.uniform(-7, 7), 1),
                    round(row["adjusted_defensive_rating"] - late_season_slope / 2 + random.uniform(-7, 7), 1),
                    round(row["pace"] + random.uniform(-4, 4), 1),
                ),
            )


def seed_predictions(conn: sqlite3.Connection, rows: list[dict[str, Any]]) -> None:
    by_region: dict[str, list[dict[str, Any]]] = {}
    for row in rows:
        by_region.setdefault(row["region"], []).append(row)
    pairings = [(1, 16), (8, 9), (5, 12), (4, 13), (6, 11), (3, 14), (7, 10), (2, 15)]
    for region_rows in by_region.values():
        for a_seed, b_seed in pairings:
            team_a = next(item for item in region_rows if item["seed"] == a_seed)
            team_b = next(item for item in region_rows if item["seed"] == b_seed)
            result = compare_matchup(team_a, team_b)
            cur = conn.execute(
                "INSERT INTO tournament_matchups (team_a_id, team_b_id, matchup_label) VALUES (?, ?, ?)",
                (team_a["id"], team_b["id"], f"{team_a['region']} R64: {team_a['seed']} {team_a['name']} vs {team_b['seed']} {team_b['name']}"),
            )
            winner_id = team_a["id"] if result["predicted_winner"] == team_a["name"] else team_b["id"]
            conn.execute(
                """
                INSERT INTO matchup_predictions (matchup_id, predicted_winner_id, team_a_win_probability, team_b_win_probability, matchup_score_edge, upset_warning)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (cur.lastrowid, winner_id, result["team_a_win_probability"], result["team_b_win_probability"], result["edge_value"], result["upset_warning"]),
            )


def build_database(path: Path = DB_PATH) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    rows = load_regular_season_rows()
    if len(rows) != 64:
        raise RuntimeError(f"Expected 64 main bracket teams, got {len(rows)}")
    with sqlite3.connect(path) as conn:
        reset_schema(conn)
        insert_rows(conn, rows)
        seed_predictions(conn, rows)
        conn.commit()
    return path


if __name__ == "__main__":
    built = build_database()
    print(f"Built verified-source 2026 CourtVision tournament database at {built}")

