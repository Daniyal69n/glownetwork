import { NextResponse } from "next/server"
import connectDB from "../../../../lib/mongodb.js"
import Product from "../../../../models/Product.js"
import { verifyToken, getTokenFromRequest } from "../../../../lib/auth.js"

export async function GET(request) {
  try {
    await connectDB()

    // Get and verify admin token
    const token = getTokenFromRequest(request)
    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page")) || 1
    const limit = Number.parseInt(searchParams.get("limit")) || 20

    // Get total count
    const total = await Product.countDocuments()

    // Get products with pagination
    const products = await Product.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Get admin products error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    await connectDB()

    // Get and verify admin token
    const token = getTokenFromRequest(request)
    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { name, price, stock, description, category, image } = await request.json()

    const allowedCategories = ["skincare", "makeup", "fragrance", "haircare", "bodycare"]
    const safeCategory = allowedCategories.includes((category || "").toLowerCase())
      ? (category || "").toLowerCase()
      : "skincare"

    // Validate required fields
    if (!name || price === undefined || stock === undefined) {
      return NextResponse.json({ error: "Name, price, and stock are required" }, { status: 400 })
    }

    // Create product
    const product = await Product.create({
      title: name.trim(),
      sku: `SKU-${Date.now()}`, // Generate unique SKU
      price: Number(price),
      stock: Number(stock),
      description: description?.trim() || "",
      category: safeCategory,
      images: image ? [image] : [],
      isActive: true,
    })

    return NextResponse.json({
      message: "Product created successfully",
      product,
    })
  } catch (error) {
    console.error("Create product error:", error)
    // Handle validation error clearly for the client
    if (error?.name === "ValidationError") {
      return NextResponse.json({ error: "Invalid product data. Ensure category is one of skincare/makeup/fragrance/haircare/bodycare." }, { status: 400 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    await connectDB()

    // Get and verify admin token
    const token = getTokenFromRequest(request)
    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get("id")
    
    if (!productId) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 })
    }

    const { name, price, stock, description, category, image } = await request.json()

    const allowedCategories = ["skincare", "makeup", "fragrance", "haircare", "bodycare"]
    const safeCategory = allowedCategories.includes((category || "").toLowerCase())
      ? (category || "").toLowerCase()
      : "skincare"

    // Validate required fields
    if (!name || price === undefined || stock === undefined) {
      return NextResponse.json({ error: "Name, price, and stock are required" }, { status: 400 })
    }

    // Update product
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      {
        title: name.trim(),
        price: Number(price),
        stock: Number(stock),
        description: description?.trim() || "",
        category: safeCategory,
        images: image ? [image] : [],
      },
      { new: true, runValidators: true }
    )

    if (!updatedProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    return NextResponse.json({
      message: "Product updated successfully",
      product: updatedProduct,
    })
  } catch (error) {
    console.error("Update product error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    await connectDB()

    // Get and verify admin token
    const token = getTokenFromRequest(request)
    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get("id")
    
    if (!productId) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 })
    }

    // Delete product
    const deletedProduct = await Product.findByIdAndDelete(productId)

    if (!deletedProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    return NextResponse.json({
      message: "Product deleted successfully",
    })
  } catch (error) {
    console.error("Delete product error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
