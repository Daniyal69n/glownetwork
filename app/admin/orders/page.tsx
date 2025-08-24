"use client"
import { useState, useEffect } from "react"
import { useAuth } from "../../../lib/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card"
import { Badge } from "../../../components/ui/badge"
import { Button } from "../../../components/ui/button"
import { Alert, AlertDescription } from "../../../components/ui/alert"
import { Tabs, TabsList, TabsTrigger } from "../../../components/ui/tabs"
import {
  ShoppingCart,
  Clock,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  Calendar,
  Package,
} from "lucide-react"

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([])
  const [summary, setSummary] = useState({})
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(null)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [activeTab, setActiveTab] = useState("pending")

  const { user, token } = useAuth()

  useEffect(() => {
    if (user?.role === "admin" && token) {
      fetchOrders()
    }
  }, [user, token, activeTab])

  const fetchOrders = async () => {
    try {
      const response = await fetch(`/api/admin/orders?status=${activeTab}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (response.ok) {
        setOrders(data.orders || [])
        setSummary(data.summary || {})
      } else {
        setError(data.error)
      }
    } catch (error) {
      setError("Failed to load orders")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateOrderStatus = async (orderId, action) => {
    setProcessing(orderId)
    setError("")
    setMessage("")

    try {
      let endpoint = ""
      let method = "POST"

      switch (action) {
        case "approve":
          endpoint = `/api/admin/orders/${orderId}/approve`
          break
        case "dispatch":
          endpoint = `/api/admin/orders/${orderId}/dispatch`
          break
        case "deliver":
          endpoint = `/api/admin/orders/${orderId}/deliver`
          break
        default:
          setError("Invalid action")
          setProcessing(null)
          return
      }

             const response = await fetch(endpoint, {
         method,
         headers: {
           "Content-Type": "application/json",
           Authorization: `Bearer ${token}`,
         },
         body: JSON.stringify({ action }),
       })

      const data = await response.json()

      if (response.ok) {
        setMessage(data.message)
        fetchOrders() // Refresh data
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
      case "dispatched":
        return <ArrowUpRight className="w-4 h-4 text-blue-500" />
      case "delivered":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "cancelled":
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
      case "dispatched":
        return "bg-blue-100 text-blue-800"
      case "delivered":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getNextAction = (status) => {
    switch (status) {
      case "pending":
        return "approve"
      case "approved":
        return "dispatch"
      case "dispatched":
        return "deliver"
      default:
        return null
    }
  }

  const getNextActionLabel = (status) => {
    switch (status) {
      case "pending":
        return "Approve"
      case "approved":
        return "Dispatch"
      case "dispatched":
        return "Mark Delivered"
      default:
        return ""
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
        <h1 className="text-3xl font-bold mb-2">Order Management</h1>
        <p className="text-muted-foreground">Manage product orders and fulfillment</p>
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="glass border-white/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Orders</p>
                <p className="text-2xl font-bold text-yellow-600">Rs {summary?.pending?.total?.toLocaleString() || 0}</p>
                <p className="text-xs text-muted-foreground">{summary?.pending?.count || 0} orders</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-white/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Approved Orders</p>
                <p className="text-2xl font-bold text-green-600">Rs {summary?.approved?.total?.toLocaleString() || 0}</p>
                <p className="text-xs text-muted-foreground">{summary?.approved?.count || 0} orders</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-white/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Dispatched Orders</p>
                <p className="text-2xl font-bold text-blue-600">Rs {summary?.dispatched?.total?.toLocaleString() || 0}</p>
                <p className="text-xs text-muted-foreground">{summary?.dispatched?.count || 0} orders</p>
              </div>
              <ArrowUpRight className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-white/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold text-primary">
                  Rs
                  {(
                    (summary?.pending?.total || 0) +
                    (summary?.approved?.total || 0) +
                    (summary?.dispatched?.total || 0) +
                    (summary?.delivered?.total || 0)
                  ).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  {(summary?.pending?.count || 0) +
                    (summary?.approved?.count || 0) +
                    (summary?.dispatched?.count || 0) +
                    (summary?.delivered?.count || 0)}{" "}
                  orders
                </p>
              </div>
              <ShoppingCart className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Order Management */}
      <Card className="glass border-white/20">
        <CardHeader>
          <CardTitle>Order Management</CardTitle>
          <CardDescription>Review and manage product orders</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="dispatched">Dispatched</TabsTrigger>
              <TabsTrigger value="delivered">Delivered</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>
          </Tabs>

          {orders.length > 0 ? (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order._id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    {getStatusIcon(order.status)}
                    <div>
                      <div className="flex items-center space-x-2">
                                                 <p className="font-medium">Rs {order.total?.toLocaleString() || '0'}</p>
                        <Badge variant="outline">
                          {order.items?.length || 0} item{(order.items?.length || 0) > 1 ? "s" : ""}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">{order.userId?.name || 'Unknown User'}</span> ({order.userId?.email || 'No email'})
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {new Date(order.createdAt).toLocaleDateString()}
                        </span>
                        {order.approvedAt && <span>Approved: {new Date(order.approvedAt).toLocaleDateString()}</span>}
                        {order.dispatchedAt && <span>Dispatched: {new Date(order.dispatchedAt).toLocaleDateString()}</span>}
                        {order.deliveredAt && <span>Delivered: {new Date(order.deliveredAt).toLocaleDateString()}</span>}
                      </div>
                      <div className="mt-2">
                        <p className="text-xs text-muted-foreground">Items:</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {order.items?.map((item, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {item.productId?.name || 'Unknown Product'} x{item.quantity || 0}
                            </Badge>
                          )) || <span className="text-xs text-muted-foreground">No items</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(order.status)}>{order.status.toUpperCase()}</Badge>
                    {getNextAction(order.status) && (
                      <Button
                        onClick={() => handleUpdateOrderStatus(order._id, getNextAction(order.status))}
                        disabled={processing === order._id}
                        size="sm"
                        className="gradient-brand text-white"
                      >
                        {processing === order._id ? "..." : getNextActionLabel(order.status)}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No {activeTab} orders found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
