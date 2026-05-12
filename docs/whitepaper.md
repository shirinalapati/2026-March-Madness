# CourtVision White Paper

## March Madness Matchup Intelligence From Regular-Season Team Profiles

CourtVision is a scouting and bracket-strategy product for the 2026 NCAA men's basketball tournament field. It evaluates the 64 main bracket teams using 2025-2026 regular-season data and explains which team has the cleaner matchup path in a selected head-to-head game.

The goal is not to create a betting model or guarantee winners. CourtVision is designed to make basketball reasoning more transparent: shooting profile, turnover pressure, rebounding, rim pressure, tempo, defensive resistance, volatility, and seed context are translated into plain-English matchup intelligence.

## Product Question

CourtVision answers one central question:

> Using regular-season data, which tournament team has the matchup edge, and why?

Traditional dashboards show team rankings and raw statistics. CourtVision turns those inputs into matchup-specific scouting language. A team can be weaker overall but still have a realistic path if its style attacks an opponent weakness, such as offensive rebounding against a poor defensive glass team or turnover pressure against a ball-security risk.

## Data Scope

The project uses:

- 2025-2026 NCAA men's basketball regular-season data only.
- The 64 main March Madness bracket teams.
- Public bracket sources for team, seed, region, conference, and record information.
- Public regular-season possession-based team metrics from StatSharp.

Tournament results are not used in the scoring process. The model does not include injuries, film grading, lineup-level matchup assignments, or private tracking data. Some tactical concepts are represented with transparent proxies because public data does not expose every possession type.

## Normalized Style Scores

CourtVision creates 0-100 style scores by normalizing raw regular-season metrics across the 64-team tournament field. These are not subjective grades. They are derived metrics that allow teams to be compared on the same scale.

Examples:

- Tempo Score: derived from pace.
- Spacing Score: derived from three-point attempt rate and effective field goal percentage.
- Ball Security Score: derived from turnover rate, inverted so lower turnover rates produce higher scores.
- Glass Pressure Score: derived from offensive rebounding rate.
- Defensive Disruption Score: derived from forced turnover rate.
- Shot Quality Score: derived from effective field goal percentage.
- Defensive Rebounding Score: derived from defensive rebounding rate.
- Rim Pressure Score: proxy derived from offensive rebounding and estimated free throw pressure.
- Rim Protection Score: proxy derived from opponent effective field goal percentage and adjusted defensive rating.
- Transition Defense Score: proxy derived from adjusted defensive rating and forced turnover rate.
- Volatility Score: derived from three-point volume, pace difference, and seed context.

Because the scores are field-relative, a score of 80 means "strong compared with this tournament field," not an absolute national rating.

## Matchup Formula

For each selected matchup, CourtVision calculates a path score for both teams:

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

The weights are a transparent scouting heuristic, not an AI-trained prediction model. Efficiency receives the largest weight because it is the broadest baseline signal. Shooting, turnovers, and rebounding are weighted heavily because they create common tournament upset paths. Rim pressure, rim protection, tempo, free throws, and volatility add tactical context. Seed context is intentionally small so basketball matchup factors matter more than bracket reputation.

## Matchup Confidence

After both teams receive path scores, CourtVision calculates the score edge and converts it into matchup confidence. This is not a betting probability. It is a confidence-style representation of which team has the cleaner statistical and tactical path based on regular-season indicators.

For example, if Team A has a path score of 56 and Team B has a path score of 49, CourtVision reads that as Team A having the cleaner matchup path. The confidence percentage communicates the strength of that edge, not a guaranteed outcome.

## Scouting Report Generation

The scouting report is rule-based. It identifies tactical pressure points such as:

- Offensive rebounding against weak defensive rebounding.
- Spacing and three-point volume against opponent shot-profile risk.
- Defensive disruption against poor ball security.
- Rim pressure against limited rim protection.
- Tempo pressure against transition defense concerns.
- Free throw pressure against foul-prevention risk.

When no single hard rule dominates, the report still names the team's strongest profile traits so the user can understand how that team can benefit from its strengths.

## Limitations

CourtVision should be treated as decision support, not truth. It does not fully capture:

- Player injuries or availability.
- Coaching adjustments.
- Lineup-specific matchups.
- Game location and travel effects.
- Film-level scheme details.
- Late-season form beyond generated game-log trend context.
- Random shooting variance.

The model is useful because it is transparent. Users can inspect the formula, source metrics, style scores, and generated explanations instead of relying on a black-box prediction.

## Deployment Architecture

The app is built as:

- React, TypeScript, Vite, and Tailwind frontend.
- FastAPI backend.
- SQLite demo database generated from bundled CSV files.
- Pandas-free runtime scoring logic based on Python dictionaries and SQL rows.
