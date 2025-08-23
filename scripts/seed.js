import mongoose from "mongoose"
import bcrypt from "bcryptjs"
import dotenv from "dotenv"
import User from "../models/User.js"
import Product from "../models/Product.js"

// Load env from .env.local (fallback to default .env) so the seed uses the same DB as the app
dotenv.config({ path: ".env.local" })
dotenv.config()

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/glow-network"

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI)
    console.log("Connected to MongoDB")

    // Upsert Admin User only (no demo members)
    const adminEmail = process.env.ADMIN_EMAIL || "admin@glownetwork.com"
    const adminPasswordPlain = process.env.ADMIN_PASSWORD || "admin123"
    const existingAdmin = await User.findOne({ role: "admin" })
    if (!existingAdmin) {
      const adminPassword = await bcrypt.hash(adminPasswordPlain, 12)
      await User.create({
        name: "Admin User",
        email: adminEmail.toLowerCase(),
        passwordHash: adminPassword,
        role: "admin",
        rank: "director",
        referralCode: "ADMIN001",
      })
      console.log("Created admin user")
    } else {
      console.log("Admin already exists; skipping creation")
    }

    // Create sample products
    const products = [
      {
        title: "Glow Serum Premium",
        sku: "GLW-SER-001",
        price: 2500,
        stock: 100,
        description: "Premium anti-aging serum with vitamin C",
        category: "skincare",
        images: ["/premium-serum-bottle.png"],
      },
      {
        title: "Radiance Face Cream",
        sku: "GLW-CRM-002",
        price: 1800,
        stock: 150,
        description: "Moisturizing face cream for all skin types",
        category: "skincare",
        images: ["/face-cream-jar.png"],
      },
      {
        title: "Luxury Lipstick Set",
        sku: "GLW-LIP-003",
        price: 3200,
        stock: 80,
        description: "Set of 5 premium lipsticks in trending colors",
        category: "makeup",
        images: ["/lipstick-set.png"],
      },
      {
        title: "Eye Shadow Palette",
        sku: "GLW-EYE-004",
        price: 2800,
        stock: 120,
        description: "12-color professional eye shadow palette",
        category: "makeup",
        images: ["/eyeshadow-palette.png"],
      },
      {
        title: "Hair Growth Oil",
        sku: "GLW-HAIR-005",
        price: 1500,
        stock: 200,
        description: "Natural hair growth oil with essential oils",
        category: "haircare",
        images: ["/placeholder-fzqr1.png"],
      },
      {
        title: "Body Butter Luxury",
        sku: "GLW-BODY-006",
        price: 2200,
        stock: 90,
        description: "Rich body butter with shea and cocoa butter",
        category: "bodycare",
        images: ["/placeholder-xng6x.png"],
      },
      {
        title: "Perfume Essence",
        sku: "GLW-PERF-007",
        price: 4500,
        stock: 60,
        description: "Long-lasting floral fragrance",
        category: "fragrance",
        images: ["/elegant-perfume-bottle.png"],
      },
      {
        title: "Cleansing Foam",
        sku: "GLW-CLN-008",
        price: 1200,
        stock: 180,
        description: "Gentle foaming cleanser for daily use",
        category: "skincare",
        images: ["/cleansing-foam.png"],
      },
      {
        title: "Foundation Set",
        sku: "GLW-FND-009",
        price: 3800,
        stock: 70,
        description: "Full coverage foundation in 6 shades",
        category: "makeup",
        images: ["/placeholder-6u5o7.png"],
      },
      {
        title: "Hair Mask Treatment",
        sku: "GLW-MASK-010",
        price: 2000,
        stock: 110,
        description: "Deep conditioning hair mask",
        category: "haircare",
        images: ["/placeholder-nma96.png"],
      },
    ]

    // Upsert products (by SKU)
    for (const p of products) {
      await Product.findOneAndUpdate({ sku: p.sku }, p, { upsert: true })
    }
    console.log("Upserted sample products")

    console.log("✅ Seed completed: admin ensured and products upserted.")
  } catch (error) {
    console.error("❌ Seeding failed:", error)
  } finally {
    await mongoose.disconnect()
    console.log("Disconnected from MongoDB")
  }
}

seedDatabase()
