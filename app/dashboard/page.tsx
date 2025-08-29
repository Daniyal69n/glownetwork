"use client"
import { useState, useEffect } from "react"
import { useAuth } from "../../lib/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import { Button } from "../../components/ui/button"
import { Alert, AlertDescription } from "../../components/ui/alert"
import {
  User,
  Package,
  TrendingUp,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  Gift,
  Star,
  ArrowRight,
  ShoppingCart,
  Target,
  Copy,
  Check,
  Link as LinkIcon,
} from "lucide-react"
import Link from "next/link"
import Celebration from "../../components/ui/celebration"
import { useCelebration } from "../../hooks/use-celebration"
import { isRankHigher } from "../../lib/frontend-ranks"

type PackagePurchaseItem = {
  _id: string
  packageAmount: number
  status: "pending" | "approved" | "rejected"
  createdAt: string
}

type PayoutItem = {
  _id: string
  amount: number
  status: "pending" | "released" | "paid"
  type: "direct" | "passive"
  level?: number
  createdAt: string
}

type OrderItem = {
  _id: string
  total: number
  status: "pending" | "approved" | "rejected" | "dispatched" | "delivered"
  createdAt: string
  items: Array<{ productId?: { name?: string } }>
}

type DashboardUser = {
  _id: string
  name: string
  rank: "guest" | "assistant" | "manager" | "senior_manager" | "diamond_manager" | "global_manager" | "director"
  referralCode?: string
  packageCredit: number
  totalIncome?: number
  pendingIncome?: number
  createdAt?: string
  directDownline?: Array<string> | Array<{ _id: string }>
  referredBy?: { name?: string }
}

type NextRankInfo = {
  nextRank: DashboardUser["rank"] | null
  requirement: { description?: string } | null
  progress: number
  remaining: number
}

