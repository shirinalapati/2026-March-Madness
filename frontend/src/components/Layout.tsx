import { NavLink, Outlet } from "react-router-dom";

const links = [
  { to: "/", label: "About This Project" },
  { to: "/overview", label: "Tournament Overview" },
  { to: "/team-profile", label: "Team Profiles" },
  { to: "/matchup-simulator", label: "Matchup Simulator" },
  { to: "/scouting-report", label: "Scouting Report" },
];

export function Layout() {
  return (
    <div className="min-h-screen bg-court-950 text-slate-100">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.18),transparent_30%),radial-gradient(circle_at_80%_10%,rgba(34,211,238,0.12),transparent_35%)]" />
      <header className="border-b border-white/10 bg-court-950/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-5 md:flex-row md:items-center md:justify-between lg:px-8">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-court-gold">CourtVision</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">March Madness Matchup Intelligence</h1>
          </div>
          <nav className="flex flex-wrap gap-2">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `rounded-full border px-3 py-2 text-sm transition ${
                    isActive
                      ? "border-court-gold bg-court-gold text-court-950"
                      : "border-white/10 bg-white/5 text-slate-300 hover:border-court-teal hover:text-white"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
