import { tournamentTeams } from "./tournamentData";
import type { MatchupResult, ScoutingReport, Team, TeamProfile, TeamSummary } from "../types";

export const demoTeams: Team[] = tournamentTeams;

const byId = (id: string) => demoTeams.find((team) => team.id === id) ?? demoTeams[0];
const clamp = (value: number) => Math.max(0, Math.min(100, value));
const centered = (edge: number) => Math.round(clamp(50 + edge / 2) * 10) / 10;

function rankFor(team: Team, key: keyof Team, lowerIsBetter = false) {
  const sorted = [...demoTeams].sort((a, b) => {
    const aValue = Number(a[key]);
    const bValue = Number(b[key]);
    return lowerIsBetter ? aValue - bValue : bValue - aValue;
  });
  const value = Number(team[key]);
  return sorted.findIndex((item) => Number(item[key]) === value) + 1;
}

export const demoTeamSummaries: TeamSummary[] = demoTeams.map(
  ({ id, name, seed, region, conference, overall_record, season, data_label, tempo_score, spacing_score, rim_pressure_score, glass_pressure_score, defensive_disruption_score, rim_protection_score }) => ({
    id,
    name,
    seed,
    region,
    conference,
    overall_record,
    season,
    data_label,
    tempo_score,
    spacing_score,
    rim_pressure_score,
    glass_pressure_score,
    defensive_disruption_score,
    rim_protection_score,
  }),
);

export function buildDemoProfile(teamId: string): TeamProfile {
  const team = byId(teamId);
  const [wins, losses] = team.overall_record.split("-").map(Number);
  const gameCount = wins + losses;
  const startDate = new Date("2025-11-08T00:00:00");
  const endDate = new Date("2026-03-07T00:00:00");
  const dateStep = (endDate.getTime() - startDate.getTime()) / Math.max(gameCount - 1, 1);
  const trends = Array.from({ length: gameCount }, (_, index) => {
    const gameDate = new Date(startDate.getTime() + dateStep * index).toISOString().slice(0, 10);
    const lateSeasonSlope = (index / Math.max(gameCount - 1, 1) - 0.5) * 4;
    return {
    game_date: gameDate,
    opponent_id: `Regular Season Sample ${index + 1}`,
    offensive_rating: Math.round((team.adjusted_offensive_rating + lateSeasonSlope + Math.sin(index * 0.8) * 5) * 10) / 10,
    defensive_rating: Math.round((team.adjusted_defensive_rating - lateSeasonSlope / 2 + Math.cos(index * 0.7) * 4) * 10) / 10,
    possessions: Math.round((team.pace + Math.sin(index * 0.6) * 3) * 10) / 10,
    };
  });
  const entries = [
    ["Tempo", team.tempo_score],
    ["Spacing", team.spacing_score],
    ["Rim Pressure", team.rim_pressure_score],
    ["Ball Security", team.ball_security_score],
    ["Glass Pressure", team.glass_pressure_score],
    ["Defensive Disruption", team.defensive_disruption_score],
    ["Rim Protection", team.rim_protection_score],
    ["Transition Defense", team.transition_defense_score],
    ["Shot Quality", team.shot_quality_score],
  ] as const;
  return {
    team,
    trends,
    strengths: entries.filter(([, score]) => score >= 68).map(([label, score]) => ({ label, score })),
    weaknesses: entries.filter(([, score]) => score <= 45).map(([label, score]) => ({ label, score })),
    metric_ranks: {
      seed: rankFor(team, "seed", true),
      adjusted_offensive_rating: rankFor(team, "adjusted_offensive_rating"),
      adjusted_defensive_rating: rankFor(team, "adjusted_defensive_rating", true),
      volatility_score: rankFor(team, "volatility_score"),
    },
    style_ranks: {
      tempo_score: rankFor(team, "tempo_score"),
      spacing_score: rankFor(team, "spacing_score"),
      rim_pressure_score: rankFor(team, "rim_pressure_score"),
      ball_security_score: rankFor(team, "ball_security_score"),
      glass_pressure_score: rankFor(team, "glass_pressure_score"),
      defensive_disruption_score: rankFor(team, "defensive_disruption_score"),
      rim_protection_score: rankFor(team, "rim_protection_score"),
      transition_defense_score: rankFor(team, "transition_defense_score"),
      shot_quality_score: rankFor(team, "shot_quality_score"),
      defensive_rebound_score: rankFor(team, "defensive_rebound_score"),
    },
    rank_count: demoTeams.length,
  };
}

