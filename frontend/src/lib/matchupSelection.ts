const MATCHUP_SELECTION_KEY = "courtvision:selected-matchup";

export type SavedMatchupSelection = {
  teamAId: string;
  teamBId: string;
};

export function readSavedMatchupSelection(): SavedMatchupSelection | null {
  try {
    const raw = window.localStorage.getItem(MATCHUP_SELECTION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SavedMatchupSelection>;
    if (typeof parsed.teamAId === "string" && typeof parsed.teamBId === "string" && parsed.teamAId !== parsed.teamBId) {
      return { teamAId: parsed.teamAId, teamBId: parsed.teamBId };
    }
  } catch {
    return null;
  }
  return null;
}

export function saveMatchupSelection(selection: SavedMatchupSelection) {
  try {
    window.localStorage.setItem(MATCHUP_SELECTION_KEY, JSON.stringify(selection));
  } catch {
    // Local storage is a convenience for page-to-page continuity; ignore browser storage failures.
  }
}
