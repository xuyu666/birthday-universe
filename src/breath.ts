export function breathStrength(milliseconds: number): 1 | 2 | 3 {
  return milliseconds >= 1200 ? 3 : milliseconds >= 600 ? 2 : 1;
}
