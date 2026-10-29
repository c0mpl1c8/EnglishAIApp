export function advanceA1AssessmentRank(rank, correct, total) {
  const safeRank = Number.isInteger(rank) && rank >= 1 && rank <= 5 ? rank : 1
  if (!total || !Number.isFinite(correct)) return safeRank
  return correct / total >= 0.9 ? Math.min(safeRank + 1, 6) : Math.max(safeRank - 1, 1)
}
