"use client"
import { useState, useEffect } from "react"
import { useAuth } from "../../lib/auth-context.js"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import { Input } from "../../components/ui/input"
import { Alert, AlertDescription } from "../../components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog"
import { ShoppingCart, Search, Filter, Plus, Minus, Package, CheckCircle } from "lucide-react"

export default function ShopPage() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState([])
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [ordering, setOrdering] = useState(false)

  const { user, token } = useAuth()

  useEffect(() => {
    fetchProducts()
  }, [selectedCategory, searchQuery])

  const fetchProducts = async () => {
    try {
      const params = new URLSearchParams()
      if (selectedCategory !== "all") params.append("category", selectedCategory)
      if (searchQuery) params.append("search", searchQuery)

      const response = await fetch(`/api/products?${params}`)
      const data = await response.json()

      if (response.ok) {
        setProducts(data.products)
        setCategories(data.categories)
      } else {
        setError(data.error)
      }
    } catch (error) {
      setError("Failed to load products")
    } finally {
      setLoading(false)
    }
  }

  const addToCart = (product) => {
    const existingItem = cart.find((item) => item.productId === product._id)
    if (existingItem) {
      setCart(cart.map((item) => (item.productId === product._id ? { ...item, quantity: item.quantity + 1 } : item)))
    } else {
      setCart([...cart, { productId: product._id, product, quantity: 1 }])
    }
  }

  const removeFromCart = (productId) => {
    setCart(cart.filter((item) => item.productId !== productId))
  }

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId)
    } else {
      setCart(cart.map((item) => (item.productId === productId ? { ...item, quantity } : item)))
    }
  }

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + item.product.price * item.quantity, 0)
  }

  const getCartItemCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0)
  }

  const handlePlaceOrder = async () => {
    if (!token) {
      setError("Please login to place an order")
      return
    }

    if (cart.length === 0) {
      setError("Your cart is empty")
      return
    }

    const cartTotal = getCartTotal()
    if (user.packageCredit < cartTotal) {
      setError(
        `Insufficient package credit. Required: Rs ${cartTotal.toLocaleString()}, Available: Rs ${user.packageCredit.toLocaleString()}`,
      )
      return
    }

    setOrdering(true)
    setError("")
    setMessage("")

    try {
      const orderItems = cart.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      }))

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ items: orderItems }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(data.message)
        setCart([]) // Clear cart
      } else {
        setError(data.error)
      }
    } catch (error) {
      setError("Network error. Please try again.")
    } finally {
      setOrdering(false)
    }
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
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Beauty Shop</h1>
            <p className="text-muted-foreground">Premium beauty and cosmetics products</p>
            {user && (
              <p className="text-sm text-muted-foreground mt-2">
                Package Credit:{" "}
                <span className="font-semibold text-primary">Rs {user.packageCredit?.toLocaleString() || 0}</span>
              </p>
            )}
          </div>

          {/* Cart Button */}
          <Dialog>
            <DialogTrigger asChild>
              <Button className="gradient-brand text-white relative">
                <ShoppingCart className="w-4 h-4 mr-2" />
                Cart ({getCartItemCount()})
                {getCartItemCount() > 0 && (
                  <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs">{getCartItemCount()}</Badge>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Shopping Cart</DialogTitle>
                <DialogDescription>Review your selected products</DialogDescription>
              </DialogHeader>

              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Your cart is empty</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={item.productId} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <img
                          src={item.product.images[0] || "/placeholder.svg?height=60&width=60"}
                          alt={item.product.title}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div>
                          <h4 className="font-medium">{item.product.title}</h4>
                          <p className="text-sm text-muted-foreground">Rs {item.product.price.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => removeFromCart(item.productId)}>
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}

                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-lg font-semibold">Total: Rs {getCartTotal().toLocaleString()}</span>
                      {user && (
                        <span className="text-sm text-muted-foreground">
                          Remaining Credit: Rs {(user.packageCredit - getCartTotal()).toLocaleString()}
                        </span>
                      )}
                    </div>

                    {message && (
                      <Alert className="mb-4 border-green-200 bg-green-50 text-green-800">
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>{message}</AlertDescription>
                      </Alert>
                    )}

                    {error && (
                      <Alert variant="destructive" className="mb-4">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    <Button
                      onClick={handlePlaceOrder}
                      disabled={ordering || !user || getCartTotal() > (user?.packageCredit || 0)}
                      className="w-full gradient-brand text-white"
                    >
                      {ordering ? "Placing Order..." : "Place Order"}
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full md:w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Products Grid */}
        {products.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No products found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filter criteria</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <Card key={product._id} className="glass border-white/20 shadow-lg hover:shadow-xl transition-shadow">
                <div className="aspect-square overflow-hidden rounded-t-lg">
                  <img
                    src={product.images[0] || "/placeholder.svg?height=300&width=300"}
                    alt={product.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform"
                  />
                </div>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-2">{product.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">{product.sku}</p>
                    </div>
                    <Badge variant="secondary" className="ml-2">
                      {product.category}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription className="line-clamp-2 mb-4">{product.description}</CardDescription>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-primary">Rs {product.price.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">Stock: {product.stock}</p>
                    </div>
                    <Button
                      onClick={() => addToCart(product)}
                      disabled={!user || product.stock === 0}
                      size="sm"
                      className="gradient-brand text-white"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!user && (
          <div className="mt-12 text-center">
            <Card className="glass border-white/20 max-w-md mx-auto">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-2">Ready to Shop?</h3>
                <p className="text-sm text-muted-foreground mb-4">Login to start shopping with your package credit</p>
                <Button className="gradient-brand text-white">Login to Shop</Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
