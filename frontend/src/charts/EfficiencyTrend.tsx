import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TrendPoint } from "../types";

export function EfficiencyTrend({ data }: { data: TrendPoint[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid stroke="rgba(255,255,255,.09)" />
          <XAxis dataKey="game_date" interval="preserveStartEnd" tick={{ fill: "#94a3b8", fontSize: 11 }} />
          <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
          <Tooltip contentStyle={{ background: "#0b171d", border: "1px solid rgba(255,255,255,.12)", borderRadius: 16 }} />
          <Line type="monotone" dataKey="offensive_rating" stroke="#f2b84b" strokeWidth={3} dot={{ r: 2 }} activeDot={{ r: 5 }} />
          <Line type="monotone" dataKey="defensive_rating" stroke="#22d3ee" strokeWidth={3} dot={{ r: 2 }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
