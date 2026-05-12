import { buildDemoMatchup, buildDemoProfile, buildDemoScoutingReport, demoTeamSummaries, demoTeams } from "./demoData";
import type { MatchupResult, ScoutingReport, Team, TeamProfile, TeamSummary } from "../types";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api";

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
  return getJson("/teams", () => demoTeamSummaries);
}

export function getTeamProfile(teamId: string): Promise<TeamProfile> {
  return getJson(`/teams/${teamId}`, () => buildDemoProfile(teamId));
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

export function getOverview(): Promise<OverviewData> {
  return getJson("/overview", () => ({
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
  }));
}
