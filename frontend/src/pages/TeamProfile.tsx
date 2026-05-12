import { useEffect, useState } from "react";
import { EfficiencyTrend } from "../charts/EfficiencyTrend";
import { StyleRadar } from "../charts/StyleRadar";
import { Card, MetricCard, SectionHeader } from "../components/Card";
import { TeamSelect } from "../components/TeamSelect";
import { getTeamProfile, getTeams } from "../lib/api";
import { rating, scoreTone } from "../lib/format";
import type { Team, TeamProfile as TeamProfileType, TeamSummary } from "../types";

const strengthLabels: Array<[keyof Team, string]> = [
  ["spacing_score", "spacing and shot quality"],
  ["rim_pressure_score", "paint pressure"],
  ["ball_security_score", "ball security"],
  ["glass_pressure_score", "offensive rebounding"],
  ["defensive_disruption_score", "turnover pressure"],
  ["rim_protection_score", "rim protection"],
  ["transition_defense_score", "transition defense"],
  ["defensive_rebound_score", "defensive rebounding"],
];

const concernLabels: Array<[keyof Team, string]> = [
  ["ball_security_score", "turnover pressure"],
  ["defensive_rebound_score", "second-chance points"],
  ["transition_defense_score", "tempo and early offense"],
  ["rim_protection_score", "paint touches"],
  ["spacing_score", "half-court spacing"],
  ["rim_pressure_score", "rim creation"],
];

function seedContext(team: Team) {
  if (team.seed <= 2) return "high-seed favorite";
  if (team.seed <= 5) return "protected-seed profile";
  if (team.seed <= 8) return "middle-seed profile";
  if (team.seed <= 11) return "dangerous lower-seed profile";
  return "double-digit seed profile";
}

