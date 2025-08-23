import { NextResponse } from "next/server"
import connectDB from "../../../../../lib/mongodb.js"
import Product from "../../../../../models/Product.js"
import { verifyToken, getTokenFromRequest } from "../../../../../lib/auth.js"

export async function PUT(request, { params }) {
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

    const { id } = params
    
    if (!id) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 })
    }

    const { name, price, stock, description, category, image } = await request.json()

    // Validate required fields
    if (!name || price === undefined || stock === undefined) {
      return NextResponse.json({ error: "Name, price, and stock are required" }, { status: 400 })
    }

    // Update product
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      {
        title: name.trim(),
        price: Number(price),
        stock: Number(stock),
        description: description?.trim() || "",
        category: category || "skincare",
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

export async function DELETE(request, { params }) {
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

    const { id } = params
    
    if (!id) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 })
    }

    // Delete product
    const deletedProduct = await Product.findByIdAndDelete(id)

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
