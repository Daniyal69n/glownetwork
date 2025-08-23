"use client"
import { useState, useEffect } from "react"
import { useAuth } from "../../../lib/auth-context.js"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card"
import { Badge } from "../../../components/ui/badge"
import { Button } from "../../../components/ui/button"
import { Alert, AlertDescription } from "../../../components/ui/alert"
import { Tabs, TabsList, TabsTrigger } from "../../../components/ui/tabs"
import { Textarea } from "../../../components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../../components/ui/dialog"
import { Package, Clock, CheckCircle, XCircle, Calendar, User } from "lucide-react"

export default function AdminPackagesPage() {
  const [packages, setPackages] = useState([])
  const [summary, setSummary] = useState({})
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(null)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [activeTab, setActiveTab] = useState("pending")
  const [rejectionReason, setRejectionReason] = useState("")
  const [selectedPackage, setSelectedPackage] = useState(null)

  const { user, token } = useAuth()

  useEffect(() => {
    if (user?.role === "admin" && token) {
      fetchPackages()
    }
  }, [user, token, activeTab])

  const fetchPackages = async () => {
    try {
      const response = await fetch(`/api/admin/packages?status=${activeTab}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (response.ok) {
        setPackages(data.purchases || [])
        setSummary(data.summary || {})
      } else {
        setError(data.error)
      }
    } catch (error) {
      setError("Failed to load packages")
    } finally {
      setLoading(false)
    }
  }

  const handleApprovePackage = async (packageId) => {
    setProcessing(packageId)
    setError("")
    setMessage("")

    try {
      const response = await fetch(`/api/admin/packages/${packageId}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: "approve" }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(data.message)
        fetchPackages() // Refresh data
      } else {
        setError(data.error)
      }
    } catch (error) {
      setError("Network error. Please try again.")
    } finally {
      setProcessing(null)
    }
  }

  const handleRejectPackage = async (packageId) => {
    if (!rejectionReason.trim()) {
      setError("Please provide a rejection reason")
      return
    }

    setProcessing(packageId)
    setError("")
    setMessage("")

    try {
      const response = await fetch(`/api/admin/packages/${packageId}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "reject",
          rejectionReason: rejectionReason.trim(),
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(data.message)
        setRejectionReason("")
        setSelectedPackage(null)
        fetchPackages() // Refresh data
      } else {
        setError(data.error)
      }
    } catch (error) {
      setError("Network error. Please try again.")
    } finally {
      setProcessing(null)
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Package Approvals</h1>
        <p className="text-muted-foreground">Manage member package purchases and approvals</p>
      </div>

      {/* Messages */}
      {message && (
        <Alert className="border-green-200 bg-green-50 text-green-800">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass border-white/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Packages</p>
                <p className="text-2xl font-bold text-yellow-600">₹{summary?.pending?.total?.toLocaleString() || 0}</p>
                <p className="text-xs text-muted-foreground">{summary?.pending?.count || 0} purchases</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-white/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Approved Packages</p>
                <p className="text-2xl font-bold text-green-600">₹{summary?.approved?.total?.toLocaleString() || 0}</p>
                <p className="text-xs text-muted-foreground">{summary?.approved?.count || 0} purchases</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-white/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Packages</p>
                <p className="text-2xl font-bold text-primary">
                  ₹
                  {(
                    (summary?.pending?.total || 0) +
                    (summary?.approved?.total || 0) +
                    (summary?.rejected?.total || 0)
                  ).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  {(summary?.pending?.count || 0) + (summary?.approved?.count || 0) + (summary?.rejected?.count || 0)}{" "}
                  purchases
                </p>
              </div>
              <Package className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Package Management */}
      <Card className="glass border-white/20">
        <CardHeader>
          <CardTitle>Package Purchases</CardTitle>
          <CardDescription>Review and approve member package purchases</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>
          </Tabs>

          {packages.length > 0 ? (
            <div className="space-y-4">
              {packages.map((pkg) => (
                <div key={pkg._id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    {getStatusIcon(pkg.status)}
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="font-medium">₹{pkg.packageAmount.toLocaleString()}</p>
                        <Badge variant="outline">
                          {pkg.packageAmount === 20000 ? "Basic" : pkg.packageAmount === 50000 ? "Premium" : "Elite"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground flex items-center">
                        <User className="w-3 h-3 mr-1" />
                        {pkg.userId.name} ({pkg.userId.email})
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Rank: {pkg.userId.rank.replace("_", " ").toUpperCase()}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {new Date(pkg.createdAt).toLocaleDateString()}
                        </span>
                        {pkg.approvedAt && <span>Approved: {new Date(pkg.approvedAt).toLocaleDateString()}</span>}
                      </div>
                      {pkg.rejectionReason && (
                        <p className="text-xs text-red-600 mt-1">Reason: {pkg.rejectionReason}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(pkg.status)}>{pkg.status.toUpperCase()}</Badge>
                    {pkg.status === "pending" && (
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => handleApprovePackage(pkg._id)}
                          disabled={processing === pkg._id}
                          size="sm"
                          className="gradient-brand text-white"
                        >
                          {processing === pkg._id ? "..." : "Approve"}
                        </Button>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setSelectedPackage(pkg)}>
                              Reject
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Reject Package Purchase</DialogTitle>
                              <DialogDescription>
                                Provide a reason for rejecting this ₹{pkg.packageAmount.toLocaleString()} package
                                purchase by {pkg.userId.name}.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <Textarea
                                placeholder="Enter rejection reason..."
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                rows={3}
                              />
                              <div className="flex justify-end space-x-2">
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setRejectionReason("")
                                    setSelectedPackage(null)
                                  }}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  onClick={() => handleRejectPackage(pkg._id)}
                                  disabled={processing === pkg._id || !rejectionReason.trim()}
                                  variant="destructive"
                                >
                                  {processing === pkg._id ? "Processing..." : "Reject Package"}
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No {activeTab} packages found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
