/**
 * Format a number as BB (big blinds)
 */
export function formatBB(amount: number): string {
  if (amount === Math.floor(amount)) return `${amount}BB`;
  return `${amount.toFixed(1)}BB`;
}

/**
 * Format a percentage
 */
export function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

/**
 * Format accuracy as percentage string
 */
export function formatAccuracy(correct: number, total: number): string {
  if (total === 0) return '0%';
  return `${Math.round((correct / total) * 100)}%`;
}
