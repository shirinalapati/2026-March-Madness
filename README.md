# CourtVision: March Madness Matchup Intelligence

CourtVision is a March Madness matchup intelligence app for the 64 main bracket teams.

Central question:

> Using regular-season data, which tournament team has the matchup edge, and why?

The app evaluates tournament teams from regular-season profiles only. It does not train on tournament results and does not include non-tournament teams in the main app.

Current data files:

- `backend/data/tournament_field_2026.csv`: 2026 main bracket field, with First Four winners filled into the 64-team bracket slots.
- `backend/data/statsharp_2026_tournament_stats.csv`: 2025-2026 StatSharp regular-season possession-based metrics for those 64 teams.

The prior generated/sample field has been removed from the backend pipeline.

## Run

Backend:

```bash
cd courtvision-cbb
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
python3 -m backend.scripts.build_demo_data
uvicorn backend.api.main:app --reload
```

Frontend:

```bash
cd courtvision-cbb/frontend
npm install
npm run dev
```

## Pages

- Tournament Overview: all 64 teams grouped by region and seed, plus offensive, defensive, volatility, and matchup-context summary cards.
- Team Profiles: regular-season profile, offensive/defensive identity, style scores, strengths, weaknesses, radar chart, and trend chart.
- Matchup Simulator: any two tournament teams with projected matchup edge, matchup confidence, component edges, and plain-English flip paths.
- Scouting Report: rule-based why-each-team-can-win sections, pressure points, upset risk, game plan, and caveats.
- About This Project: product framing, data boundary, formula, limitations, and interpretation guidance.

## White Paper

See `docs/whitepaper.md` for the project framing, score construction, matchup formula, limitations, and deployment architecture.

## Database Tables

- `tournament_teams`
- `team_regular_season_stats`
- `team_style_metrics`
- `tournament_matchups`
- `matchup_predictions`
- `scouting_reports`

The schema is SQLite-first but PostgreSQL-friendly.

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

## Limitations

- Regular-season data only; tournament results are not used for training.
- The app is limited to the 64 main bracket teams.
- Public data does not fully capture injuries, schemes, matchup assignments, player availability, or film context.
- Free throw, rim pressure, and transition values are transparent proxies when the public source does not expose tracking or play-type data.
- Scores are transparent heuristics for scouting support, not guaranteed predictions.
- This is not a betting model.

