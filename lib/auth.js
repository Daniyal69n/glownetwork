import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" })
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    return null
  }
}

export async function hashPassword(password) {
  return await bcrypt.hash(password, 12)
}

export async function comparePassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword)
}

export function getTokenFromRequest(req) {
  try {
    // Support Next.js Request (headers.get) and Node/Express req (headers.authorization)
    let authHeader = null
    if (req?.headers) {
      if (typeof req.headers.get === "function") {
        authHeader = req.headers.get("authorization")
      } else if (typeof req.headers === "object") {
        authHeader = req.headers.authorization || req.headers.Authorization
      }
    }

    if (authHeader && typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
      return authHeader.substring(7)
    }

    // Fallback: read token from cookies
    if (req?.cookies) {
      if (typeof req.cookies.get === "function") {
        // Next.js Request cookies API
        const cookie = req.cookies.get("token")
        return cookie?.value || null
      }
      if (typeof req.cookies === "object") {
        // Node/Express-like cookies object
        return req.cookies.token || null
      }
    }

    return null
  } catch {
    return null
  }
}
