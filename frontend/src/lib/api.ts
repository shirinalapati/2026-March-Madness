import { buildDemoMatchup, buildDemoProfile, buildDemoScoutingReport, demoTeamSummaries, demoTeams } from "./demoData";
import type { MatchupResult, ScoutingReport, Team, TeamProfile, TeamSummary } from "../types";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api";
const demoTeamsById = new Map(demoTeams.map((team) => [team.id, team]));

const numericTeamKeys: Array<keyof Team> = [
  "seed",
  "tempo_score",
  "spacing_score",
  "rim_pressure_score",
  "glass_pressure_score",
  "defensive_disruption_score",
  "rim_protection_score",
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
  "true_shooting_pct",
  "opp_true_shooting_pct",
  "rating_diff",
  "ball_security_score",
  "transition_defense_score",
  "shot_quality_score",
  "defensive_rebound_score",
  "opponent_three_point_attempt_rate_score",
  "opponent_free_throw_rate_score",
  "free_throw_rate_score",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asNumber(value: unknown, fallback: number) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function asString(value: unknown, fallback: string) {
  return typeof value === "string" && value.length ? value : fallback;
}

function normalizeTeam(value: unknown, fallbackId = "duke"): Team {
  const record = isRecord(value) ? value : {};
  const id = asString(record.id, fallbackId);
  const base = demoTeamsById.get(id) ?? demoTeamsById.get(fallbackId) ?? demoTeams[0];
  const normalized = { ...base, ...record } as Team;

  normalized.id = asString(record.id, base.id);
  normalized.name = asString(record.name, base.name);
  normalized.region = asString(record.region, base.region);
  normalized.conference = asString(record.conference, base.conference);
  normalized.overall_record = asString(record.overall_record, base.overall_record);
  normalized.season = asString(record.season, base.season);
  normalized.data_label = asString(record.data_label, base.data_label);
  normalized.identity_paragraph = asString(record.identity_paragraph, base.identity_paragraph);
  numericTeamKeys.forEach((key) => {
    (normalized as Record<keyof Team, unknown>)[key] = asNumber(record[key], Number(base[key]));
  });

  return normalized;
}

function normalizeTeamSummary(value: unknown): TeamSummary {
  const team = normalizeTeam(value);
  const {
    id,
    name,
    seed,
    region,
    conference,
    overall_record,
    season,
    data_label,
    source_note,
    tempo_score,
    spacing_score,
    rim_pressure_score,
    glass_pressure_score,
    defensive_disruption_score,
    rim_protection_score,
  } = team;

  return {
    id,
    name,
    seed,
    region,
    conference,
    overall_record,
    season,
    data_label,
    source_note,
    tempo_score,
    spacing_score,
    rim_pressure_score,
    glass_pressure_score,
    defensive_disruption_score,
    rim_protection_score,
  };
}

function normalizeArray<T>(value: unknown, normalizeItem: (item: unknown) => T, fallback: T[]) {
  return Array.isArray(value) ? value.map(normalizeItem) : fallback;
}

async function getJson<T>(path: string, fallback: () => T): Promise<T> {
  try {
    const response = await fetch(`${API_BASE}${path}`);
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);
    return (await response.json()) as T;
  } catch {
    return fallback();
  }
}

export function getTeams(): Promise<TeamSummary[]> {
  return getJson<unknown>("/teams", () => demoTeamSummaries).then((items) =>
    normalizeArray(items, normalizeTeamSummary, demoTeamSummaries),
  );
}

export function getTeamProfile(teamId: string): Promise<TeamProfile> {
  return getJson<unknown>(`/teams/${teamId}`, () => buildDemoProfile(teamId)).then((profile) =>
    normalizeTeamProfile(profile, teamId),
  );
}

export function getMatchup(teamAId: string, teamBId: string): Promise<MatchupResult> {
  return getJson(`/matchups/${teamAId}/${teamBId}`, () => buildDemoMatchup(teamAId, teamBId));
}

export function getScoutingReport(teamAId: string, teamBId: string): Promise<ScoutingReport> {
  return getJson(`/scouting-report/${teamAId}/${teamBId}`, () => buildDemoScoutingReport(teamAId, teamBId));
}

export type OverviewData = {
  product_line: string;
  team_count: number;
  season_scope: string;
  data_label: string;
  teams_by_region: TeamSummary[];
  strongest_offensive_profiles: Team[];
  strongest_defensive_profiles: Team[];
  most_volatile_teams: Team[];
  upset_vulnerable_higher_seeds: Team[];
  dangerous_lower_seeds: Team[];
};

