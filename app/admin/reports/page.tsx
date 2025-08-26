"use client"
import { useState, useEffect } from "react"
import { useAuth } from "../../../lib/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card"
import { Badge } from "../../../components/ui/badge"
import { Button } from "../../../components/ui/button"
import { Alert, AlertDescription } from "../../../components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "../../../components/ui/tabs"
import {
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  Package,
  ShoppingCart,
  Calendar,
  Star,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react"

export default function AdminReportsPage() {
  const [reportsData, setReportsData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [period, setPeriod] = useState("month")
  const [activeTab, setActiveTab] = useState("overview")

  const { user, token } = useAuth()

  useEffect(() => {
    if (user?.role === "admin" && token) {
      fetchReportsData()
    }
  }, [user, token, period])

  const fetchReportsData = async () => {
    try {
      const response = await fetch(`/api/admin/reports/earnings?period=${period}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (response.ok) {
        setReportsData(data)
      } else {
        setError(data.error)
      }
    } catch (error) {
      setError("Failed to load reports data")
    } finally {
      setLoading(false)
    }
  }

  const getGrowthIndicator = (current, previous) => {
    if (!previous || previous === 0) return { value: 0, isPositive: true }
    const growth = ((current - previous) / previous) * 100
    return {
      value: Math.abs(growth).toFixed(1),
      isPositive: growth >= 0,
    }
  }

  const formatCurrency = (amount) => {
    return `Rs ${amount?.toLocaleString() || 0}`
  }

  const approveIncentive = async (userId: string, type: 'umrah' | 'salary' | 'car') => {
    try {
      const res = await fetch(`/api/admin/incentives/${userId}/approve?type=${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        // send type in query to avoid body parsing issues
        body: JSON.stringify({}),
      })
      const data = await res.json()
      if (!res.ok) {
        console.error('Approve failed:', data)
        alert(data?.error || 'Failed to approve')
        return
      }
      await fetchReportsData()
    } catch (e) {
      console.error('Approve error:', e)
      alert('Network error')
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Reports & Analytics</h1>
          <p className="text-muted-foreground">Comprehensive insights into GLOW NETWORK performance</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="quarter">This Quarter</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Period Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="glass border-white/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(reportsData?.overallStats?.totalRevenue)}</p>
                <div className="flex items-center mt-1">
                  {(() => {
                    const growth = getGrowthIndicator(
                      reportsData?.overallStats?.totalRevenue,
                      reportsData?.previousStats?.totalRevenue
                    )
                    return (
                      <>
                        {growth.isPositive ? (
                          <ArrowUpRight className="w-3 h-3 text-green-500 mr-1" />
                        ) : (
                          <ArrowDownRight className="w-3 h-3 text-red-500 mr-1" />
                        )}
                        <span className={`text-xs ${growth.isPositive ? "text-green-600" : "text-red-600"}`}>
                          {growth.value}%
                        </span>
                      </>
                    )
                  })()}
                </div>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-white/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Package Sales</p>
                <p className="text-2xl font-bold">{formatCurrency(reportsData?.overallStats?.totalPackageSales)}</p>
                <div className="flex items-center mt-1">
                  {(() => {
                    const growth = getGrowthIndicator(
                      reportsData?.overallStats?.totalPackageSales,
                      reportsData?.previousStats?.totalPackageSales
                    )
                    return (
                      <>
                        {growth.isPositive ? (
                          <ArrowUpRight className="w-3 h-3 text-green-500 mr-1" />
                        ) : (
                          <ArrowDownRight className="w-3 h-3 text-red-500 mr-1" />
                        )}
                        <span className={`text-xs ${growth.isPositive ? "text-green-600" : "text-red-600"}`}>
                          {growth.value}%
                        </span>
                      </>
                    )
                  })()}
                </div>
              </div>
              <Package className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-white/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Product Sales</p>
                <p className="text-2xl font-bold">{formatCurrency(reportsData?.overallStats?.totalProductSales)}</p>
                <div className="flex items-center mt-1">
                  {(() => {
                    const growth = getGrowthIndicator(
                      reportsData?.overallStats?.totalProductSales,
                      reportsData?.previousStats?.totalProductSales
                    )
                    return (
                      <>
                        {growth.isPositive ? (
                          <ArrowUpRight className="w-3 h-3 text-green-500 mr-1" />
                        ) : (
                          <ArrowDownRight className="w-3 h-3 text-red-500 mr-1" />
                        )}
                        <span className={`text-xs ${growth.isPositive ? "text-green-600" : "text-red-600"}`}>
                          {growth.value}%
                        </span>
                      </>
                    )
                  })()}
                </div>
              </div>
              <ShoppingCart className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-white/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Payouts</p>
                <p className="text-2xl font-bold">{formatCurrency(reportsData?.overallStats?.totalPayouts)}</p>
                <div className="flex items-center mt-1">
                  {(() => {
                    const growth = getGrowthIndicator(
                      reportsData?.overallStats?.totalPayouts,
                      reportsData?.previousStats?.totalPayouts
                    )
                    return (
                      <>
                        {growth.isPositive ? (
                          <ArrowUpRight className="w-3 h-3 text-green-500 mr-1" />
                        ) : (
                          <ArrowDownRight className="w-3 h-3 text-red-500 mr-1" />
                        )}
                        <span className={`text-xs ${growth.isPositive ? "text-green-600" : "text-red-600"}`}>
                          {growth.value}%
                        </span>
                      </>
                    )
                  })()}
                </div>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Reports */}
      <Card className="glass border-white/20">
        <CardHeader>
          <CardTitle>Detailed Analytics</CardTitle>
          <CardDescription>Comprehensive breakdown of network performance</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="earnings">Earnings</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="incentives">Incentives</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">User Statistics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Total Users</span>
                      <span className="font-semibold">{reportsData?.overallStats?.totalUsers || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Active Users</span>
                      <span className="font-semibold text-green-600">
                        {reportsData?.overallStats?.activeUsers || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>New Users ({period})</span>
                      <span className="font-semibold text-blue-600">
                        {reportsData?.overallStats?.newUsers || 0}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Financial Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Gross Revenue</span>
                      <span className="font-semibold">{formatCurrency(reportsData?.overallStats?.totalRevenue)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Net Profit</span>
                      <span className="font-semibold text-green-600">
                        {formatCurrency(reportsData?.overallStats?.netProfit)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Profit Margin</span>
                      <span className="font-semibold text-blue-600">
                        {reportsData?.overallStats?.profitMargin?.toFixed(1) || 0}%
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Top Performing Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {reportsData?.categoryPerformance?.map((category, index) => (
                      <div key={category._id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-semibold text-primary">#{index + 1}</span>
                          </div>
                          <div>
                            <p className="font-medium">{category._id}</p>
                            <p className="text-sm text-muted-foreground">
                              {category.count} transactions
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatCurrency(category.total)}</p>
                          <p className="text-xs text-muted-foreground">
                            Avg: {formatCurrency(category.average)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Earnings Tab */}
          {activeTab === "earnings" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Top Earners</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {reportsData?.topEarners?.map((user, index) => (
                      <div key={user._id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-semibold text-primary">#{index + 1}</span>
                          </div>
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline">{user.rank.replace("_", " ").toUpperCase()}</Badge>
                              <span className="text-xs text-muted-foreground">{user.email}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-primary">{formatCurrency(user.totalIncome)}</p>
                          <p className="text-xs text-muted-foreground">
                            Released: {formatCurrency(user.releasedIncome)}
                          </p>
                          {user.pendingIncome > 0 && (
                            <p className="text-xs text-yellow-600">
                              Pending: {formatCurrency(user.pendingIncome)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === "users" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Rank Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {reportsData?.rankDistribution?.map((rank) => (
                      <div key={rank._id} className="text-center p-4 border rounded-lg">
                        <Badge className="mb-2" variant="secondary">
                          {rank._id.replace("_", " ").toUpperCase()}
                        </Badge>
                        <p className="text-2xl font-bold">{rank.count}</p>
                        <p className="text-xs text-muted-foreground">
                          Avg: {formatCurrency(rank.avgIncome)}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Performance Tab */}
          {activeTab === "performance" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Monthly Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {reportsData?.monthlyTrends?.map((month) => (
                      <div key={month.month} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{month.month}</p>
                          <p className="text-sm text-muted-foreground">
                            {month.newUsers} new users, {month.transactions} transactions
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatCurrency(month.revenue)}</p>
                          <div className="flex items-center mt-1">
                            {month.growth >= 0 ? (
                              <ArrowUpRight className="w-3 h-3 text-green-500 mr-1" />
                            ) : (
                              <ArrowDownRight className="w-3 h-3 text-red-500 mr-1" />
                            )}
                            <span className={`text-xs ${month.growth >= 0 ? "text-green-600" : "text-red-600"}`}>
                              {Math.abs(month.growth).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Incentives Tab */}
          {activeTab === "incentives" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Incentives</CardTitle>
                  <CardDescription>Pending and approved incentives</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <h3 className="text-sm font-semibold mb-2">Umrah</h3>
                      <div className="space-y-2">
                        {reportsData?.incentives?.umrah?.pending?.map((u) => (
                          <div key={u._id} className="flex items-center justify-between p-2 border rounded">
                            <span className="text-sm">{u.name}</span>
                            <div className="space-x-2">
                              <Badge variant="secondary">PENDING</Badge>
                              <Button size="sm" variant="outline" onClick={() => approveIncentive(u._id, 'umrah')}>Approve</Button>
                            </div>
                          </div>
                        ))}
                        {reportsData?.incentives?.umrah?.approved?.map((u) => (
                          <div key={u._id} className="flex items-center justify-between p-2 border rounded bg-green-50">
                            <span className="text-sm">{u.name}</span>
                            <Badge className="bg-green-100 text-green-800">APPROVED</Badge>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold mb-2">Fixed Salary</h3>
                      <div className="space-y-2">
                        {reportsData?.incentives?.salary?.pending?.map((u) => (
                          <div key={u._id} className="flex items-center justify-between p-2 border rounded">
                            <span className="text-sm">{u.name}</span>
                            <div className="space-x-2">
                              <Badge variant="secondary">PENDING</Badge>
                              <Button size="sm" variant="outline" onClick={() => approveIncentive(u._id, 'salary')}>Approve</Button>
                            </div>
                          </div>
                        ))}
                        {reportsData?.incentives?.salary?.approved?.map((u) => (
                          <div key={u._id} className="flex items-center justify-between p-2 border rounded bg-green-50">
                            <span className="text-sm">{u.name}</span>
                            <Badge className="bg-green-100 text-green-800">APPROVED</Badge>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold mb-2">Car Plan</h3>
                      <div className="space-y-2">
                        {reportsData?.incentives?.car?.pending?.map((u) => (
                          <div key={u._id} className="flex items-center justify-between p-2 border rounded">
                            <span className="text-sm">{u.name}</span>
                            <div className="space-x-2">
                              <Badge variant="secondary">PENDING</Badge>
                              <Button size="sm" variant="outline" onClick={() => approveIncentive(u._id, 'car')}>Approve</Button>
                            </div>
                          </div>
                        ))}
                        {reportsData?.incentives?.car?.approved?.map((u) => (
                          <div key={u._id} className="flex items-center justify-between p-2 border rounded bg-green-50">
                            <span className="text-sm">{u.name}</span>
                            <Badge className="bg-green-100 text-green-800">APPROVED</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
