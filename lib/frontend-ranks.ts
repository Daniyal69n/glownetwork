export const FRONTEND_RANK_ORDER: Record<string, number> = {
  guest: 0,
  assistant: 1,
  manager: 2,
  senior_manager: 3,
  diamond_manager: 4,
  global_manager: 5,
  director: 6,
}

export function isRankHigher(a: string | undefined | null, b: string | undefined | null) {
  if (!a || !b) return false
  return (FRONTEND_RANK_ORDER[a] ?? -1) > (FRONTEND_RANK_ORDER[b] ?? -1)
}


