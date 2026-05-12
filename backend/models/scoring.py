from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Any


STYLE_SCORE_KEYS = [
    "tempo_score",
    "spacing_score",
    "rim_pressure_score",
    "ball_security_score",
    "glass_pressure_score",
    "defensive_disruption_score",
    "rim_protection_score",
    "transition_defense_score",
    "shot_quality_score",
]


def clamp(value: float, lower: float = 0.0, upper: float = 100.0) -> float:
    return max(lower, min(upper, value))


def normalize(value: float, low: float, high: float, *, invert: bool = False) -> float:
    if high == low:
        return 50.0
    score = (value - low) / (high - low) * 100
    if invert:
        score = 100 - score
    return round(clamp(score), 1)


def centered(edge: float) -> float:
    return round(clamp(50 + edge / 2), 1)


def logistic_probability(score_edge: float) -> float:
    return round(1 / (1 + math.exp(-score_edge / 12)) * 100, 1)


def seed_context(team: dict[str, Any], opponent: dict[str, Any]) -> float:
    seed_gap = opponent["seed"] - team["seed"]
    return centered(seed_gap * 2.2)


@dataclass(frozen=True)
class PredictionBreakdown:
    efficiency_edge: float
    shooting_profile_edge: float
    turnover_pressure_edge: float
    rebounding_edge: float
    rim_pressure_edge: float
    rim_protection_resistance: float
    tempo_control_edge: float
    free_throw_pressure_edge: float
    volatility_edge: float
    seed_context_adjustment: float

    @property
    def matchup_score(self) -> float:
        return round(
            0.20 * self.efficiency_edge
            + 0.12 * self.shooting_profile_edge
            + 0.12 * self.turnover_pressure_edge
            + 0.12 * self.rebounding_edge
            + 0.10 * self.rim_pressure_edge
            + 0.08 * self.rim_protection_resistance
            + 0.08 * self.tempo_control_edge
            + 0.07 * self.free_throw_pressure_edge
            + 0.06 * self.volatility_edge
            + 0.05 * self.seed_context_adjustment,
            1,
        )

    def as_dict(self) -> dict[str, float]:
        return {
            "efficiency_edge": self.efficiency_edge,
            "shooting_profile_edge": self.shooting_profile_edge,
            "turnover_pressure_edge": self.turnover_pressure_edge,
            "rebounding_edge": self.rebounding_edge,
            "rim_pressure_edge": self.rim_pressure_edge,
            "rim_protection_resistance": self.rim_protection_resistance,
            "tempo_control_edge": self.tempo_control_edge,
            "free_throw_pressure_edge": self.free_throw_pressure_edge,
            "volatility_edge": self.volatility_edge,
            "seed_context_adjustment": self.seed_context_adjustment,
            "matchup_score": self.matchup_score,
        }


def build_prediction_breakdown(team: dict[str, Any], opponent: dict[str, Any]) -> PredictionBreakdown:
    efficiency = centered(
        (team["adjusted_offensive_rating"] - opponent["adjusted_defensive_rating"])
        - (opponent["adjusted_offensive_rating"] - team["adjusted_defensive_rating"])
    )
    shooting = centered(
        (team["spacing_score"] * 0.55 + team["shot_quality_score"] * 0.45)
        - (opponent["opponent_three_point_attempt_rate_score"] * 0.55 + (100 - opponent["rim_protection_score"]) * 0.45)
    )
    turnovers = centered((team["ball_security_score"] - opponent["defensive_disruption_score"]) * 0.8)
    rebounding = centered(team["glass_pressure_score"] - opponent["defensive_rebound_score"])
    rim = centered(team["rim_pressure_score"] - opponent["rim_protection_score"])
    rim_resistance = centered(team["rim_protection_score"] - opponent["rim_pressure_score"])
    tempo = centered((team["tempo_score"] - (100 - opponent["transition_defense_score"])) * 0.65)
    free_throw = centered(team["free_throw_rate_score"] - opponent["opponent_free_throw_rate_score"])
    volatility = centered(
        (team["volatility_score"] - opponent["volatility_score"])
        + (4 if team["seed"] > opponent["seed"] and team["three_point_attempt_rate"] >= 42 else 0)
    )
    seed_adj = seed_context(team, opponent)
    return PredictionBreakdown(efficiency, shooting, turnovers, rebounding, rim, rim_resistance, tempo, free_throw, volatility, seed_adj)


