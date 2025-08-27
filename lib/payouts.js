// Payout calculation logic according to exact specifications

export const RANK_PERCENTAGES = {
  assistant: 30,
  manager: 35,
  senior_manager: 40,
  diamond_manager: 40,
  global_manager: 40,
  director: 40,
}

export const PASSIVE_INCOME_RATE = 5 // 5% of net amount (after delivery charges)

export function calculateDirectPayout(packageAmount, rank) {
  // Delivery charges by package tier
  const deliveryCharge = (amount) => {
    if (amount === 20000) return 1000
    if (amount === 50000) return 1500
    if (amount === 100000) return 2000
    return 0
  }

  // Percentage by package tier based on net credited amount
  const tierPercentage = (amount) => {
    if (amount === 20000) return 30
    if (amount === 50000) return 35
    if (amount === 100000) return 40
    // fallback: use rank-based percentage if a non-standard amount is ever introduced
    return RANK_PERCENTAGES[rank] || 0
  }

  const netCredit = packageAmount - deliveryCharge(packageAmount)
  const pct = tierPercentage(packageAmount)
  return Math.round((netCredit * pct) / 100)
}

export function calculatePassiveIncome(packageAmount) {
  // Use net amount after delivery charges
  const deliveryCharge = (amount) => {
    if (amount === 20000) return 1000
    if (amount === 50000) return 1500
    if (amount === 100000) return 2000
    return 0
  }
  const net = packageAmount - deliveryCharge(packageAmount)
  return Math.round((net * PASSIVE_INCOME_RATE) / 100)
}

// All uplines are eligible under the described plan
export function isEligibleForPassiveIncome() {
  return true
}

export function getRankPromotionRequirements(currentRank) {
  const requirements = {
    guest: { nextRank: "assistant", requirement: "Purchase any package" },
    assistant: { nextRank: "manager", requirement: "Purchase any package" },
    manager: { nextRank: "senior_manager", requirement: "Purchase any package" },
    senior_manager: { nextRank: "diamond_manager", requirement: "5 Senior Managers in downline" },
    diamond_manager: { nextRank: "global_manager", requirement: "5 Diamond Managers in downline" },
    global_manager: { nextRank: "director", requirement: "4 Global Managers in downline" },
    director: { nextRank: null, requirement: "Maximum rank achieved" },
  }

  return requirements[currentRank]
}
