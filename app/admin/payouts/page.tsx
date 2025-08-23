"use client"
import { useState, useEffect } from "react"
import { useAuth } from "../../../lib/auth-context.js"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card"
import { Badge } from "../../../components/ui/badge"
import { Button } from "../../../components/ui/button"
import { Alert, AlertDescription } from "../../../components/ui/alert"
import { Tabs, TabsList, TabsTrigger } from "../../../components/ui/tabs"
import { Checkbox } from "../../../components/ui/checkbox"
import { TrendingUp, Clock, CheckCircle, ArrowUpRight, ArrowDownRight, Calendar } from "lucide-react"

export default function AdminPayoutsPage() {
  const [payouts, setPayouts] = useState([])
  const [summary, setSummary] = useState({})
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [selectedPayouts, setSelectedPayouts] = useState(new Set())
  const [activeTab, setActiveTab] = useState("pending")

  const { user, token } = useAuth()

  useEffect(() => {
    if (user?.role === "admin" && token) {
      fetchPayouts()
    }
  }, [user, token, activeTab])

  const fetchPayouts = async () => {
    try {
      const response = await fetch(`/api/admin/payouts?status=${activeTab}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (response.ok) {
        setPayouts(data.payouts || [])
        setSummary(data.summary || {})
      } else {
        setError(data.error)
      }
    } catch (error) {
      setError("Failed to load payouts")
    } finally {
      setLoading(false)
    }
  }

  const handleReleasePayout = async (payoutId) => {
    setProcessing(true)
    setError("")
    setMessage("")

    try {
      const response = await fetch(`/api/admin/payouts/${payoutId}/release`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(data.message)
        fetchPayouts() // Refresh data
      } else {
        setError(data.error)
      }
    } catch (error) {
      setError("Network error. Please try again.")
    } finally {
      setProcessing(false)
    }
  }

  const handleBulkRelease = async () => {
    if (selectedPayouts.size === 0) {
      setError("Please select payouts to release")
      return
    }

    setProcessing(true)
    setError("")
    setMessage("")

    try {
      const response = await fetch("/api/admin/payouts/bulk-release", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          payoutIds: Array.from(selectedPayouts),
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(data.message)
        setSelectedPayouts(new Set())
        fetchPayouts() // Refresh data
      } else {
        setError(data.error)
      }
    } catch (error) {
      setError("Network error. Please try again.")
    } finally {
      setProcessing(false)
    }
  }

  const togglePayoutSelection = (payoutId) => {
    const newSelected = new Set(selectedPayouts)
    if (newSelected.has(payoutId)) {
      newSelected.delete(payoutId)
    } else {
      newSelected.add(payoutId)
    }
    setSelectedPayouts(newSelected)
  }

  const selectAllPending = () => {
    const pendingPayouts = payouts.filter((p) => p.status === "pending")
    setSelectedPayouts(new Set(pendingPayouts.map((p) => p._id)))
  }

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>Admin access required</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-primary/5">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Payout Management</h1>
          <p className="text-muted-foreground">Manage and release member payouts</p>
        </div>

        {/* Messages */}
        {message && (
          <Alert className="mb-6 border-green-200 bg-green-50 text-green-800">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="glass border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Payouts</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    ₹{summary?.pending?.total?.toLocaleString() || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">{summary?.pending?.count || 0} transactions</p>
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
                  <p className="text-2xl font-bold text-green-600">
                    ₹{summary?.released?.total?.toLocaleString() || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">{summary?.released?.count || 0} transactions</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Payouts</p>
                  <p className="text-2xl font-bold text-primary">
                    ₹
                    {(
                      (summary?.pending?.total || 0) +
                      (summary?.released?.total || 0) +
                      (summary?.paid?.total || 0)
                    ).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(summary?.pending?.count || 0) + (summary?.released?.count || 0) + (summary?.paid?.count || 0)}{" "}
                    transactions
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payout Management */}
        <Card className="glass border-white/20">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Payout Transactions</CardTitle>
                <CardDescription>Manage member payouts and releases</CardDescription>
              </div>
              {activeTab === "pending" && selectedPayouts.size > 0 && (
                <div className="flex space-x-2">
                  <Button onClick={selectAllPending} variant="outline" size="sm">
                    Select All Pending
                  </Button>
                  <Button onClick={handleBulkRelease} disabled={processing} className="gradient-brand text-white">
                    {processing ? "Processing..." : `Release ${selectedPayouts.size} Payouts`}
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="released">Released</TabsTrigger>
                <TabsTrigger value="paid">Paid</TabsTrigger>
                <TabsTrigger value="all">All</TabsTrigger>
              </TabsList>
            </Tabs>

            {payouts.length > 0 ? (
              <div className="space-y-4">
                {payouts.map((payout) => (
                  <div key={payout._id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      {activeTab === "pending" && (
                        <Checkbox
                          checked={selectedPayouts.has(payout._id)}
                          onCheckedChange={() => togglePayoutSelection(payout._id)}
                        />
                      )}
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="font-medium">₹{payout.amount.toLocaleString()}</p>
                          {payout.type === "direct" ? (
                            <ArrowUpRight className="w-4 h-4 text-green-500" />
                          ) : (
                            <ArrowDownRight className="w-4 h-4 text-blue-500" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">{payout.userId.name}</span> ({payout.userId.email})
                        </p>
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
                    <div className="flex items-center space-x-2">
                      <Badge
                        className={
                          payout.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : payout.status === "released"
                              ? "bg-green-100 text-green-800"
                              : "bg-blue-100 text-blue-800"
                        }
                      >
                        {payout.status.toUpperCase()}
                      </Badge>
                      {payout.status === "pending" && (
                        <Button
                          onClick={() => handleReleasePayout(payout._id)}
                          disabled={processing}
                          size="sm"
                          className="gradient-brand text-white"
                        >
                          {processing ? "..." : "Release"}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No {activeTab} payouts found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
