import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, MetricCard, SectionHeader } from "../components/Card";
import { getOverview, type OverviewData } from "../lib/api";
import type { Team, TeamSummary } from "../types";

function TeamList({ title, note, teams, metric }: { title: string; note: string; teams: Team[]; metric?: (team: Team) => string }) {
  return (
    <Card>
      <h3 className="text-lg font-bold text-white">{title}</h3>
      <p className="mt-2 text-xs leading-5 text-slate-400">{note}</p>
      <div className="mt-4 space-y-2">
        {teams.map((team) => (
          <div key={`${title}-${team.id}`} className="flex items-center justify-between rounded-2xl bg-court-900/70 p-3">
            <div>
              <p className="font-semibold text-white">{team.seed} {team.name}</p>
              <p className="text-xs text-slate-400">{team.region} • {team.conference}</p>
            </div>
            {metric ? <p className="text-lg font-black text-court-gold">{metric(team)}</p> : null}
          </div>
        ))}
      </div>
    </Card>
  );
}

export function Overview() {
  const [data, setData] = useState<OverviewData | null>(null);
  useEffect(() => { getOverview().then(setData); }, []);
  const grouped = useMemo(() => {
    const groups: Record<string, TeamSummary[]> = {};
    data?.teams_by_region.forEach((team) => { groups[team.region] = [...(groups[team.region] ?? []), team].sort((a, b) => a.seed - b.seed); });
    return groups;
  }, [data]);

  if (!data) return <p className="text-slate-300">Loading tournament field...</p>;

  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
        <Card>
        <p className="text-xs uppercase tracking-[0.35em] text-court-gold">64-team main bracket intelligence</p>
          <h2 className="mt-4 max-w-4xl text-4xl font-black tracking-tight text-white md:text-6xl">
            Which tournament team has the matchup edge, and why?
          </h2>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">{data.product_line} CourtVision is built to explain matchup edge through scouting logic, not to make guaranteed predictions.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/matchup-simulator" className="rounded-full bg-court-gold px-5 py-3 font-semibold text-court-950">Simulate Matchup</Link>
            <Link to="/scouting-report" className="rounded-full border border-white/10 px-5 py-3 font-semibold text-white">Build Scouting Report</Link>
          </div>
        </Card>
        <div className="grid gap-4">
          <MetricCard label="Main bracket teams" value={data.team_count} />
          <MetricCard label="Data scope" value="Regular season only" detail={data.data_label} />
        </div>
      </section>

      <SectionHeader title="Tournament Field by Region" copy="All teams shown here are part of the 64-team main bracket data scope." />
      <div className="grid gap-5 lg:grid-cols-4">
        {Object.entries(grouped).map(([region, teams]) => (
          <Card key={region}>
            <h3 className="text-xl font-black text-white">{region}</h3>
            <div className="mt-4 space-y-2">
              {teams.map((team) => (
                <div key={team.id} className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2 text-sm">
                  <span className="font-semibold text-white">{team.seed}. {team.name}</span>
                  <span className="text-slate-400">{team.conference}</span>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        <TeamList title="Strongest Offenses" note="Best regular-season scoring profiles." teams={data.strongest_offensive_profiles} metric={(team) => team.adjusted_offensive_rating.toFixed(1)} />
        <TeamList title="Strongest Defenses" note="Best opponent-suppression profiles." teams={data.strongest_defensive_profiles} metric={(team) => team.adjusted_defensive_rating.toFixed(1)} />
        <TeamList title="Most Volatile" note="Teams with higher upset and variance potential." teams={data.most_volatile_teams} metric={(team) => team.volatility_score.toFixed(1)} />
        <TeamList title="Vulnerable Favorites" note="Higher seeds with exploitable weaknesses." teams={data.upset_vulnerable_higher_seeds} />
        <TeamList title="Dangerous Lower Seeds" note="Lower seeds with specific upset paths." teams={data.dangerous_lower_seeds} />
      </div>
    </div>
  );
}
