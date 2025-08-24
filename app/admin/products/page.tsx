"use client"
import { useState, useEffect } from "react"
import { useAuth } from "../../../lib/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card"
import { Badge } from "../../../components/ui/badge"
import { Button } from "../../../components/ui/button"
import { Alert, AlertDescription } from "../../../components/ui/alert"
import { Input } from "../../../components/ui/input"
import { Textarea } from "../../../components/ui/textarea"
import { Label } from "../../../components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../../components/ui/dialog"
import {
  Gift,
  Plus,
  Edit,
  Trash2,
  Search,
  Package,
  DollarSign,
  Tag,
} from "lucide-react"

export default function AdminProductsPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [editingProduct, setEditingProduct] = useState(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const { user, token } = useAuth()

  useEffect(() => {
    if (user?.role === "admin" && token) {
      fetchProducts()
    }
  }, [user, token])

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/admin/products", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (response.ok) {
        setProducts(data.products || [])
      } else {
        setError(data.error)
      }
    } catch (error) {
      setError("Failed to load products")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProduct = async (productData) => {
    try {
      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(productData),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage("Product created successfully")
        setIsDialogOpen(false)
        setEditingProduct(null)
        fetchProducts()
      } else {
        setError(data.error)
      }
    } catch (error) {
      setError("Network error. Please try again.")
    }
  }

  const handleUpdateProduct = async (productId, productData) => {
    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(productData),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage("Product updated successfully")
        setIsDialogOpen(false)
        setEditingProduct(null)
        fetchProducts()
      } else {
        setError(data.error)
      }
    } catch (error) {
      setError("Network error. Please try again.")
    }
  }

  const handleDeleteProduct = async (productId) => {
    if (!confirm("Are you sure you want to delete this product?")) return

    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (response.ok) {
        setMessage("Product deleted successfully")
        fetchProducts()
      } else {
        setError(data.error)
      }
    } catch (error) {
      setError("Network error. Please try again.")
    }
  }

  const openCreateDialog = () => {
    setEditingProduct(null)
    setIsDialogOpen(true)
  }

  const openEditDialog = (product) => {
    setEditingProduct(product)
    setIsDialogOpen(true)
  }

  const filteredProducts = products.filter((product) =>
    product.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category?.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Product Management</h1>
          <p className="text-muted-foreground">Manage GLOW NETWORK products and inventory</p>
        </div>
        <Button onClick={openCreateDialog} className="gradient-brand text-white">
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Messages */}
      {message && (
        <Alert className="border-green-200 bg-green-50 text-green-800">
          <Gift className="h-4 w-4" />
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
                <p className="text-sm text-muted-foreground">Total Products</p>
                <p className="text-2xl font-bold">{products.length}</p>
                <p className="text-xs text-muted-foreground">Active products</p>
              </div>
              <Gift className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-white/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold text-green-600">
                  Rs {products.reduce((sum, p) => sum + (p.price * p.stock), 0).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">Inventory value</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-white/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Low Stock</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {products.filter(p => p.stock < 10).length}
                </p>
                <p className="text-xs text-muted-foreground">Products &lt; 10 units</p>
              </div>
              <Package className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-white/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Categories</p>
                <p className="text-2xl font-bold text-primary">
                  {new Set(products.map(p => p.category)).size}
                </p>
                <p className="text-xs text-muted-foreground">Unique categories</p>
              </div>
              <Tag className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Product Management */}
      <Card className="glass border-white/20">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <div>
              <CardTitle>Products</CardTitle>
              <CardDescription>Manage product inventory and details</CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredProducts.length > 0 ? (
            <div className="space-y-4">
              {filteredProducts.map((product) => (
                <div key={product._id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                      {product.images && product.images.length > 0 ? (
                        <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <Gift className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="font-medium">{product.title}</p>
                        <Badge variant="outline">{product.category}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center">
                          <DollarSign className="w-3 h-3 mr-1" />
                          Rs {product.price?.toLocaleString()}
                        </span>
                        <span className="flex items-center">
                          <Package className="w-3 h-3 mr-1" />
                          {product.stock} in stock
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={() => openEditDialog(product)}
                      variant="outline"
                      size="sm"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      onClick={() => handleDeleteProduct(product._id)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Gift className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ? "No products match your search" : "No products found"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Product Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Edit Product" : "Create New Product"}
            </DialogTitle>
            <DialogDescription>
              {editingProduct ? "Update product information" : "Add a new product to the inventory"}
            </DialogDescription>
          </DialogHeader>
          <ProductForm
            product={editingProduct}
            onSubmit={editingProduct ? handleUpdateProduct : handleCreateProduct}
            onCancel={() => {
              setIsDialogOpen(false)
              setEditingProduct(null)
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Product Form Component
function ProductForm({ product, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: product?.title || "",
    description: product?.description || "",
    price: product?.price || "",
    stock: product?.stock || "",
    category: product?.category || "",
    image: product?.images && product.images.length > 0 ? product.images[0] : "",
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    const submitData = {
      name: formData.name, // This will be mapped to 'title' in the API
      description: formData.description,
      price: parseFloat(formData.price),
      stock: parseInt(formData.stock),
      category: formData.category,
      image: formData.image,
    }
    
    if (product) {
      onSubmit(product._id, submitData)
    } else {
      onSubmit(submitData)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Product Name</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter product name"
            required
          />
        </div>
        <div>
          <Label htmlFor="category">Category</Label>
          <Input
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            placeholder="e.g., Skincare, Makeup"
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Enter product description"
          rows={3}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
                          <Label htmlFor="price">Price (Rs)</Label>
          <Input
            id="price"
            name="price"
            type="number"
            step="0.01"
            min="0"
            value={formData.price}
            onChange={handleChange}
            placeholder="0.00"
            required
          />
        </div>
        <div>
          <Label htmlFor="stock">Stock Quantity</Label>
          <Input
            id="stock"
            name="stock"
            type="number"
            min="0"
            value={formData.stock}
            onChange={handleChange}
            placeholder="0"
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="image">Image URL</Label>
        <Input
          id="image"
          name="image"
          value={formData.image}
          onChange={handleChange}
          placeholder="https://example.com/image.jpg"
          type="url"
        />
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="gradient-brand text-white">
          {product ? "Update Product" : "Create Product"}
        </Button>
      </div>
    </form>
  )
}