function prediction(offense: Team, defense: Team) {
  const result = {
    efficiency_edge: centered((offense.adjusted_offensive_rating - defense.adjusted_defensive_rating) - (defense.adjusted_offensive_rating - offense.adjusted_defensive_rating)),
    shooting_profile_edge: centered((offense.spacing_score * 0.55 + offense.shot_quality_score * 0.45) - (defense.opponent_three_point_attempt_rate_score * 0.55 + (100 - defense.rim_protection_score) * 0.45)),
    turnover_pressure_edge: centered((offense.ball_security_score - defense.defensive_disruption_score) * 0.8),
    rebounding_edge: centered(offense.glass_pressure_score - defense.defensive_rebound_score),
    rim_pressure_edge: centered(offense.rim_pressure_score - defense.rim_protection_score),
    rim_protection_resistance: centered(offense.rim_protection_score - defense.rim_pressure_score),
    tempo_control_edge: centered((offense.tempo_score - (100 - defense.transition_defense_score)) * 0.65),
    free_throw_pressure_edge: centered(offense.free_throw_rate_score - defense.opponent_free_throw_rate_score),
    volatility_edge: centered((offense.volatility_score - defense.volatility_score) + (offense.seed > defense.seed && offense.three_point_attempt_rate >= 42 ? 4 : 0)),
    seed_context_adjustment: centered((defense.seed - offense.seed) * 2.2),
    matchup_score: 0,
  };
  result.matchup_score =
    Math.round(
      (0.2 * result.efficiency_edge +
        0.12 * result.shooting_profile_edge +
        0.12 * result.turnover_pressure_edge +
        0.12 * result.rebounding_edge +
        0.1 * result.rim_pressure_edge +
        0.08 * result.rim_protection_resistance +
        0.08 * result.tempo_control_edge +
        0.07 * result.free_throw_pressure_edge +
        0.06 * result.volatility_edge +
        0.05 * result.seed_context_adjustment) *
        10,
    ) / 10;
  return { ...result, weighted_score: result.matchup_score };
}

function componentExplanations(team: Team, opponent: Team, result: ReturnType<typeof prediction>) {
  const entries = [
    ["efficiency_edge", result.efficiency_edge],
    ["shooting_profile_edge", result.shooting_profile_edge],
    ["turnover_pressure_edge", result.turnover_pressure_edge],
    ["rebounding_edge", result.rebounding_edge],
    ["rim_pressure_edge", result.rim_pressure_edge],
    ["rim_protection_resistance", result.rim_protection_resistance],
    ["tempo_control_edge", result.tempo_control_edge],
    ["free_throw_pressure_edge", result.free_throw_pressure_edge],
    ["volatility_edge", result.volatility_edge],
    ["seed_context_adjustment", result.seed_context_adjustment],
  ].sort((a, b) => Number(b[1]) - Number(a[1]));
  const text: Record<string, string> = {
    efficiency_edge: `${team.name} has a cleaner efficiency path when its offense is matched against ${opponent.name}'s defensive profile.`,
    shooting_profile_edge: `${team.name}'s spacing and shot quality line up well against the opponent shot-profile indicators.`,
    turnover_pressure_edge: `The ball-security versus disruption matchup favors ${team.name}.`,
    rebounding_edge: `${team.name} can create extra-possession pressure through the glass.`,
    rim_pressure_edge: `${team.name} has a path to pressure the paint against ${opponent.name}'s interior resistance.`,
    rim_protection_resistance: `${team.name}'s rim protection profile is better positioned to withstand the opponent's paint pressure.`,
    tempo_control_edge: `Tempo indicators suggest ${team.name} can move the game toward a more comfortable pace.`,
    free_throw_pressure_edge: `${team.name} can create pressure at the foul line if it keeps attacking gaps.`,
    volatility_edge: `${team.name}'s variance profile gives it more paths if the game becomes style-driven.`,
    seed_context_adjustment: `Seed context gives ${team.name} a small prior, but basketball matchup factors carry most of the score.`,
  };
  return entries.slice(0, 5).map(([key]) => text[String(key)]);
}