function listText(items: string[]) {
  if (items.length <= 1) return items[0] ?? "balanced play";
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

function tournamentTranslation(team: Team) {
  const strengths = strengthLabels
    .map(([key, label]) => ({ label, score: Number(team[key]) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
  const concerns = concernLabels
    .map(([key, label]) => ({ label, score: Number(team[key]) }))
    .sort((a, b) => a.score - b.score)
    .slice(0, 2);

  const primaryStrengths = strengths.filter((item) => item.score >= 58).map((item) => item.label);
  const riskAreas = concerns.filter((item) => item.score <= 52).map((item) => item.label);
  const profile = seedContext(team);
  const paceStyle = team.tempo_score >= 65 ? "can speed opponents up" : team.tempo_score <= 42 ? "is more comfortable when the game stays organized" : "can live in multiple tempo environments";
  const variance =
    team.volatility_score >= 66
      ? "The variance is real, so shooting swings, pace, and foul pressure can move its tournament outcome quickly."
      : team.volatility_score <= 42
        ? "The profile is less volatile, which helps if it can keep possessions clean and avoid a game-state scramble."
        : "Its variance is moderate, so matchup fit matters more than one extreme boom-or-bust trait.";

  const path = primaryStrengths.length
    ? `${team.name} profiles as a ${profile} built around ${listText(primaryStrengths)}.`
    : `${team.name} profiles as a ${profile} without one overwhelming style score, so its value comes from balance and opponent fit.`;
  const risk = riskAreas.length
    ? `The tournament risk is if opponents can stress ${listText(riskAreas)}.`
    : "The model does not flag one glaring style weakness, so opponents may need to win through execution rather than a single obvious pressure point.";

  return `${path} It ${paceStyle}. ${risk} ${variance}`;
}

function rankText(rank: number | undefined, count: number) {
  return rank ? `Rank #${rank} of ${count}` : "Rank unavailable";
}

export function TeamProfile() {
  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const [teamId, setTeamId] = useState("duke");
  const [profile, setProfile] = useState<TeamProfileType | null>(null);

  useEffect(() => {
    getTeams().then((items) => {
      setTeams(items);
      if (items.length) setTeamId(items[0].id);
    });
  }, []);

  useEffect(() => {
    getTeamProfile(teamId).then(setProfile);
  }, [teamId]);

  if (!profile) return <p className="text-slate-300">Loading team profile...</p>;
  const team = profile.team;
  const styleRank = (key: string) => rankText(profile.style_ranks[key], profile.rank_count);
  const offensiveStyleCards: Array<[string, number, string]> = [
    ["Spacing Score", team.spacing_score, "spacing_score"],
    ["Rim Pressure Score", team.rim_pressure_score, "rim_pressure_score"],
    ["Ball Security Score", team.ball_security_score, "ball_security_score"],
    ["Glass Pressure Score", team.glass_pressure_score, "glass_pressure_score"],
  ];
  const defensiveStyleCards: Array<[string, number, string]> = [
    ["Defensive Disruption", team.defensive_disruption_score, "defensive_disruption_score"],
    ["Rim Protection", team.rim_protection_score, "rim_protection_score"],
    ["Transition Defense", team.transition_defense_score, "transition_defense_score"],
    ["Defensive Rebounding", team.defensive_rebound_score, "defensive_rebound_score"],
  ];
  const radarRanks: Array<[string, string]> = [
    ["Tempo", "tempo_score"],
    ["Spacing", "spacing_score"],
    ["Rim Pressure", "rim_pressure_score"],
    ["Ball Security", "ball_security_score"],
    ["Glass Pressure", "glass_pressure_score"],
    ["Defensive Disruption", "defensive_disruption_score"],
    ["Rim Protection", "rim_protection_score"],
    ["Transition Defense", "transition_defense_score"],
    ["Shot Quality", "shot_quality_score"],
  ];

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Tournament Team Profile"
        title={`${team.region} ${team.seed}-seed ${team.name}`}
        copy="Select one of the 64 main bracket teams to inspect its regular-season profile, style scores, strengths, and matchup vulnerabilities."
      />
      <Card>
        <TeamSelect label="Select team" teams={teams} value={teamId} onChange={setTeamId} />
      </Card>

      <Card className="border-court-teal/30">
        <p className="text-xs uppercase tracking-[0.25em] text-court-teal">Team Identity</p>
        <p className="mt-3 text-lg leading-8 text-white">{team.identity_paragraph}</p>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Seed / record" value={`${team.seed} • ${team.overall_record}`} detail={`${rankText(profile.metric_ranks.seed, profile.rank_count)} seed line`} />
        <MetricCard label="Adj. offensive rating" value={rating(team.adjusted_offensive_rating)} detail={rankText(profile.metric_ranks.adjusted_offensive_rating, profile.rank_count)} />
        <MetricCard label="Adj. defensive rating" value={rating(team.adjusted_defensive_rating)} detail={`${rankText(profile.metric_ranks.adjusted_defensive_rating, profile.rank_count)} (lower is better)`} />
        <MetricCard label="Volatility" value={rating(team.volatility_score)} detail={rankText(profile.metric_ranks.volatility_score, profile.rank_count)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
        <Card>
          <SectionHeader title="Style Radar" copy="These are CourtVision-created 0-100 style scores from raw regular-season stats, normalized against the 64-team field. Extreme edges are where matchup pressure points usually start." />
          <StyleRadar team={team} />
          <div className="mt-5 grid gap-2 sm:grid-cols-3">
            {radarRanks.map(([label, key]) => (
              <p key={key} className="rounded-xl bg-court-900/60 px-3 py-2 text-xs text-slate-300">
                {label}: <span className="font-bold text-court-gold">{styleRank(key)}</span>
              </p>
            ))}
          </div>
        </Card>
        <Card>
          <SectionHeader title="Game-by-Game Efficiency Trend" copy="One trend point per listed regular-season game, spanning November 2025 through early March 2026; postseason rows are excluded." />
          <EfficiencyTrend data={profile.trends} />
        </Card>
      </div>

      <Card>
        <SectionHeader
          title="Tournament Translation"
          copy="Plain-English read on how this regular-season profile tends to travel into a single-elimination matchup."
        />
        <p className="text-lg leading-8 text-slate-200">{tournamentTranslation(team)}</p>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <SectionHeader title="Offensive Identity Cards" />
          <div className="grid gap-3 sm:grid-cols-2">
            {offensiveStyleCards.map(([label, score, key]) => (
              <div key={label} className="rounded-2xl bg-court-900/60 p-4">
                <p className="text-sm text-slate-400">{label}</p>
                <p className={`text-3xl font-black ${scoreTone(Number(score))}`}>{Number(score).toFixed(1)}</p>
                <p className="mt-1 text-xs text-court-gold">{styleRank(key)}</p>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <SectionHeader title="Defensive Identity Cards" />
          <div className="grid gap-3 sm:grid-cols-2">
            {defensiveStyleCards.map(([label, score, key]) => (
              <div key={label} className="rounded-2xl bg-court-900/60 p-4">
                <p className="text-sm text-slate-400">{label}</p>
                <p className={`text-3xl font-black ${scoreTone(Number(score))}`}>{Number(score).toFixed(1)}</p>
                <p className="mt-1 text-xs text-court-gold">{styleRank(key)}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <SectionHeader title="Strengths" />
          <div className="space-y-2">
            {profile.strengths.map((item) => (
              <p key={item.label} className="rounded-2xl border border-court-lime/20 bg-court-lime/10 p-3 text-sm">
                {item.label}: <span className="font-bold text-court-lime">{item.score.toFixed(1)}</span>
              </p>
            ))}
          </div>
        </Card>
        <Card>
          <SectionHeader title="Weaknesses" />
          <div className="space-y-2">
            {profile.weaknesses.length ? (
              profile.weaknesses.map((item) => (
                <p key={item.label} className="rounded-2xl border border-orange-300/20 bg-orange-300/10 p-3 text-sm">
                  {item.label}: <span className="font-bold text-orange-300">{item.score.toFixed(1)}</span>
                </p>
              ))
            ) : (
              <p className="text-slate-300">No major demo-data weakness below the 45 score threshold.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
