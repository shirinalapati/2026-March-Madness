export type TeamSummary = {
  id: string;
  name: string;
  seed: number;
  region: string;
  conference: string;
  overall_record: string;
  season: string;
  data_label: string;
  source_note?: string;
  tempo_score: number;
  spacing_score: number;
  rim_pressure_score: number;
  glass_pressure_score: number;
  defensive_disruption_score: number;
  rim_protection_score: number;
};

export type Team = TeamSummary & {
  adjusted_offensive_rating: number;
  pace: number;
  effective_field_goal_percentage: number;
  turnover_rate: number;
  offensive_rebound_rate: number;
  free_throw_rate: number;
  three_point_attempt_rate: number;
  assist_rate: number;
  rim_pressure_proxy: number;
  transition_frequency_proxy: number;
  adjusted_defensive_rating: number;
  opponent_effective_field_goal_percentage: number;
  forced_turnover_rate: number;
  defensive_rebound_rate: number;
  opponent_free_throw_rate: number;
  opponent_three_point_attempt_rate: number;
  rim_protection_proxy: number;
  transition_defense_proxy: number;
  volatility_score: number;
  true_shooting_pct?: number;
  opp_true_shooting_pct?: number;
  rating_diff?: number;
  ball_security_score: number;
  transition_defense_score: number;
  shot_quality_score: number;
  defensive_rebound_score: number;
  opponent_three_point_attempt_rate_score: number;
  opponent_free_throw_rate_score: number;
  free_throw_rate_score: number;
  identity_paragraph: string;
};

export type TrendPoint = {
  game_date: string;
  opponent_id: string;
  offensive_rating: number;
  defensive_rating: number;
  possessions: number;
};

export type TeamProfile = {
  team: Team;
  trends: TrendPoint[];
  strengths: Array<{ label: string; score: number }>;
  weaknesses: Array<{ label: string; score: number }>;
  metric_ranks: Record<string, number>;
  style_ranks: Record<string, number>;
  rank_count: number;
};

export type PredictionBreakdown = {
  efficiency_edge: number;
  shooting_profile_edge: number;
  turnover_pressure_edge: number;
  rebounding_edge: number;
  rim_pressure_edge: number;
  rim_protection_resistance: number;
  tempo_control_edge: number;
  free_throw_pressure_edge: number;
  volatility_edge: number;
  seed_context_adjustment: number;
  matchup_score: number;
  weighted_score?: number;
};

export type Battle = {
  label: string;
  team_a: number;
  team_b: number;
  note: string;
};

export type MatchupResult = {
  team_a: Team;
  team_b: Team;
  overall_edge: string;
  edge_value: number;
  predicted_winner: string;
  team_a_win_probability: number;
  team_b_win_probability: number;
  team_a_prediction: PredictionBreakdown;
  team_b_prediction: PredictionBreakdown;
  team_a_attack: PredictionBreakdown;
  team_b_attack: PredictionBreakdown;
  battles: Battle[];
  upset_warning: string;
  why_edge: string[];
  underdog_path: string[];
  flip_factors: string[];
};

export type ScoutingReport = {
  matchup: MatchupResult;
  sections: {
    matchup_summary: string;
    why_team_a_can_win: string[];
    why_team_b_can_win: string[];
    team_a_attack_plan: string[];
    team_b_attack_plan: string[];
    key_advantages: string[];
    key_vulnerabilities: string[];
    key_pressure_points: string[];
    tactical_pressure_points: string[];
    upset_risk: string[];
    tactical_game_plan: string[];
    what_to_watch: string[];
    data_caveats: string[];
  };
};
