import { useMemo, useState } from "react";
import type { TeamSummary } from "../types";

function teamSearchText(team: TeamSummary) {
  return `${team.name} ${team.conference} ${team.region} ${team.seed}`.toLowerCase();
}

export function TeamSelect({
  label,
  teams,
  value,
  onChange,
}: {
  label: string;
  teams: TeamSummary[];
  value: string;
  onChange: (teamId: string) => void;
}) {
  const [query, setQuery] = useState("");
  const selectedTeam = teams.find((team) => team.id === value);
  const matches = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [];
    return teams.filter((team) => teamSearchText(team).includes(normalized)).slice(0, 6);
  }, [query, teams]);

  function chooseSearchMatch(searchValue: string) {
    const normalized = searchValue.trim().toLowerCase();
    if (!normalized) return;
    const exactMatch = teams.find(
      (team) =>
        team.name.toLowerCase() === normalized ||
        `${team.region} ${team.seed} - ${team.name} (${team.conference})`.toLowerCase() === normalized,
    );
    const firstMatch = exactMatch ?? teams.find((team) => teamSearchText(team).includes(normalized));
    if (firstMatch) {
      onChange(firstMatch.id);
      setQuery("");
    }
  }

  return (
    <div className="block">
      <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{label}</span>
      <div className="mt-2 grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(220px,0.55fr)]">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-court-900 px-4 py-3 text-white outline-none ring-court-gold transition focus:ring-2"
        >
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.region} {team.seed} - {team.name} ({team.conference})
            </option>
          ))}
        </select>
        <div className="relative">
          <input
            type="search"
            value={query}
            list={`${label.replace(/\s+/g, "-").toLowerCase()}-team-search`}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") chooseSearchMatch(query);
            }}
            onBlur={() => chooseSearchMatch(query)}
            placeholder={selectedTeam ? `Search teams, e.g. ${selectedTeam.name}` : "Search teams"}
            className="w-full rounded-2xl border border-white/10 bg-court-900 px-4 py-3 text-white outline-none ring-court-gold transition placeholder:text-slate-500 focus:ring-2"
          />
          <datalist id={`${label.replace(/\s+/g, "-").toLowerCase()}-team-search`}>
            {(matches.length ? matches : teams.slice(0, 8)).map((team) => (
              <option key={team.id} value={`${team.region} ${team.seed} - ${team.name} (${team.conference})`} />
            ))}
          </datalist>
        </div>
      </div>
    </div>
  );
}
