import { useEffect, useState } from "react";
import { Card, SectionHeader } from "../components/Card";
import { TeamSelect } from "../components/TeamSelect";
import { getScoutingReport, getTeams } from "../lib/api";
import { readSavedMatchupSelection, saveMatchupSelection } from "../lib/matchupSelection";
import type { ScoutingReport as ScoutingReportType, TeamSummary } from "../types";

function ReportSection({ title, items }: { title: string; items: string[] }) {
  return (
    <Card>
      <h3 className="text-xl font-bold text-white">{title}</h3>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <p key={item} className="rounded-2xl border border-white/10 bg-court-900/70 p-4 text-sm leading-6 text-slate-300">
            {item}
          </p>
        ))}
      </div>
    </Card>
  );
}

export function ScoutingReport() {
  const savedSelection = readSavedMatchupSelection();
  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const [teamAId, setTeamAId] = useState(savedSelection?.teamAId ?? "duke");
  const [teamBId, setTeamBId] = useState(savedSelection?.teamBId ?? "houston");
  const [report, setReport] = useState<ScoutingReportType | null>(null);

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
      getScoutingReport(teamAId, teamBId).then(setReport);
    }
  }, [teamAId, teamBId]);

  if (!report) return <p className="text-slate-300">Building scouting report...</p>;
  const { matchup, sections } = report;

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Scouting Report"
        title={`${matchup.team_a.name} vs ${matchup.team_b.name}`}
        copy="Rule-based scouting report using regular-season profiles only. It explains the matchup edge without using tournament results."
      />
      <Card>
        <div className="grid gap-4 md:grid-cols-2">
          <TeamSelect label="Team A" teams={teams} value={teamAId} onChange={setTeamAId} />
          <TeamSelect label="Team B" teams={teams} value={teamBId} onChange={setTeamBId} />
        </div>
      </Card>

      <Card className="border-court-gold/30">
        <p className="text-xs uppercase tracking-[0.25em] text-court-gold">Matchup Summary</p>
        <h3 className="mt-3 text-3xl font-black text-white">{sections.matchup_summary}</h3>
        <p className="mt-3 text-slate-300">
          {matchup.team_a.name} matchup confidence: {matchup.team_a_win_probability.toFixed(1)}%. {matchup.team_b.name} matchup confidence:{" "}
          {matchup.team_b_win_probability.toFixed(1)}%. Projected matchup edge: {matchup.predicted_winner}.
        </p>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <ReportSection title={`Why ${matchup.team_a.name} Can Win`} items={sections.why_team_a_can_win} />
        <ReportSection title={`Why ${matchup.team_b.name} Can Win`} items={sections.why_team_b_can_win} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <ReportSection title="Key Advantages" items={sections.key_advantages} />
        <ReportSection title="Key Vulnerabilities" items={sections.key_vulnerabilities} />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <ReportSection title="Key Pressure Points" items={sections.key_pressure_points} />
        <ReportSection title="Upset Risk" items={sections.upset_risk} />
        <ReportSection title="Tactical Game Plan" items={sections.tactical_game_plan} />
      </div>
    </div>
  );
}
