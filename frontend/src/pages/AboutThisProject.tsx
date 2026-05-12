import { Card, SectionHeader } from "../components/Card";

const sections = [
  {
    title: "What CourtVision Solves",
    copy: "CourtVision is a March Madness matchup intelligence tool. It uses regular-season data from the 64 main bracket teams to evaluate which teams have matchup advantages and why. The goal is not to blindly predict winners, but to explain tactical pressure points such as shooting profile, pace, rebounding, turnovers, rim pressure, and defensive resistance.",
  },
  {
    title: "Why Matchups Matter in March Madness",
    copy: "March Madness is not only about the better team. Upsets often happen when a lower seed's style directly attacks a favorite's weakness: turnover pressure against shaky ball security, offensive rebounding against weak defensive glass, or high-variance three-point volume against a stronger opponent.",
  },
  {
    title: "What the Model Is Trying to Estimate",
    copy: "The model estimates matchup path strength, not a guaranteed win probability. A team with a higher score has a cleaner statistical and tactical path based on regular-season indicators.",
  },
  {
    title: "Why This Is Not a Betting Model",
    copy: "CourtVision is designed for scouting support and bracket reasoning, not gambling or guaranteed prediction. Percentages in the app are labeled as matchup confidence because they describe the model's heuristic confidence in the matchup path, not a true betting probability.",
  },
  {
    title: "Limitations",
    copy: "CourtVision does not capture everything that decides a tournament game. Player injuries, lineup changes, coaching adjustments, matchup assignments, travel, shooting variance, and film-level scheme details can all change the actual game environment.",
  },
];

const dataScope = [
  "2025-2026 NCAA men's basketball regular season only.",
  "64 main tournament bracket teams.",
  "Public data sources are used.",
  "Tracking, scheme, injuries, and film context are not fully captured.",
];

const styleScoreParts = [
  ["Tempo Score", "Created from raw pace, then normalized against the 64-team field."],
  ["Spacing Score", "Created from three-point attempt rate and effective field goal percentage."],
  ["Rim Pressure Score", "Created as a proxy from offensive rebounding rate and estimated free throw pressure."],
  ["Ball Security Score", "Created from turnover rate, inverted so lower turnover teams receive higher scores."],
  ["Glass Pressure Score", "Created from offensive rebounding rate."],
  ["Defensive Disruption Score", "Created from forced turnover rate."],
  ["Rim Protection Score", "Created as a proxy from opponent effective field goal percentage and adjusted defensive rating."],
  ["Transition Defense Score", "Created as a proxy from adjusted defensive rating and forced turnover rate."],
  ["Shot Quality Score", "Created from effective field goal percentage."],
  ["Defensive Rebounding Score", "Created from defensive rebounding rate."],
  ["Free Throw Rate Score", "Created from an estimated free throw rate proxy because full public tracking data is not available."],
  ["Volatility Score", "Created from three-point volume, pace difference, and seed context to flag higher-variance profiles."],
];

