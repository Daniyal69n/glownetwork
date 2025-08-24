"use client"
import { useState, useEffect } from "react"
import { useAuth } from "../../lib/auth-context.js"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import { Alert, AlertDescription } from "../../components/ui/alert"
import { Tabs, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { TrendingUp, Clock, CheckCircle, ArrowUpRight, ArrowDownRight, Calendar } from "lucide-react"

export default function PayoutsPage() {
  const [payouts, setPayouts] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState("all")

  const { user, token } = useAuth()

  useEffect(() => {
    if (user && token) {
      fetchPayouts()
    }
  }, [user, token, activeTab])

  const fetchPayouts = async () => {
    try {
      const response = await fetch(`/api/users/${user._id}/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (response.ok) {
        setPayouts(data.payouts || [])
        setStats(data.payoutStats || {})
      } else {
        setError(data.error)
      }
    } catch (error) {
      setError("Failed to load payout data")
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-500" />
      case "released":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "paid":
        return <CheckCircle className="w-4 h-4 text-blue-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "released":
        return "bg-green-100 text-green-800"
      case "paid":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const filteredPayouts = payouts.filter((payout) => {
    if (activeTab === "all") return true
    return payout.status === activeTab
  })

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
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Payout History</h1>
          <p className="text-muted-foreground">Track your earnings and payout status</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="glass border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Payouts</p>
                  <p className="text-2xl font-bold text-yellow-600">Rs {stats?.pending?.toLocaleString() || 0}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Released Payouts</p>
                  <p className="text-2xl font-bold text-green-600">Rs {stats?.released?.toLocaleString() || 0}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Earnings</p>
                  <p className="text-2xl font-bold text-primary">
                    Rs {((stats?.pending || 0) + (stats?.released || 0) + (stats?.paid || 0)).toLocaleString()}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payout List */}
        <Card className="glass border-white/20">
          <CardHeader>
            <CardTitle>Payout Transactions</CardTitle>
            <CardDescription>Your complete payout history</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="released">Released</TabsTrigger>
                <TabsTrigger value="paid">Paid</TabsTrigger>
              </TabsList>
            </Tabs>

            {filteredPayouts.length > 0 ? (
              <div className="space-y-4">
                {filteredPayouts.map((payout) => (
                  <div key={payout._id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      {getStatusIcon(payout.status)}
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="font-medium">Rs {payout.amount.toLocaleString()}</p>
                          {payout.type === "direct" ? (
                            <ArrowUpRight className="w-4 h-4 text-green-500" />
                          ) : (
                            <ArrowDownRight className="w-4 h-4 text-blue-500" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {payout.type === "direct" ? "Direct Payout" : `Passive Income (Level ${payout.level})`}
                          {payout.fromUserId && <span className="ml-2">from {payout.fromUserId.name}</span>}
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            {new Date(payout.createdAt).toLocaleDateString()}
                          </span>
                          {payout.releasedAt && (
                            <span>Released: {new Date(payout.releasedAt).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Badge className={getStatusColor(payout.status)}>{payout.status.toUpperCase()}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {activeTab === "all" ? "No payouts yet" : `No ${activeTab} payouts`}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {activeTab === "all" ? "Purchase a package to start earning" : ""}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payout Information */}
        <Card className="glass border-white/20 mt-8">
          <CardHeader>
            <CardTitle>Payout Information</CardTitle>
            <CardDescription>How payouts work in GLOW NETWORK</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2 flex items-center">
                  <ArrowUpRight className="w-4 h-4 text-green-500 mr-2" />
                  Direct Payouts
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Assistant: 30% of package amount</li>
                  <li>• Manager: 35% of package amount</li>
                  <li>• Senior Manager & above: 40% of package amount</li>
                  <li>• Paid immediately upon package approval</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2 flex items-center">
                  <ArrowDownRight className="w-4 h-4 text-blue-500 mr-2" />
                  Passive Income
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• 5% from 1st level downline (Manager+)</li>
                  <li>• 5% from 2nd level downline (Manager+)</li>
                  <li>• Earned when your team purchases packages</li>
                  <li>• Released by admin approval</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
