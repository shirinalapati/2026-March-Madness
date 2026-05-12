import { useEffect, useState } from "react";
import { MatchupBars } from "../charts/MatchupBars";
import { StyleRadar } from "../charts/StyleRadar";
import { Card, MetricCard, SectionHeader } from "../components/Card";
import { TeamSelect } from "../components/TeamSelect";
import { getMatchup, getTeams } from "../lib/api";
import { scoreTone } from "../lib/format";
import { readSavedMatchupSelection, saveMatchupSelection } from "../lib/matchupSelection";
import type { MatchupResult, TeamSummary } from "../types";

export function MatchupSimulator() {
  const savedSelection = readSavedMatchupSelection();
  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const [teamAId, setTeamAId] = useState(savedSelection?.teamAId ?? "duke");
  const [teamBId, setTeamBId] = useState(savedSelection?.teamBId ?? "houston");
  const [matchup, setMatchup] = useState<MatchupResult | null>(null);

  useEffect(() => {
    getTeams().then((items) => {
      setTeams(items);
      const hasSavedTeams = items.some((team) => team.id === teamAId) && items.some((team) => team.id === teamBId) && teamAId !== teamBId;
      if (!hasSavedTeams && items.length >= 2) {
        setTeamAId(items[0].id);
        setTeamBId(items[1].id);
      }
    });
  }, []);

  useEffect(() => {
    if (teamAId !== teamBId) {
      saveMatchupSelection({ teamAId, teamBId });
      getMatchup(teamAId, teamBId).then(setMatchup);
    }
  }, [teamAId, teamBId]);

  if (!matchup) return <p className="text-slate-300">Loading matchup simulator...</p>;

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Matchup Simulator"
        title="Which tournament team has the matchup edge, and why?"
        copy="This scouting heuristic uses regular-season team profiles only. Tournament results are not used, and the emphasis is basketball logic rather than black-box prediction."
      />
      <Card>
        <div className="grid gap-4 md:grid-cols-2">
          <TeamSelect label="Team A" teams={teams} value={teamAId} onChange={setTeamAId} />
          <TeamSelect label="Team B" teams={teams} value={teamBId} onChange={setTeamBId} />
        </div>
        {teamAId === teamBId ? <p className="mt-3 text-sm text-orange-300">Choose two different teams.</p> : null}
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Projected matchup edge" value={matchup.overall_edge} detail={`Projected winner: ${matchup.predicted_winner}`} />
        <MetricCard label={`${matchup.team_a.name} matchup confidence`} value={`${matchup.team_a_win_probability.toFixed(1)}%`} detail={`Path score: ${matchup.team_a_prediction.matchup_score.toFixed(1)}`} />
        <MetricCard label={`${matchup.team_b.name} matchup confidence`} value={`${matchup.team_b_win_probability.toFixed(1)}%`} detail={`Path score: ${matchup.team_b_prediction.matchup_score.toFixed(1)}`} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.05fr_.95fr]">
        <Card className="border-court-lime/30">
          <p className="text-xs uppercase tracking-[0.25em] text-court-lime">Matchup Read</p>
          <p className="mt-3 text-2xl font-black text-white">{matchup.predicted_winner} has the cleaner matchup path.</p>
        </Card>
        <Card className="border-orange-300/30">
          <p className="text-xs uppercase tracking-[0.25em] text-orange-300">Upset context</p>
          <p className="mt-3 text-lg font-semibold text-white">{matchup.upset_warning}</p>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card>
          <SectionHeader title={`Why ${matchup.predicted_winner} has the edge`} />
          <div className="space-y-3">
            {matchup.why_edge.map((item) => (
              <p key={item} className="rounded-2xl bg-court-900/70 p-3 text-sm leading-6 text-slate-200">{item}</p>
            ))}
          </div>
        </Card>
        <Card>
          <SectionHeader title="How the underdog can win" />
          <div className="space-y-3">
            {matchup.underdog_path.map((item) => (
              <p key={item} className="rounded-2xl bg-court-900/70 p-3 text-sm leading-6 text-slate-200">{item}</p>
            ))}
          </div>
        </Card>
        <Card>
          <SectionHeader title="What could flip the matchup" />
          <div className="space-y-3">
            {matchup.flip_factors.map((item) => (
              <p key={item} className="rounded-2xl bg-court-900/70 p-3 text-sm leading-6 text-slate-200">{item}</p>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[.95fr_1.05fr]">
        <Card>
          <SectionHeader title="Style Comparison" />
          <StyleRadar team={matchup.team_a} comparison={matchup.team_b} />
        </Card>
        <Card>
          <SectionHeader title="Matchup Component Scores" copy="Higher means that side has a cleaner matchup path from regular-season indicators. These are interpretation aids, not guaranteed predictions." />
          <MatchupBars battles={matchup.battles} teamAName={matchup.team_a.name} teamBName={matchup.team_b.name} />
        </Card>
      </div>

      <Card>
        <SectionHeader title="Matchup Comparison Table" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-separate border-spacing-y-2 text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.2em] text-slate-400">
              <tr>
                <th className="px-3 py-2">Battle</th>
                <th className="px-3 py-2">{matchup.team_a.name}</th>
                <th className="px-3 py-2">{matchup.team_b.name}</th>
                <th className="px-3 py-2">Scouting note</th>
              </tr>
            </thead>
            <tbody>
              {matchup.battles.map((battle) => (
                <tr key={battle.label} className="bg-court-900/70">
                  <td className="rounded-l-2xl px-3 py-4 font-semibold text-white">{battle.label}</td>
                  <td className={`px-3 py-4 text-xl font-black ${scoreTone(battle.team_a)}`}>{battle.team_a.toFixed(1)}</td>
                  <td className={`px-3 py-4 text-xl font-black ${scoreTone(battle.team_b)}`}>{battle.team_b.toFixed(1)}</td>
                  <td className="rounded-r-2xl px-3 py-4 text-slate-300">{battle.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
