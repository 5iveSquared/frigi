export function formatScore(score: number): string {
  return score.toLocaleString();
}

export function formatElapsedTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function formatEfficiency(pct: number): string {
  return `${Math.round(pct * 100)}%`;
}
