import type { ExplanationTokens } from "./types";

export function deterministicExplanation(tokens: ExplanationTokens): string {
  if (tokens.matchedPeople.length > 0) {
    return `Recommended because it features ${tokens.matchedPeople[0]}, who you enjoy.`;
  }
  if (tokens.matchedGenres.length > 0) {
    return `Recommended because it matches your favorite genres: ${tokens.matchedGenres.join(", ")}.`;
  }
  if (tokens.matchedTitles.length > 0) {
    return `Recommended because you liked ${tokens.matchedTitles[0]}.`;
  }
  return "Recommended based on trending popularity and your watch history.";
}
