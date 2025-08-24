"use client"
import { useState, useEffect } from "react"
import { useAuth } from "../../lib/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import { Alert, AlertDescription } from "../../components/ui/alert"
import { Tabs, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { 
  ShoppingCart, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Truck, 
  Calendar,
  Package,
  DollarSign
} from "lucide-react"

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState("all")

  const { user, token } = useAuth()

  useEffect(() => {
    if (user && token) {
      fetchOrders()
    }
  }, [user, token, activeTab])

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/orders", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (response.ok) {
        setOrders(data.orders || [])
        // Calculate stats from orders
        const orderStats = calculateOrderStats(data.orders || [])
        setStats(orderStats)
      } else {
        setError(data.error)
      }
    } catch (error) {
      setError("Failed to load order data")
    } finally {
      setLoading(false)
    }
  }

  const calculateOrderStats = (orders) => {
    const stats = {
      pending: 0,
      approved: 0,
      dispatched: 0,
      delivered: 0,
      cancelled: 0,
      total: 0,
      totalAmount: 0
    }

    orders.forEach(order => {
      stats.total++
      stats.totalAmount += order.total || 0
      
      switch (order.status) {
        case "pending":
          stats.pending++
          break
        case "approved":
          stats.approved++
          break
        case "dispatched":
          stats.dispatched++
          break
        case "delivered":
          stats.delivered++
          break
        case "cancelled":
        case "rejected":
          stats.cancelled++
          break
      }
    })

    return stats
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
      case "rejected":
        return "bg-red-100 text-red-800"
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

  const filteredOrders = orders.filter((order) => {
    if (activeTab === "all") return true
    return order.status === activeTab
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
          <h1 className="text-3xl font-bold mb-2">Order History</h1>
          <p className="text-muted-foreground">Track your product orders and delivery status</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="glass border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Orders</p>
                  <p className="text-2xl font-bold text-primary">{stats?.total || 0}</p>
                </div>
                <ShoppingCart className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Orders</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats?.pending || 0}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Delivered Orders</p>
                  <p className="text-2xl font-bold text-green-600">{stats?.delivered || 0}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Spent</p>
                  <p className="text-2xl font-bold text-blue-600">Rs {stats?.totalAmount?.toLocaleString() || 0}</p>
                </div>
                <DollarSign className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order List */}
        <Card className="glass border-white/20">
          <CardHeader>
            <CardTitle>Order Transactions</CardTitle>
            <CardDescription>Your complete order history</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="approved">Approved</TabsTrigger>
                <TabsTrigger value="dispatched">Dispatched</TabsTrigger>
                <TabsTrigger value="delivered">Delivered</TabsTrigger>
                <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
              </TabsList>
            </Tabs>

            {filteredOrders.length > 0 ? (
              <div className="space-y-4">
                {filteredOrders.map((order) => (
                  <div key={order._id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(order.status)}
                        <div>
                          <p className="font-medium">Order #{order._id.slice(-8)}</p>
                          <p className="text-sm text-muted-foreground">
                            {order.items?.length || 0} item{(order.items?.length || 0) > 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">Rs {order.total?.toLocaleString() || '0'}</p>
                        <Badge className={getStatusColor(order.status)}>{order.status.toUpperCase()}</Badge>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="space-y-2 mb-3">
                      {order.items?.map((item, index) => (
                        <div key={index} className="flex items-center space-x-3 p-2 bg-muted/30 rounded">
                          <img
                            src={item.productId?.images?.[0] || "/placeholder.svg?height=40&width=40"}
                            alt={item.productId?.title || 'Product'}
                            className="w-10 h-10 object-cover rounded"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{item.productId?.title || 'Unknown Product'}</p>
                            <p className="text-xs text-muted-foreground">
                              Qty: {item.quantity || 0} • Rs {item.price?.toLocaleString() || '0'} each
                            </p>
                          </div>
                          <p className="text-sm font-semibold">
                            Rs {((item.price || 0) * (item.quantity || 0)).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Order Details */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-3">
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {new Date(order.createdAt).toLocaleDateString()}
                        </span>
                        {order.approvedAt && (
                          <span>Approved: {new Date(order.approvedAt).toLocaleDateString()}</span>
                        )}
                        {order.dispatchedAt && (
                          <span>Dispatched: {new Date(order.dispatchedAt).toLocaleDateString()}</span>
                        )}
                        {order.deliveredAt && (
                          <span>Delivered: {new Date(order.deliveredAt).toLocaleDateString()}</span>
                        )}
                      </div>
                      {order.trackingNumber && (
                        <span className="text-blue-600">Tracking: {order.trackingNumber}</span>
                      )}
                    </div>

                    {/* Rejection Reason */}
                    {order.status === "rejected" && order.rejectionReason && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm font-medium text-red-800">Rejection Reason:</p>
                        <p className="text-sm text-red-700">{order.rejectionReason}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {activeTab === "all" ? "No orders yet" : `No ${activeTab} orders`}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {activeTab === "all" ? "Start shopping to see your orders here" : ""}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order Information */}
        <Card className="glass border-white/20 mt-8">
          <CardHeader>
            <CardTitle>Order Information</CardTitle>
            <CardDescription>How orders work in GLOW NETWORK</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2 flex items-center">
                  <Clock className="w-4 h-4 text-yellow-500 mr-2" />
                  Order Status
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• <strong>Pending:</strong> Order submitted, awaiting approval</li>
                  <li>• <strong>Approved:</strong> Order confirmed by admin</li>
                  <li>• <strong>Dispatched:</strong> Order shipped with tracking</li>
                  <li>• <strong>Delivered:</strong> Order successfully received</li>
                  <li>• <strong>Cancelled:</strong> Order cancelled or rejected</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2 flex items-center">
                  <Truck className="w-4 h-4 text-blue-500 mr-2" />
                  Delivery Information
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Orders are processed within 24-48 hours</li>
                  <li>• Tracking numbers provided when dispatched</li>
                  <li>• Delivery typically takes 3-7 business days</li>
                  <li>• Contact support for delivery issues</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
