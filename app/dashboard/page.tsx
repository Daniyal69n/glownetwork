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
} from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const { user, token } = useAuth()

  useEffect(() => {
    if (user && token) {
      fetchDashboardData()
    }
  }, [user, token])

  const fetchDashboardData = async () => {
    try {
      const response = await fetch(`/api/users/${user._id}/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (response.ok) {
        setDashboardData(data)
      } else {
        setError(data.error)
      }
    } catch (error) {
      setError("Failed to load dashboard data")
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-500" />
      case "approved":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "rejected":
        return <XCircle className="w-4 h-4 text-red-500" />
      case "dispatched":
        return <Truck className="w-4 h-4 text-blue-500" />
      case "delivered":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "approved":
        return "bg-green-100 text-green-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      case "dispatched":
        return "bg-blue-100 text-blue-800"
      case "delivered":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getRankBadgeColor = (rank) => {
    switch (rank) {
      case "assistant":
        return "bg-gray-100 text-gray-800"
      case "manager":
        return "bg-blue-100 text-blue-800"
      case "senior_manager":
        return "bg-purple-100 text-purple-800"
      case "diamond_manager":
        return "bg-pink-100 text-pink-800"
      case "global_manager":
        return "bg-yellow-100 text-yellow-800"
      case "director":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-primary/5">
      <div className="container mx-auto px-4 py-6 md:py-8">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Welcome back, {dashboardData?.user?.name}!</h1>
          <p className="text-muted-foreground">Here's your business overview</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
          <Card className="glass border-white/20">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Current Rank</p>
                  <Badge className={getRankBadgeColor(dashboardData?.user?.rank)}>
                    {dashboardData?.user?.rank?.replace("_", " ").toUpperCase()}
                  </Badge>
                </div>
                <Star className="w-6 h-6 md:w-8 md:h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-white/20">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Package Credit</p>
                  <p className="text-xl md:text-2xl font-bold">
                    Rs {dashboardData?.user?.packageCredit?.toLocaleString() || 0}
                  </p>
                </div>
                <Package className="w-6 h-6 md:w-8 md:h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-white/20">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Payouts</p>
                  <p className="text-xl md:text-2xl font-bold text-yellow-600">
                    Rs {dashboardData?.payoutStats?.pending?.toLocaleString() || 0}
                  </p>
                </div>
                <Clock className="w-6 h-6 md:w-8 md:h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-white/20">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Released Payouts</p>
                  <p className="text-xl md:text-2xl font-bold text-green-600">
                    Rs {dashboardData?.payoutStats?.released?.toLocaleString() || 0}
                  </p>
                </div>
                <TrendingUp className="w-6 h-6 md:w-8 md:h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Actions */}
            <Card className="glass border-white/20">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Manage your business activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                  <Link href="/packages">
                    <Button className="w-full gradient-brand text-white h-12">
                      <Package className="w-4 h-4 mr-2" />
                      Buy Package
                    </Button>
                  </Link>
                  <Link href="/shop">
                    <Button variant="outline" className="w-full bg-transparent h-12">
                      <Gift className="w-4 h-4 mr-2" />
                      Shop Products
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Recent Package Purchases */}
            <Card className="glass border-white/20">
              <CardHeader>
                <CardTitle>Recent Package Purchases</CardTitle>
                <CardDescription>Your latest package purchase history</CardDescription>
              </CardHeader>
              <CardContent>
                {dashboardData?.packagePurchases?.length > 0 ? (
                  <div className="space-y-3 md:space-y-4">
                    {dashboardData.packagePurchases.map((purchase) => (
                      <div
                        key={purchase._id}
                        className="flex items-center justify-between p-3 md:p-4 border rounded-lg"
                      >
                        <div className="flex items-center space-x-3 md:space-x-4 min-w-0 flex-1">
                          {getStatusIcon(purchase.status)}
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm md:text-base">
                              Rs {purchase.packageAmount.toLocaleString()}
                            </p>
                            <p className="text-xs md:text-sm text-muted-foreground truncate">
                              {new Date(purchase.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Badge className={`${getStatusColor(purchase.status)} text-xs whitespace-nowrap`}>
                          {purchase.status.toUpperCase()}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No package purchases yet</p>
                    <Link href="/packages">
                      <Button className="mt-4 gradient-brand text-white">
                        Purchase Your First Package
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Payouts */}
            <Card className="glass border-white/20">
              <CardHeader>
                <CardTitle>Recent Payouts</CardTitle>
                <CardDescription>Your earning history</CardDescription>
              </CardHeader>
              <CardContent>
                {dashboardData?.payouts?.length > 0 ? (
                  <div className="space-y-3 md:space-y-4">
                    {dashboardData.payouts.slice(0, 5).map((payout) => (
                      <div key={payout._id} className="flex items-center justify-between p-3 md:p-4 border rounded-lg">
                        <div className="flex items-center space-x-3 md:space-x-4 min-w-0 flex-1">
                          {getStatusIcon(payout.status)}
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm md:text-base">Rs {payout.amount.toLocaleString()}</p>
                            <p className="text-xs md:text-sm text-muted-foreground">
                              {payout.type === "direct" ? "Direct Payout" : `Passive Income (Level ${payout.level})`}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(payout.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Badge className={`${getStatusColor(payout.status)} text-xs whitespace-nowrap`}>
                          {payout.status.toUpperCase()}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No payouts yet</p>
                    <p className="text-sm text-muted-foreground mt-2">Purchase a package to start earning</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Profile Card */}
            <Card className="glass border-white/20">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>Profile</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Referral Code</p>
                  <p className="font-mono font-semibold text-sm md:text-base">{dashboardData?.user?.referralCode}</p>
                </div>
                {dashboardData?.user?.referredBy && (
                  <div>
                    <p className="text-sm text-muted-foreground">Referred By</p>
                    <p className="font-medium text-sm md:text-base">{dashboardData.user.referredBy.name}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Member Since</p>
                  <p className="font-medium text-sm md:text-base">
                    {new Date(dashboardData?.user?.createdAt || Date.now()).toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Downline Stats */}
            <Card className="glass border-white/20">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>Team Overview</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Direct Members</span>
                    <span className="font-semibold">{dashboardData?.user?.directDownline?.length || 0}</span>
                  </div>
                  {Object.entries(dashboardData?.rankCounts || {}).map(([rank, count]) => (
                    <div key={rank} className="flex justify-between">
                      <span className="text-sm text-muted-foreground">{rank.replace("_", " ").toUpperCase()}s</span>
                      <span className="font-semibold">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