const formulaParts = [
  {
    label: "efficiency_edge",
    weight: "20%",
    source: "Derived from adjusted offensive rating and adjusted defensive rating for both teams.",
    why: "It gets the largest weight because baseline efficiency is the strongest broad signal before style matchups are layered in.",
  },
  {
    label: "shooting_profile_edge",
    weight: "12%",
    source: "Derived from spacing score, shot quality score, three-point attempt profile, and opponent shot-profile allowance indicators.",
    why: "Shooting can swing March games, but it is weighted below efficiency because shot variance should not dominate the model by itself.",
  },
  {
    label: "turnover_pressure_edge",
    weight: "12%",
    source: "Derived from a team's ball security score versus the opponent's defensive disruption score.",
    why: "Turnovers change possession volume and upset paths, so this carries meaningful weight in single-game matchups.",
  },
  {
    label: "rebounding_edge",
    weight: "12%",
    source: "Derived from offensive glass pressure versus opponent defensive rebounding score.",
    why: "Extra possessions matter in tournament games, especially when a lower seed can shrink the talent gap through second chances.",
  },
  {
    label: "rim_pressure_edge",
    weight: "10%",
    source: "Derived from rim pressure score versus opponent rim protection score. Rim pressure uses public-stat proxies where tracking data is unavailable.",
    why: "Paint pressure is important, but it is slightly lower than shooting, turnovers, and rebounding because the source is partly proxy-based.",
  },
  {
    label: "rim_protection_resistance",
    weight: "8%",
    source: "Derived from a team's rim protection score versus the opponent's rim pressure score.",
    why: "This captures defensive resistance at the rim without double-counting the offensive rim pressure component.",
  },
  {
    label: "tempo_control_edge",
    weight: "8%",
    source: "Derived from tempo score and transition defense indicators.",
    why: "Tempo shapes game environment, but it is weighted moderately because not every pace difference turns into actual control.",
  },
  {
    label: "free_throw_pressure_edge",
    weight: "7%",
    source: "Derived from free throw rate score versus opponent free throw prevention indicators.",
    why: "Foul pressure matters, but public free throw and foul-prevention data is more indirect than core efficiency metrics.",
  },
  {
    label: "volatility_edge",
    weight: "6%",
    source: "Derived from volatility score, three-point volume, tempo disruption, and lower-seed upset-path indicators.",
    why: "Volatility helps identify realistic upset paths, but it stays modest so high-variance teams are not over-rewarded.",
  },
  {
    label: "seed_context_adjustment",
    weight: "5%",
    source: "Derived from seed difference between the two teams.",
    why: "Seed is included as light context only. The model is meant to prioritize basketball matchup factors over bracket reputation.",
  },
];

export function AboutThisProject() {
  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="About This Project"
        title="A scouting heuristic for March Madness matchup edges"
        copy="CourtVision translates regular-season team profiles into bracket strategy language: who has the cleaner path, what pressure points matter, and what could flip the game."
      />

      <div className="grid gap-5 md:grid-cols-2">
        {sections.map((section) => (
          <Card key={section.title}>
            <h3 className="text-xl font-bold text-white">{section.title}</h3>
            <p className="mt-3 text-sm leading-7 text-slate-300">{section.copy}</p>
          </Card>
        ))}
      </div>

      <Card>
        <h3 className="text-xl font-bold text-white">Data Scope</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {dataScope.map((item) => (
            <p key={item} className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-slate-300">{item}</p>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="text-xl font-bold text-white">How Style Scores Are Created</h3>
        <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-300">
          Scores like Ball Security, Spacing, Rim Pressure, and Defensive Disruption are not subjective grades. CourtVision creates them by taking raw regular-season stats, comparing each team against the 64-team tournament field, and normalizing the result to a 0-100 scale. For inverted metrics, lower raw values are better.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {styleScoreParts.map(([label, copy]) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <p className="text-sm font-semibold text-court-gold">{label}</p>
              <p className="mt-1 text-sm leading-6 text-slate-300">{copy}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="text-xl font-bold text-white">Matchup Formula</h3>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
          Each component is built from regular-season team metrics, converted to a 0-100 matchup component, then combined with transparent weights. The weights are not trained by AI; they are a scouting heuristic designed to make core efficiency matter most while still giving style-based pressure points room to move the matchup.
        </p>
        <pre className="mt-4 overflow-x-auto rounded-2xl bg-court-950 p-4 text-sm leading-7 text-court-lime">
{`matchup_score =
0.20 * efficiency_edge
+ 0.12 * shooting_profile_edge
+ 0.12 * turnover_pressure_edge
+ 0.12 * rebounding_edge
+ 0.10 * rim_pressure_edge
+ 0.08 * rim_protection_resistance
+ 0.08 * tempo_control_edge
+ 0.07 * free_throw_pressure_edge
+ 0.06 * volatility_edge
+ 0.05 * seed_context_adjustment`}
        </pre>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {formulaParts.map((part) => (
          <Card key={part.label}>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-court-gold">{part.label}</p>
              <p className="rounded-full bg-court-gold/10 px-3 py-1 text-xs font-bold text-court-gold">{part.weight}</p>
            </div>
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">How it is retrieved</p>
            <p className="mt-2 text-sm leading-7 text-slate-300">{part.source}</p>
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Why this weight</p>
            <p className="mt-2 text-sm leading-7 text-slate-300">{part.why}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