COMPONENT_LABELS = {
    "efficiency_edge": "overall efficiency profile",
    "shooting_profile_edge": "shooting profile",
    "turnover_pressure_edge": "turnover pressure and ball security",
    "rebounding_edge": "rebounding and extra possessions",
    "rim_pressure_edge": "rim pressure",
    "rim_protection_resistance": "rim protection resistance",
    "tempo_control_edge": "tempo control",
    "free_throw_pressure_edge": "free throw pressure",
    "volatility_edge": "volatility path",
    "seed_context_adjustment": "seed context",
}


def component_explanations(team: dict[str, Any], opponent: dict[str, Any], prediction: PredictionBreakdown) -> list[str]:
    values = prediction.as_dict()
    ranked = sorted(
        [(key, value) for key, value in values.items() if key != "matchup_score"],
        key=lambda item: item[1],
        reverse=True,
    )
    bullets: list[str] = []
    for key, value in ranked:
        if value < 54 and len(bullets) >= 3:
            break
        if key == "efficiency_edge":
            bullets.append(f"{team['name']} has a cleaner efficiency path when its offense is matched against {opponent['name']}'s defensive profile.")
        elif key == "shooting_profile_edge":
            bullets.append(f"{team['name']}'s spacing and shot quality line up well against the opponent shot-profile indicators.")
        elif key == "turnover_pressure_edge":
            bullets.append(f"The ball-security versus disruption matchup favors {team['name']} more than the raw seed line suggests.")
        elif key == "rebounding_edge":
            bullets.append(f"{team['name']} can create extra-possession pressure through the glass.")
        elif key == "rim_pressure_edge":
            bullets.append(f"{team['name']} has a path to pressure the paint against {opponent['name']}'s interior resistance.")
        elif key == "rim_protection_resistance":
            bullets.append(f"{team['name']}'s rim protection profile is better positioned to withstand the opponent's paint pressure.")
        elif key == "tempo_control_edge":
            bullets.append(f"Tempo indicators suggest {team['name']} can move the game toward a more comfortable pace.")
        elif key == "free_throw_pressure_edge":
            bullets.append(f"{team['name']} can create pressure at the foul line if it keeps attacking gaps.")
        elif key == "volatility_edge":
            bullets.append(f"{team['name']}'s variance profile gives it more paths if the game becomes style-driven.")
        elif key == "seed_context_adjustment":
            bullets.append(f"Seed context gives {team['name']} a small prior, but it is intentionally weighted lightly.")
        if len(bullets) == 5:
            break
    return bullets[:5]


def flip_factors(team: dict[str, Any], opponent: dict[str, Any]) -> list[str]:
    factors = [
        f"Control tempo and keep {opponent['name']} out of its preferred rhythm.",
        "Win the defensive glass to remove second-chance possessions.",
        "Force lower-quality half-court possessions late in the clock.",
    ]
    if opponent["spacing_score"] >= 65:
        factors.append("Limit clean catch-and-shoot threes and make closeouts without overhelping.")
    if opponent["rim_pressure_score"] >= 65:
        factors.append("Wall off paint touches without sending the opponent to the foul line.")
    return factors[:5]


