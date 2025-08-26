"use client"
import { useState, useEffect } from "react"
import { useAuth } from "../../lib/auth-context"
import { User } from "../../lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import { Button } from "../../components/ui/button"
import { Alert, AlertDescription } from "../../components/ui/alert"
import {
  Users,
  Package,
  ShoppingCart,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  Star,
} from "lucide-react"
import Link from "next/link"

// Type definitions for dashboard data
interface DashboardData {
  packages?: any
  orders?: any
  payouts?: any
  reports?: any
  incentives?: {
    umrahPending: Array<{ _id: string; name: string; rank: string }>
    salaryPending: Array<{ _id: string; name: string; rank: string }>
    carEligible: Array<{ _id: string; name: string; rank: string }>
  }
}

export default function AdminDashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const { user, token } = useAuth()

  useEffect(() => {
    if (user?.role === "admin" && token) {
      fetchDashboardData()
    }
  }, [user, token])

  const fetchDashboardData = async () => {
    try {
      // Fetch multiple admin endpoints for dashboard overview
      const [packagesRes, ordersRes, payoutsRes, reportsRes] = await Promise.all([
        fetch("/api/admin/packages?limit=5", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/admin/orders?limit=5", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/admin/payouts?status=pending&limit=5", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/admin/reports/earnings?period=month", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])

      const [packagesData, ordersData, payoutsData, reportsData] = await Promise.all([
        packagesRes.json(),
        ordersRes.json(),
        payoutsRes.json(),
        reportsRes.json(),
      ])

      // Build incentives buckets from reports.topEarners (already enriched)
      const users = (reportsData?.topEarners || []) as Array<any>
      const incentives = {
        umrahPending: users.filter((u) => u.incentives?.umrahTicket === "pending").map((u) => ({ _id: u._id, name: u.name, rank: u.rank })),
        salaryPending: users.filter((u) => u.incentives?.fixedSalary === "pending").map((u) => ({ _id: u._id, name: u.name, rank: u.rank })),
        carEligible: users.filter((u) => u.incentives?.carPlan === "eligible").map((u) => ({ _id: u._id, name: u.name, rank: u.rank })),
      }

      setDashboardData({
        packages: packagesData,
        orders: ordersData,
        payouts: payoutsData,
        reports: reportsData,
        incentives,
      })
    } catch (error) {
      setError("Failed to load dashboard data")
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-500" />
      case "approved":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "rejected":
        return <XCircle className="w-4 h-4 text-red-500" />
      case "dispatched":
        return <ArrowUpRight className="w-4 h-4 text-blue-500" />
      case "delivered":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-md">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">Overview of GLOW NETWORK operations</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="glass border-white/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{dashboardData?.reports?.overallStats?.totalUsers || 0}</p>
                <p className="text-xs text-muted-foreground">
                  {dashboardData?.reports?.overallStats?.activeUsers || 0} active
                </p>
              </div>
              <Users className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-white/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Package Sales</p>
                <p className="text-2xl font-bold">
                  Rs {dashboardData?.reports?.overallStats?.totalPackageSales?.toLocaleString() || 0}
                </p>
                <p className="text-xs text-muted-foreground">This month</p>
              </div>
              <Package className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-white/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Payouts</p>
                <p className="text-2xl font-bold text-yellow-600">
                  Rs {dashboardData?.payouts?.summary?.pending?.total?.toLocaleString() || 0}
                </p>
                <p className="text-xs text-muted-foreground">
                  {dashboardData?.payouts?.summary?.pending?.count || 0} transactions
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-white/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Payouts</p>
                <p className="text-2xl font-bold text-green-600">
                  Rs {dashboardData?.reports?.overallStats?.totalPayouts?.toLocaleString() || 0}
                </p>
                <p className="text-xs text-muted-foreground">All time</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="glass border-white/20">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/admin/packages">
              <Button className="w-full gradient-brand text-white">
                <Package className="w-4 h-4 mr-2" />
                Approve Packages
              </Button>
            </Link>
            <Link href="/admin/orders">
              <Button variant="outline" className="w-full bg-transparent">
                <ShoppingCart className="w-4 h-4 mr-2" />
                Manage Orders
              </Button>
            </Link>
            <Link href="/admin/payouts">
              <Button variant="outline" className="w-full bg-transparent">
                <TrendingUp className="w-4 h-4 mr-2" />
                Release Payouts
              </Button>
            </Link>
            <Link href="/admin/reports">
              <Button variant="outline" className="w-full bg-transparent">
                <Star className="w-4 h-4 mr-2" />
                View Reports
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Recent Package Purchases */}
        <Card className="glass border-white/20">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Recent Package Purchases</CardTitle>
                <CardDescription>Latest package purchase requests</CardDescription>
              </div>
              <Link href="/admin/packages">
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {dashboardData?.packages?.purchases?.length > 0 ? (
              <div className="space-y-4">
                {dashboardData?.packages?.purchases?.slice(0, 5).map((purchase: any) => (
                  <div key={purchase._id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(purchase.status)}
                      <div>
                        <p className="font-medium">Rs {purchase.packageAmount.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">{purchase.userId.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(purchase.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(purchase.status)}>{purchase.status.toUpperCase()}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No recent package purchases</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card className="glass border-white/20">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>Latest product orders</CardDescription>
              </div>
              <Link href="/admin/orders">
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {dashboardData?.orders?.orders?.length > 0 ? (
              <div className="space-y-4">
                {dashboardData?.orders?.orders?.slice(0, 5).map((order: any) => (
                  <div key={order._id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(order.status)}
                      <div>
                        <p className="font-medium">Rs {order.total?.toLocaleString() || '0'}</p>
                        <p className="text-sm text-muted-foreground">{order.userId?.name || 'Unknown User'}</p>
                        <p className="text-xs text-muted-foreground">
                          {order.items?.length || 0} item{(order.items?.length || 0) > 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(order.status)}>{order.status.toUpperCase()}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No recent orders</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pending Payouts */}
      <Card className="glass border-white/20">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Pending Payouts</CardTitle>
              <CardDescription>Payouts awaiting release</CardDescription>
            </div>
            <Link href="/admin/payouts">
              <Button variant="outline" size="sm">
                Manage All
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {dashboardData?.payouts?.payouts?.length > 0 ? (
            <div className="space-y-4">
              {dashboardData?.payouts?.payouts?.slice(0, 5).map((payout: any) => (
                <div key={payout._id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {payout.type === "direct" ? (
                      <ArrowUpRight className="w-4 h-4 text-green-500" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4 text-blue-500" />
                    )}
                    <div>
                      <p className="font-medium">Rs {payout.amount?.toLocaleString() || '0'}</p>
                      <p className="text-sm text-muted-foreground">{payout.userId?.name || 'Unknown User'}</p>
                      <p className="text-xs text-muted-foreground">
                        {payout.type === "direct" ? "Direct Payout" : `Passive Income (Level ${payout.level})`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-yellow-100 text-yellow-800">PENDING</Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(payout.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No pending payouts</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Incentives */}
      <Card className="glass border-white/20">
        <CardHeader>
          <CardTitle>Incentives</CardTitle>
          <CardDescription>Eligibility and pending rewards</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-sm font-semibold mb-2">Umrah Pending</h3>
              {dashboardData?.incentives?.umrahPending?.length ? (
                <div className="space-y-2">
                  {dashboardData.incentives.umrahPending.map((u) => (
                    <div key={u._id} className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm">{u.name}</span>
                      <Badge variant="secondary">{u.rank.replace("_", " ").toUpperCase()}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No users pending</p>
              )}
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-2">Fixed Salary Pending</h3>
              {dashboardData?.incentives?.salaryPending?.length ? (
                <div className="space-y-2">
                  {dashboardData.incentives.salaryPending.map((u) => (
                    <div key={u._id} className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm">{u.name}</span>
                      <Badge variant="secondary">{u.rank.replace("_", " ").toUpperCase()}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No users pending</p>
              )}
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-2">Car Plan Eligible</h3>
              {dashboardData?.incentives?.carEligible?.length ? (
                <div className="space-y-2">
                  {dashboardData.incentives.carEligible.map((u) => (
                    <div key={u._id} className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm">{u.name}</span>
                      <Badge variant="secondary">{u.rank.replace("_", " ").toUpperCase()}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No users eligible</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
