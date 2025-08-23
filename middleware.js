import { NextResponse } from "next/server"
import { verifyToken } from "./lib/auth.js"

export function middleware(request) {
  const { pathname } = request.nextUrl

  // Public routes that don't require authentication
  const publicRoutes = [
    "/",
    "/login",
    "/signup",
    "/api/auth/login",
    "/api/auth/signup",
    "/api/auth/logout",
    "/api/auth/bootstrap-admin",
  ]

  // Admin routes that require admin role
  const adminRoutes = ["/admin", "/api/admin"]

  // Check if route is public
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Get token from request
  const token = request.headers.get("authorization")?.replace("Bearer ", "") || request.cookies.get("token")?.value

  if (!token) {
    // Redirect to login for protected routes
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Verify token
  const decoded = verifyToken(token)
  if (!decoded) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Check admin access
  if (adminRoutes.some((route) => pathname.startsWith(route))) {
    if (decoded.role !== "admin") {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Admin access required" }, { status: 403 })
      }
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
  }

  // Add user info to request headers for API routes
  const response = NextResponse.next()
  response.headers.set("x-user-id", decoded.userId)
  response.headers.set("x-user-role", decoded.role)
  response.headers.set("x-user-rank", decoded.rank)

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
}
