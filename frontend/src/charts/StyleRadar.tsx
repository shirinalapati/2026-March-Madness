import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip } from "recharts";
import { styleScoreKeys } from "../lib/format";
import type { Team } from "../types";

export function StyleRadar({ team, comparison }: { team: Team; comparison?: Team }) {
  const data = styleScoreKeys.map((item) => ({
    metric: item.label,
    [team.name]: Number(team[item.key]),
    ...(comparison ? { [comparison.name]: Number(comparison[item.key]) } : {}),
  }));

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer>
        <RadarChart data={data}>
          <PolarGrid stroke="rgba(255,255,255,0.14)" />
          <PolarAngleAxis dataKey="metric" tick={{ fill: "#cbd5e1", fontSize: 11 }} />
          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: "#94a3b8", fontSize: 10 }} />
          <Tooltip contentStyle={{ background: "#0b171d", border: "1px solid rgba(255,255,255,.12)", borderRadius: 16 }} />
          <Radar name={team.name} dataKey={team.name} stroke="#f2b84b" fill="#f2b84b" fillOpacity={0.28} />
          {comparison ? <Radar name={comparison.name} dataKey={comparison.name} stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.16} /> : null}
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
