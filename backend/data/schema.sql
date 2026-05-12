CREATE TABLE tournament_teams (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    seed INTEGER NOT NULL,
    region TEXT NOT NULL,
    conference TEXT NOT NULL,
    overall_record TEXT NOT NULL,
    season TEXT NOT NULL,
    data_label TEXT NOT NULL
);

CREATE TABLE team_regular_season_stats (
    team_id TEXT PRIMARY KEY REFERENCES tournament_teams(id),
    adjusted_offensive_rating REAL NOT NULL,
    pace REAL NOT NULL,
    effective_field_goal_percentage REAL NOT NULL,
    turnover_rate REAL NOT NULL,
    offensive_rebound_rate REAL NOT NULL,
    free_throw_rate REAL NOT NULL,
    three_point_attempt_rate REAL NOT NULL,
    assist_rate REAL NOT NULL,
    rim_pressure_proxy REAL NOT NULL,
    transition_frequency_proxy REAL NOT NULL,
    adjusted_defensive_rating REAL NOT NULL,
    opponent_effective_field_goal_percentage REAL NOT NULL,
    forced_turnover_rate REAL NOT NULL,
    defensive_rebound_rate REAL NOT NULL,
    opponent_free_throw_rate REAL NOT NULL,
    opponent_three_point_attempt_rate REAL NOT NULL,
    rim_protection_proxy REAL NOT NULL,
    transition_defense_proxy REAL NOT NULL,
    volatility_score REAL NOT NULL,
    identity_paragraph TEXT NOT NULL
);

CREATE TABLE team_style_metrics (
    team_id TEXT PRIMARY KEY REFERENCES tournament_teams(id),
    tempo_score REAL NOT NULL,
    spacing_score REAL NOT NULL,
    rim_pressure_score REAL NOT NULL,
    ball_security_score REAL NOT NULL,
    glass_pressure_score REAL NOT NULL,
    defensive_disruption_score REAL NOT NULL,
    rim_protection_score REAL NOT NULL,
    transition_defense_score REAL NOT NULL,
    shot_quality_score REAL NOT NULL,
    defensive_rebound_score REAL NOT NULL,
    opponent_three_point_attempt_rate_score REAL NOT NULL,
    opponent_free_throw_rate_score REAL NOT NULL,
    free_throw_rate_score REAL NOT NULL
);

CREATE TABLE tournament_matchups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_a_id TEXT NOT NULL REFERENCES tournament_teams(id),
    team_b_id TEXT NOT NULL REFERENCES tournament_teams(id),
    matchup_label TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE matchup_predictions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    matchup_id INTEGER NOT NULL REFERENCES tournament_matchups(id),
    predicted_winner_id TEXT NOT NULL REFERENCES tournament_teams(id),
    team_a_win_probability REAL NOT NULL,
    team_b_win_probability REAL NOT NULL,
    matchup_score_edge REAL NOT NULL,
    upset_warning TEXT NOT NULL,
    model_version TEXT NOT NULL DEFAULT 'regular-season-heuristic-v1'
);

CREATE TABLE scouting_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    matchup_id INTEGER NOT NULL REFERENCES tournament_matchups(id),
    matchup_summary TEXT NOT NULL,
    why_team_a_can_win TEXT NOT NULL,
    why_team_b_can_win TEXT NOT NULL,
    key_pressure_points TEXT NOT NULL,
    upset_risk TEXT NOT NULL,
    tactical_game_plan TEXT NOT NULL,
    data_caveats TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
