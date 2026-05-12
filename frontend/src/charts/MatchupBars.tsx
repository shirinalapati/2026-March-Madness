import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Battle } from "../types";

export function MatchupBars({ battles, teamAName, teamBName }: { battles: Battle[]; teamAName: string; teamBName: string }) {
  const data = battles.map((battle) => ({
    battle: battle.label.replace(" battle", ""),
    [teamAName]: battle.team_a,
    [teamBName]: battle.team_b,
  }));

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer>
        <BarChart data={data}>
          <CartesianGrid stroke="rgba(255,255,255,.09)" />
          <XAxis dataKey="battle" tick={{ fill: "#94a3b8", fontSize: 11 }} />
          <YAxis domain={[0, 100]} tick={{ fill: "#94a3b8", fontSize: 11 }} />
          <Tooltip contentStyle={{ background: "#0b171d", border: "1px solid rgba(255,255,255,.12)", borderRadius: 16 }} />
          <Bar dataKey={teamAName} fill="#f2b84b" radius={[8, 8, 0, 0]} />
          <Bar dataKey={teamBName} fill="#22d3ee" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
