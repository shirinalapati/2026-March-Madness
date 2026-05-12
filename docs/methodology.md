# CourtVision Methodology

CourtVision is a March Madness matchup intelligence app for the 64 main bracket teams.

It answers:

> Using regular-season data, which tournament team has the matchup edge, and why?

## Data Scope

The app uses regular-season team profiles for the 2025-2026 NCAA men's basketball season. Tournament results are not used for training, scoring, or backfilling the model.

The main app is limited to the 64 main March Madness bracket teams. First Four winners are filled into their Round of 64 bracket slots, while First Four-only framing is excluded unless added later.

Bundled source files:

- `backend/data/tournament_field_2026.csv`: 2026 bracket field from NCAA/Yahoo bracket sources.
- `backend/data/statsharp_2026_tournament_stats.csv`: 2025-2026 StatSharp regular-season possession-based metrics for the 64 teams.

## Why Matchups Matter

Raw ranking and seed are not enough. A lower seed may have a real path if its pressure points align with a favorite's weaknesses:

- Turnover pressure against a turnover-prone favorite.
- Offensive rebounding against weak defensive rebounding.
- High three-point volume and shooting volatility.
- Tempo control that disrupts a favorite's preferred game.
- Foul pressure against weak free throw prevention.

## Style Scores

Metrics are normalized from 0-100 across the 64-team tournament field.

Scores include:

- Tempo Score
- Spacing Score
- Rim Pressure Score
- Ball Security Score
- Glass Pressure Score
- Defensive Disruption Score
- Rim Protection Score
- Transition Defense Score
- Shot Quality Score

## Prediction Formula

```text
matchup_score =
0.20 * efficiency_edge
+ 0.12 * shooting_profile_edge
+ 0.12 * turnover_pressure_edge
+ 0.12 * rebounding_edge
+ 0.10 * rim_pressure_edge
+ 0.08 * rim_protection_resistance
+ 0.08 * tempo_control_edge
+ 0.07 * free_throw_pressure_edge
+ 0.06 * volatility_edge
+ 0.05 * seed_context_adjustment
```

The same formula is calculated for both teams. The score difference is converted into matchup confidence. This is a scouting heuristic for matchup path strength, not a betting line or guaranteed prediction.

## Rule-Based Scouting Text

Scouting reports are generated from metric rules.

Example:

If Team A has a high Glass Pressure Score and Team B has a low Defensive Rebounding Score:

> Team A should aggressively attack the offensive glass because Team B has struggled to finish defensive possessions.

## Caveats

- Public NCAA data may not include full tracking data.
- Possession types may be inferred.
- Free throw, rim pressure, and transition values use explicit proxies when the public source does not expose the exact scouting metric.
- Injuries, scheme changes, player availability, matchup assignments, and film context are not fully captured.
- Predictions are transparent heuristics, not guaranteed outcomes.
- CourtVision is a decision-support and scouting tool, not a betting model.