function flipFactors(team: Team, opponent: Team) {
  const factors = [
    `Control tempo and keep ${opponent.name} out of its preferred rhythm.`,
    "Win the defensive glass to remove second-chance possessions.",
    "Force lower-quality half-court possessions late in the clock.",
  ];
  if (opponent.spacing_score >= 65) factors.push("Limit clean catch-and-shoot threes and make closeouts without overhelping.");
  if (opponent.rim_pressure_score >= 65) factors.push("Wall off paint touches without sending the opponent to the foul line.");
  return factors.slice(0, 5);
}

function upsetIndicators(lower: Team, favorite: Team): string[] {
  return [
    lower.defensive_disruption_score >= 68 && favorite.ball_security_score <= 45 ? "turnover pressure against a turnover-prone favorite" : "",
    lower.glass_pressure_score >= 68 && favorite.defensive_rebound_score <= 45 ? "offensive rebounding path against weak defensive rebounding" : "",
    lower.three_point_attempt_rate >= 42 && lower.shot_quality_score >= 58 ? "high three-point volume and shooting volatility" : "",
    Math.abs(lower.tempo_score - favorite.tempo_score) >= 35 ? "tempo disruption" : "",
    favorite.opponent_free_throw_rate_score >= 62 ? "favorite has foul-prevention risk" : "",
  ].filter(Boolean);
}

export function buildDemoMatchup(teamAId: string, teamBId: string): MatchupResult {
  const teamA = byId(teamAId);
  const teamB = byId(teamBId);
  const team_a_prediction = prediction(teamA, teamB);
  const team_b_prediction = prediction(teamB, teamA);
  const edge_value = Math.round((team_a_prediction.matchup_score - team_b_prediction.matchup_score) * 10) / 10;
  const team_a_win_probability = Math.round((1 / (1 + Math.exp(-edge_value / 12))) * 1000) / 10;
  const lower = teamA.seed > teamB.seed ? teamA : teamB;
  const favorite = teamA.seed > teamB.seed ? teamB : teamA;
  const indicators = lower.seed === favorite.seed ? [] : upsetIndicators(lower, favorite);
  const upset_warning =
    lower.seed !== favorite.seed && indicators.length >= 2
      ? `Upset watch: ${lower.name} has ${indicators.length} regular-season indicators against ${favorite.name}.`
      : "No strong upset warning from the regular-season matchup profile.";
  const winner = edge_value >= 0 ? teamA : teamB;
  const loser = edge_value >= 0 ? teamB : teamA;
  const winnerPrediction = edge_value >= 0 ? team_a_prediction : team_b_prediction;
  const lowerPrediction = lower.id === teamA.id ? team_a_prediction : team_b_prediction;
  return {
    team_a: teamA,
    team_b: teamB,
    overall_edge: Math.abs(edge_value) < 3 ? "True toss-up by regular-season profile" : `${edge_value > 0 ? teamA.name : teamB.name} has the clearer matchup edge`,
    edge_value,
    predicted_winner: winner.name,
    team_a_win_probability,
    team_b_win_probability: Math.round((100 - team_a_win_probability) * 10) / 10,
    team_a_prediction,
    team_b_prediction,
    team_a_attack: team_a_prediction,
    team_b_attack: team_b_prediction,
    upset_warning,
    why_edge: componentExplanations(winner, loser, winnerPrediction),
    underdog_path: componentExplanations(lower, favorite, lowerPrediction).slice(0, 4),
    flip_factors: flipFactors(loser, winner),
    battles: [
      { label: "Offensive edge", team_a: team_a_prediction.efficiency_edge, team_b: team_b_prediction.efficiency_edge, note: "Regular-season offensive quality against opponent defensive profile." },
      { label: "Rim protection resistance", team_a: team_a_prediction.rim_protection_resistance, team_b: team_b_prediction.rim_protection_resistance, note: "How well each defense can withstand opponent paint pressure." },
      { label: "Tempo control edge", team_a: team_a_prediction.tempo_control_edge, team_b: team_b_prediction.tempo_control_edge, note: "Ability to impose pace or punish transition defense." },
      { label: "Shooting edge", team_a: team_a_prediction.shooting_profile_edge, team_b: team_b_prediction.shooting_profile_edge, note: "Spacing and three-point volume against opponent allowances." },
      { label: "Rebounding edge", team_a: team_a_prediction.rebounding_edge, team_b: team_b_prediction.rebounding_edge, note: "Offensive glass pressure against defensive rebounding." },
      { label: "Turnover pressure edge", team_a: team_a_prediction.turnover_pressure_edge, team_b: team_b_prediction.turnover_pressure_edge, note: "Ball security against defensive disruption." },
      { label: "Free throw pressure edge", team_a: team_a_prediction.free_throw_pressure_edge, team_b: team_b_prediction.free_throw_pressure_edge, note: "Rim pressure, foul drawing, and foul prevention." },
      { label: "Volatility edge", team_a: team_a_prediction.volatility_edge, team_b: team_b_prediction.volatility_edge, note: "Variance paths through threes, tempo, and pressure." },
    ],
  };
}

