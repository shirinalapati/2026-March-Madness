import type { Team } from "../types";

export const styleScoreKeys: Array<{ key: keyof Team; label: string }> = [
  { key: "tempo_score", label: "Tempo" },
  { key: "spacing_score", label: "Spacing" },
  { key: "rim_pressure_score", label: "Rim Pressure" },
  { key: "ball_security_score", label: "Ball Security" },
  { key: "glass_pressure_score", label: "Glass Pressure" },
  { key: "defensive_disruption_score", label: "Defensive Disruption" },
  { key: "rim_protection_score", label: "Rim Protection" },
  { key: "transition_defense_score", label: "Transition Defense" },
  { key: "shot_quality_score", label: "Shot Quality" },
];

export function scoreTone(score: number): string {
  if (score >= 70) return "text-court-lime";
  if (score >= 55) return "text-court-teal";
  if (score <= 40) return "text-orange-300";
  return "text-slate-200";
}

export function percent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function rating(value: number): string {
  return value.toFixed(1);
}