function buildDemoOverview(): OverviewData {
  return {
    product_line: "Using regular-season data, CourtVision explains which 64-team tournament matchups create an edge and why.",
    team_count: demoTeamSummaries.length,
    season_scope: "2025-2026 regular season profiles for the 64 main bracket teams",
    data_label: demoTeamSummaries[0]?.data_label ?? "",
    teams_by_region: demoTeamSummaries,
    strongest_offensive_profiles: [...demoTeams].sort((a, b) => b.adjusted_offensive_rating - a.adjusted_offensive_rating).slice(0, 5),
    strongest_defensive_profiles: [...demoTeams].sort((a, b) => a.adjusted_defensive_rating - b.adjusted_defensive_rating).slice(0, 5),
    most_volatile_teams: [...demoTeams].sort((a, b) => b.volatility_score - a.volatility_score).slice(0, 5),
    upset_vulnerable_higher_seeds: [...demoTeams].filter((team) => team.seed <= 5).sort((a, b) => a.defensive_rebound_score + a.rim_protection_score - (b.defensive_rebound_score + b.rim_protection_score)).slice(0, 5),
    dangerous_lower_seeds: [...demoTeams].filter((team) => team.seed >= 10).sort((a, b) => b.spacing_score + b.defensive_disruption_score - (a.spacing_score + a.defensive_disruption_score)).slice(0, 5),
  };
}

function normalizeTeamProfile(value: unknown, teamId: string): TeamProfile {
  const fallback = buildDemoProfile(teamId);
  if (!isRecord(value)) return fallback;
  const trendRows = Array.isArray(value.trends) ? value.trends : [];
  const trends = trendRows.length
    ? fallback.trends.map((trend, index) => (isRecord(trendRows[index]) ? { ...trend, ...trendRows[index] } : trend))
    : fallback.trends;

  return {
    team: normalizeTeam(value.team, teamId),
    trends,
    strengths: normalizeArray(value.strengths, (item) => {
      const record = isRecord(item) ? item : {};
      return { label: asString(record.label, "Team strength"), score: asNumber(record.score, 0) };
    }, fallback.strengths),
    weaknesses: normalizeArray(value.weaknesses, (item) => {
      const record = isRecord(item) ? item : {};
      return { label: asString(record.label, "Team weakness"), score: asNumber(record.score, 0) };
    }, fallback.weaknesses),
    metric_ranks: isRecord(value.metric_ranks) ? { ...fallback.metric_ranks, ...value.metric_ranks } as Record<string, number> : fallback.metric_ranks,
    style_ranks: isRecord(value.style_ranks) ? { ...fallback.style_ranks, ...value.style_ranks } as Record<string, number> : fallback.style_ranks,
    rank_count: asNumber(value.rank_count, fallback.rank_count),
  };
}

function normalizeOverview(value: unknown): OverviewData {
  const fallback = buildDemoOverview();
  if (!isRecord(value)) return fallback;

  return {
    product_line: asString(value.product_line, fallback.product_line),
    team_count: asNumber(value.team_count, fallback.team_count),
    season_scope: asString(value.season_scope, fallback.season_scope),
    data_label: asString(value.data_label, fallback.data_label),
    teams_by_region: normalizeArray(value.teams_by_region, normalizeTeamSummary, fallback.teams_by_region),
    strongest_offensive_profiles: normalizeArray(value.strongest_offensive_profiles, normalizeTeam, fallback.strongest_offensive_profiles),
    strongest_defensive_profiles: normalizeArray(value.strongest_defensive_profiles, normalizeTeam, fallback.strongest_defensive_profiles),
    most_volatile_teams: normalizeArray(value.most_volatile_teams, normalizeTeam, fallback.most_volatile_teams),
    upset_vulnerable_higher_seeds: normalizeArray(value.upset_vulnerable_higher_seeds, normalizeTeam, fallback.upset_vulnerable_higher_seeds),
    dangerous_lower_seeds: normalizeArray(value.dangerous_lower_seeds, normalizeTeam, fallback.dangerous_lower_seeds),
  };
}

export function getOverview(): Promise<OverviewData> {
  return getJson<unknown>("/overview", buildDemoOverview).then(normalizeOverview);
}