def compare_matchup(team_a: dict[str, Any], team_b: dict[str, Any]) -> dict[str, Any]:
    team_a_prediction = build_prediction_breakdown(team_a, team_b)
    team_b_prediction = build_prediction_breakdown(team_b, team_a)
    edge_value = round(team_a_prediction.matchup_score - team_b_prediction.matchup_score, 1)
    team_a_probability = logistic_probability(edge_value)
    team_b_probability = round(100 - team_a_probability, 1)

    winner = team_a if edge_value >= 0 else team_b
    confidence = abs(edge_value)
    if confidence < 3:
        edge_label = "True toss-up by regular-season profile"
    elif confidence < 8:
        edge_label = f"{winner['name']} has a narrow matchup edge"
    else:
        edge_label = f"{winner['name']} has the clearer matchup edge"

    upset_warning = upset_risk(team_a, team_b, team_a_prediction, team_b_prediction)
    battles = [
        {"label": "Offensive edge", "team_a": team_a_prediction.efficiency_edge, "team_b": team_b_prediction.efficiency_edge, "note": "Regular-season offensive quality against opponent defensive profile."},
        {"label": "Rim protection resistance", "team_a": team_a_prediction.rim_protection_resistance, "team_b": team_b_prediction.rim_protection_resistance, "note": "How well each defense can withstand the opponent's paint pressure."},
        {"label": "Tempo control edge", "team_a": team_a_prediction.tempo_control_edge, "team_b": team_b_prediction.tempo_control_edge, "note": "Ability to impose pace or punish transition defense."},
        {"label": "Shooting edge", "team_a": team_a_prediction.shooting_profile_edge, "team_b": team_b_prediction.shooting_profile_edge, "note": "Spacing and three-point volume against opponent allowances."},
        {"label": "Rebounding edge", "team_a": team_a_prediction.rebounding_edge, "team_b": team_b_prediction.rebounding_edge, "note": "Offensive glass pressure against defensive rebounding."},
        {"label": "Turnover pressure edge", "team_a": team_a_prediction.turnover_pressure_edge, "team_b": team_b_prediction.turnover_pressure_edge, "note": "Ball security against defensive disruption."},
        {"label": "Free throw pressure edge", "team_a": team_a_prediction.free_throw_pressure_edge, "team_b": team_b_prediction.free_throw_pressure_edge, "note": "Rim pressure, foul drawing, and foul prevention."},
        {"label": "Volatility edge", "team_a": team_a_prediction.volatility_edge, "team_b": team_b_prediction.volatility_edge, "note": "Variance paths through threes, tempo, and pressure."},
    ]
    underdog = team_a if team_a["seed"] > team_b["seed"] else team_b
    favorite = team_b if underdog is team_a else team_a

    return {
        "team_a": team_a,
        "team_b": team_b,
        "overall_edge": edge_label,
        "edge_value": edge_value,
        "predicted_winner": winner["name"],
        "team_a_win_probability": team_a_probability,
        "team_b_win_probability": team_b_probability,
        "team_a_prediction": team_a_prediction.as_dict(),
        "team_b_prediction": team_b_prediction.as_dict(),
        "team_a_attack": team_a_prediction.as_dict(),
        "team_b_attack": team_b_prediction.as_dict(),
        "battles": battles,
        "upset_warning": upset_warning,
        "why_edge": component_explanations(winner, team_b if winner is team_a else team_a, team_a_prediction if winner is team_a else team_b_prediction),
        "underdog_path": component_explanations(underdog, favorite, team_a_prediction if underdog is team_a else team_b_prediction)[:4],
        "flip_factors": flip_factors(team_b if winner is team_a else team_a, winner),
    }


def upset_risk(
    team_a: dict[str, Any],
    team_b: dict[str, Any],
    team_a_prediction: PredictionBreakdown,
    team_b_prediction: PredictionBreakdown,
) -> str:
    lower, favorite, lower_prediction = (
        (team_a, team_b, team_a_prediction) if team_a["seed"] > team_b["seed"] else (team_b, team_a, team_b_prediction)
    )
    if lower["seed"] == favorite["seed"]:
        return "No seed-based upset context."
    indicators = upset_indicators(lower, favorite)
    if lower_prediction.matchup_score >= 51 and len(indicators) >= 2:
        return f"Upset alert: {lower['name']} has a realistic regular-season matchup path against {favorite['name']}."
    if len(indicators) >= 2:
        return f"Upset watch: {lower['name']} has pressure points, but the profile edge is still contested."
    return "No strong upset warning from the regular-season matchup profile."


