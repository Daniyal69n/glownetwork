"use client"
import { useState, useEffect } from "react"
import { useAuth } from "../../lib/auth-context.js"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import { Alert, AlertDescription } from "../../components/ui/alert"
import { Clock, CheckCircle, XCircle, Truck, Package } from "lucide-react"

export default function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const { user, token } = useAuth()

  useEffect(() => {
    if (user && token) {
      fetchOrders()
    }
  }, [user, token])

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/orders", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (response.ok) {
        setOrders(data.orders)
      } else {
        setError(data.error)
      }
    } catch (error) {
      setError("Failed to load orders")
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
          <h1 className="text-3xl font-bold mb-2">My Orders</h1>
          <p className="text-muted-foreground">Track your product orders and delivery status</p>
        </div>

        {/* Orders List */}
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
            <p className="text-muted-foreground">Start shopping to see your orders here</p>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <Card key={order._id} className="glass border-white/20 shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        {getStatusIcon(order.status)}
                        <span>Order #{order._id.slice(-8)}</span>
                      </CardTitle>
                      <CardDescription>
                        Placed on {new Date(order.createdAt).toLocaleDateString()} • Total: ₹
                        {order.total.toLocaleString()}
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(order.status)}>{order.status.toUpperCase()}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Order Items */}
                  <div className="space-y-3 mb-4">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex items-center space-x-4 p-3 bg-muted/50 rounded-lg">
                        <img
                          src={item.productId.images?.[0] || "/placeholder.svg?height=60&width=60"}
                          alt={item.productId.title}
                          className="w-12 h-12 object-cover rounded"
                        />
                        <div className="flex-1">
                          <p className="font-medium">{item.productId.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.productId.sku} • Qty: {item.quantity} • ₹{item.price.toLocaleString()} each
                          </p>
                        </div>
                        <p className="font-semibold">₹{(item.price * item.quantity).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>

                  {/* Order Status Details */}
                  <div className="border-t pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Order Date</p>
                        <p className="font-medium">{new Date(order.createdAt).toLocaleDateString()}</p>
                      </div>
                      {order.dispatchedAt && (
                        <div>
                          <p className="text-muted-foreground">Dispatched</p>
                          <p className="font-medium">{new Date(order.dispatchedAt).toLocaleDateString()}</p>
                          {order.trackingNumber && (
                            <p className="text-xs text-muted-foreground">Tracking: {order.trackingNumber}</p>
                          )}
                        </div>
                      )}
                      {order.deliveredAt && (
                        <div>
                          <p className="text-muted-foreground">Delivered</p>
                          <p className="font-medium">{new Date(order.deliveredAt).toLocaleDateString()}</p>
                        </div>
                      )}
                      {order.status === "rejected" && order.rejectionReason && (
                        <div className="md:col-span-3">
                          <p className="text-muted-foreground">Rejection Reason</p>
                          <p className="font-medium text-red-600">{order.rejectionReason}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
