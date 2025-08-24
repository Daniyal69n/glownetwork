export interface User {
  _id: string
  name: string
  email: string
  phone: string
  role: "member" | "admin"
  rank: "guest" | "assistant" | "manager" | "senior_manager" | "diamond_manager" | "global_manager" | "director"
  referralCode?: string
  referredBy?: string
  packageCredit: number
  totalIncome: number
  pendingIncome: number
  releasedIncome: number
  directDownline?: string[]
  isEmailVerified: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface AuthContextType {
  user: User | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; user?: User }>
  signup: (name: string, email: string, phone: string, password: string, referralCode?: string) => Promise<{ success: boolean; error?: string; user?: User; referredBy?: User }>
  logout: () => void
  updateUser: (updatedUser: User) => void
  isAuthenticated: boolean
  isAdmin: boolean
}