def upset_indicators(lower_seed: dict[str, Any], favorite: dict[str, Any]) -> list[str]:
    indicators: list[str] = []
    if lower_seed["defensive_disruption_score"] >= 68 and favorite["ball_security_score"] <= 45:
        indicators.append("turnover pressure against a turnover-prone favorite")
    if lower_seed["glass_pressure_score"] >= 68 and favorite["defensive_rebound_score"] <= 45:
        indicators.append("offensive rebounding path against a weak defensive glass")
    if lower_seed["three_point_attempt_rate"] >= 42 and lower_seed["shot_quality_score"] >= 58:
        indicators.append("high three-point volume and shooting volatility")
    if abs(lower_seed["tempo_score"] - favorite["tempo_score"]) >= 35 and lower_seed["tempo_score"] >= 62:
        indicators.append("tempo disruption")
    if favorite["spacing_score"] >= 76 and favorite["rim_pressure_score"] <= 45:
        indicators.append("favorite depends heavily on perimeter creation")
    if favorite["opponent_free_throw_rate_score"] >= 62:
        indicators.append("favorite has foul-prevention risk")
    return indicators


def insight_rules(attacker: dict[str, Any], defender: dict[str, Any]) -> list[str]:
    insights: list[str] = []
    if attacker["glass_pressure_score"] >= 70 and defender["defensive_rebound_score"] <= 45:
        insights.append(f"{attacker['name']} should aggressively attack the offensive glass because {defender['name']} has struggled to finish defensive possessions.")
    if attacker["spacing_score"] >= 70 and defender["opponent_three_point_attempt_rate_score"] >= 62:
        insights.append(f"{attacker['name']} can create drive-and-kick threes and force {defender['name']} into long closeouts.")
    if attacker["defensive_disruption_score"] >= 70 and defender["ball_security_score"] <= 45:
        insights.append(f"{attacker['name']} can speed the game up with pressure because {defender['name']} has ball-security risk.")
    if attacker["rim_pressure_score"] >= 68 and defender["rim_protection_score"] <= 48:
        insights.append(f"{attacker['name']} should test the rim early because {defender['name']} lacks strong rim-protection indicators.")
    if attacker["tempo_score"] >= 72 and defender["transition_defense_score"] <= 45:
        insights.append(f"{attacker['name']} should push pace before {defender['name']} gets its half-court defense organized.")
    if attacker["free_throw_rate_score"] >= 65 and defender["opponent_free_throw_rate_score"] >= 60:
        insights.append(f"{attacker['name']} can pressure the foul line if it keeps attacking gaps and mismatches.")
    if not insights:
        strengths = sorted(
            [
                ("spacing and shot quality", attacker["spacing_score"]),
                ("rim pressure", attacker["rim_pressure_score"]),
                ("ball security", attacker["ball_security_score"]),
                ("offensive rebounding", attacker["glass_pressure_score"]),
                ("turnover pressure", attacker["defensive_disruption_score"]),
                ("rim protection", attacker["rim_protection_score"]),
                ("transition defense", attacker["transition_defense_score"]),
                ("defensive rebounding", attacker["defensive_rebound_score"]),
            ],
            key=lambda item: item[1],
            reverse=True,
        )
        top_strengths = [label for label, score in strengths[:3] if score >= 50]
        if not top_strengths:
            top_strengths = [strengths[0][0]]
        strength_text = ", ".join(top_strengths[:-1]) + f", and {top_strengths[-1]}" if len(top_strengths) > 1 else top_strengths[0]
        insights.append(f"{attacker['name']} can benefit by leaning into {strength_text}.")
    return insights


def generate_identity(team: dict[str, Any]) -> str:
    traits: list[str] = []
    concerns: list[str] = []
    if team["tempo_score"] >= 68:
        traits.append("plays fast")
    if team["spacing_score"] >= 68:
        traits.append("stretches defenses")
    if team["rim_pressure_score"] >= 68:
        traits.append("creates rim pressure")
    if team["glass_pressure_score"] >= 68:
        traits.append("attacks the offensive glass")
    if team["defensive_disruption_score"] >= 68:
        traits.append("generates turnover pressure")
    if team["ball_security_score"] <= 45:
        concerns.append("turnovers")
    if team["defensive_rebound_score"] <= 45:
        concerns.append("defensive rebounding")
    if team["transition_defense_score"] <= 45:
        concerns.append("transition defense")
    if team["rim_protection_score"] <= 45:
        concerns.append("rim protection")
    trait_text = ", ".join(traits) if traits else "has a balanced regular-season profile"
    if concerns:
        return f"{team['name']} {trait_text}, but the regular-season profile flags {', '.join(concerns)} as matchup concerns."
    return f"{team['name']} {trait_text} with no extreme weakness in the demo tournament field."

