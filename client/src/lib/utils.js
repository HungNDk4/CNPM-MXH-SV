/**
 * Utility helper to merge and filter CSS class names without external dependencies
 */
export function cn(...inputs) {
  return inputs
    .flat(Infinity)
    .filter(Boolean)
    .join(' ')
    .trim()
}