const rules = (a: Team, b: Team) => {
  const text: string[] = [];
  if (a.glass_pressure_score >= 70 && b.defensive_rebound_score <= 45) text.push(`${a.name} should aggressively attack the offensive glass because ${b.name} has struggled to finish defensive possessions.`);
  if (a.spacing_score >= 70 && b.opponent_three_point_attempt_rate_score >= 62) text.push(`${a.name} can generate drive-and-kick threes and force long closeouts.`);
  if (a.defensive_disruption_score >= 70 && b.ball_security_score <= 45) text.push(`${a.name} can create pressure because ${b.name} has ball-security risk.`);
  if (a.rim_pressure_score >= 68 && b.rim_protection_score <= 48) text.push(`${a.name} should test the rim early.`);
  if (text.length) return text;
  const strengths = [
    ["spacing and shot quality", a.spacing_score],
    ["rim pressure", a.rim_pressure_score],
    ["ball security", a.ball_security_score],
    ["offensive rebounding", a.glass_pressure_score],
    ["turnover pressure", a.defensive_disruption_score],
    ["rim protection", a.rim_protection_score],
    ["transition defense", a.transition_defense_score],
    ["defensive rebounding", a.defensive_rebound_score],
  ]
    .sort((first, second) => Number(second[1]) - Number(first[1]))
    .slice(0, 3)
    .map(([label]) => String(label));
  const strengthText = strengths.length > 1 ? `${strengths.slice(0, -1).join(", ")}, and ${strengths[strengths.length - 1]}` : strengths[0];
  return [`${a.name} can benefit by leaning into ${strengthText}.`];
};

export function buildDemoScoutingReport(teamAId: string, teamBId: string): ScoutingReport {
  const matchup = buildDemoMatchup(teamAId, teamBId);
  return {
    matchup,
    sections: {
      matchup_summary: matchup.overall_edge,
      why_team_a_can_win: rules(matchup.team_a, matchup.team_b),
      why_team_b_can_win: rules(matchup.team_b, matchup.team_a),
      team_a_attack_plan: rules(matchup.team_a, matchup.team_b),
      team_b_attack_plan: rules(matchup.team_b, matchup.team_a),
      key_advantages: [`Projected matchup edge: ${matchup.predicted_winner}.`, `${matchup.team_a.name}: ${matchup.team_a_win_probability}% matchup confidence.`, `${matchup.team_b.name}: ${matchup.team_b_win_probability}% matchup confidence.`],
      key_vulnerabilities: [matchup.upset_warning],
      key_pressure_points: matchup.battles.filter((battle) => Math.max(battle.team_a, battle.team_b) >= 58).map((battle) => battle.label),
      tactical_pressure_points: matchup.battles.filter((battle) => Math.max(battle.team_a, battle.team_b) >= 58).map((battle) => battle.label),
      upset_risk: [matchup.upset_warning],
      tactical_game_plan: [...rules(matchup.team_a, matchup.team_b), ...rules(matchup.team_b, matchup.team_a)],
      what_to_watch: ["Can the lower seed create extra possessions?", "Which team controls tempo?", "Can either team protect the rim without fouling?"],
      data_caveats: ["2025-26 regular-season profile data only; tournament results are not used for training.", "The field is limited to the 64 main bracket teams after First Four winners filled the bracket slots.", "Some public-data metrics are proxies because tracking data and possession types are not fully public.", "Scores are transparent scouting heuristics, not betting recommendations."],
    },
  };
}