type DashboardData = {
  user: DashboardUser
  packagePurchases: PackagePurchaseItem[]
  payouts: PayoutItem[]
  orders: OrderItem[]
  payoutStats: { pending: number; released: number; paid: number }
  rankCounts: Record<string, number>
  nextRankInfo?: NextRankInfo
  incentives?: {
    umrahTicket: { label: string; status: "unlocked" | "locked" }
    fixedSalary: { label: string; status: "locked" | "locked" }
    carPlan: { label: string; status: "eligible" | "locked" }
  }
}

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)

  const { user, token, updateUser } = useAuth()
  const celebration = useCelebration()

  useEffect(() => {
    if (user && token) {
      fetchDashboardData()
    }
  }, [user, token])

  const fetchDashboardData = async () => {
    try {
      const response = await fetch(`/api/users/${user?._id}/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setDashboardData(data)
        updateUser(data.user)
      } else {
        setError("Failed to load dashboard data")
      }
    } catch (error) {
      setError("Network error")
    } finally {
      setLoading(false)
    }
  }

  const copyReferralLink = async () => {
    const referralLink = `${window.location.origin}/signup?ref=${dashboardData?.user.referralCode}`
    try {
      await navigator.clipboard.writeText(referralLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch (err) {
      const textarea = document.createElement("textarea")
      textarea.value = referralLink
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand("copy")
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-primary/5 flex items-center justify-center">
        <div className="animate-pulse-glow rounded-full h-12 w-12 border-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-primary/5 flex items-center justify-center p-4">
        <Card className="glass-enhanced max-w-md w-full animate-fade-in-scale">
          <CardContent className="p-6">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!dashboardData) {
    return null
  }

  const { user: dashboardUser, payoutStats, rankCounts, nextRankInfo, incentives } = dashboardData

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-primary/5 particles">
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8 animate-fade-in-scale">
          <Card className="glass-enhanced interactive-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-primary/20 to-primary/10 flex items-center justify-center glow-primary animate-pulse-glow">
                    <User className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold gradient-text">Welcome back, {dashboardUser.name}!</h1>
                    <p className="text-muted-foreground">
                      Rank: <Badge variant="secondary" className="ml-1">{dashboardUser.rank.replace("_", " ").toUpperCase()}</Badge>
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Referral Code</p>
                  <p className="text-lg font-mono font-bold gradient-text">{dashboardUser.referralCode}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="glass-enhanced interactive-card animate-fade-in-scale">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium gradient-text">Total Income</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Rs {dashboardUser.totalIncome?.toLocaleString() || "0"}</div>
              <p className="text-xs text-muted-foreground">Lifetime earnings</p>
            </CardContent>
          </Card>

          <Card className="glass-enhanced interactive-card animate-fade-in-scale" style={{ animationDelay: '0.1s' }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium gradient-text">Pending Income</CardTitle>
              <Clock className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Rs {dashboardUser.pendingIncome?.toLocaleString() || "0"}</div>
              <p className="text-xs text-muted-foreground">Awaiting release</p>
            </CardContent>
          </Card>

          <Card className="glass-enhanced interactive-card animate-fade-in-scale" style={{ animationDelay: '0.2s' }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium gradient-text">Direct Downline</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardUser.directDownline?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Direct referrals</p>
            </CardContent>
          </Card>

          <Card className="glass-enhanced interactive-card animate-fade-in-scale" style={{ animationDelay: '0.3s' }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium gradient-text">Package Credit</CardTitle>
              <Package className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Rs {dashboardUser.packageCredit?.toLocaleString() || "0"}</div>
              <p className="text-xs text-muted-foreground">Available credit</p>
            </CardContent>
          </Card>
        </div>

        {/* Referral Section */}
        <div className="mb-6 animate-fade-in-scale">
          <Card className="glass-enhanced interactive-card max-w-3xl mx-auto">
            <CardHeader className="pb-3">
              <CardTitle className="gradient-text flex items-center text-lg">
                <LinkIcon className="mr-2 h-4 w-4" />
                Referral
              </CardTitle>
              <CardDescription className="text-xs">Share your personal signup link</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground">Your code</div>
                <div className="px-3 py-1.5 rounded-md bg-primary/5 border border-primary/20 font-mono inline-flex text-sm">
                  {dashboardUser.referralCode}
                </div>
                <div className="text-xs text-muted-foreground pt-1">Referral link</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-3 py-2 rounded-md bg-background border text-xs font-mono truncate">
                    {typeof window !== "undefined" ? `${window.location.origin}/signup?ref=${dashboardUser.referralCode}` : ""}
                  </div>
                  <Button variant="outline" size="sm" onClick={copyReferralLink} className="shrink-0 h-8 px-3">
                    {copied ? (<><Check className="h-4 w-4 mr-1" />Copied</>) : (<><Copy className="h-4 w-4 mr-1" />Copy</>)}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Actions */}
            <Card className="glass-enhanced animate-slide-in-up">
              <CardHeader>
                <CardTitle className="gradient-text">Quick Actions</CardTitle>
                <CardDescription>Manage your business activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <Link href="/packages">
                    <Button className="w-full gradient-brand-rainbow text-white interactive-button glow-primary-hover">
                      <Package className="mr-2 h-4 w-4" />
                      Purchase Package
                    </Button>
                  </Link>
                  <Link href="/shop">
                    <Button className="w-full gradient-brand-rainbow text-white interactive-button glow-primary-hover">
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Shop Products
                    </Button>
                  </Link>
                  <Link href="/payouts">
                    <Button className="w-full gradient-brand-rainbow text-white interactive-button glow-primary-hover">
                      <Gift className="mr-2 h-4 w-4" />
                      View Payouts
                    </Button>
                  </Link>
                  <Link href="/order-history">
                    <Button className="w-full gradient-brand-rainbow text-white interactive-button glow-primary-hover">
                      <Truck className="mr-2 h-4 w-4" />
                      Order History
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="glass-enhanced animate-slide-in-up">
              <CardHeader>
                <CardTitle className="gradient-text">Recent Activity</CardTitle>
                <CardDescription>Your latest business activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData.payouts.slice(0, 5).map((payout) => (
                    <div key={payout._id} className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary/20 to-primary/10 flex items-center justify-center">
                          <Gift className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">Rs {payout.amount.toLocaleString()}</p>
                          <p className="text-sm text-muted-foreground">
                            {payout.type === "direct" ? "Direct" : "Passive"} Income
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={payout.status === "paid" ? "default" : payout.status === "released" ? "secondary" : "outline"}
                        className="animate-bounce-subtle"
                      >
                        {payout.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Rank Progress */}
            {nextRankInfo && (
              <Card className="glass-enhanced animate-slide-in-up">
                <CardHeader>
                  <CardTitle className="gradient-text">Rank Progress</CardTitle>
                  <CardDescription>Advance to the next level</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Progress to {nextRankInfo.nextRank?.replace("_", " ").toUpperCase()}</span>
                        <span>{Math.round(nextRankInfo.progress)}%</span>
                      </div>
                      <div className="w-full bg-primary/10 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-primary to-primary/70 h-2 rounded-full transition-all duration-500 animate-pulse-glow"
                          style={{ width: `${nextRankInfo.progress}%` }}
                        ></div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{nextRankInfo.requirement?.description}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Incentives */}
            {incentives && (
              <Card className="glass-enhanced animate-slide-in-up">
                <CardHeader>
                  <CardTitle className="gradient-text">Incentives</CardTitle>
                  <CardDescription>Unlock special rewards</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(incentives).map(([key, incentive]) => (
                      <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20">
                        <div className="flex items-center space-x-3">
                          <Star className="w-4 h-4 text-primary" />
                          <span className="text-sm font-medium">{incentive.label}</span>
                        </div>
                        <Badge variant={incentive.status === "unlocked" ? "default" : "outline"}>
                          {incentive.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Downline Stats */}
            <Card className="glass-enhanced animate-slide-in-up">
              <CardHeader>
                <CardTitle className="gradient-text">Downline Overview</CardTitle>
                <CardDescription>Your team structure</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(rankCounts).map(([rank, count]) => (
                    <div key={rank} className="flex items-center justify-between p-2 rounded-lg bg-gradient-to-r from-primary/5 to-primary/10">
                      <span className="text-sm capitalize">{rank.replace("_", " ")}</span>
                      <Badge variant="secondary" className="animate-bounce-subtle">{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Celebration visible={celebration.visible} />
    </div>
  )
}
