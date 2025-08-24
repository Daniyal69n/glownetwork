"use client"
import { useAuth } from "../lib/auth-context"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { MobileNav } from "./mobile-nav"
import { Sparkles, User } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export function SiteHeader() {
  const { user, isAuthenticated, logout } = useAuth() as any
  const pathname = usePathname()
  
  // Check if we're on an admin page
  const isAdminPage = pathname?.startsWith('/admin')

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/20 bg-white/80 backdrop-blur-md">
      <div className="container mx-auto px-4 py-3">
        <nav className="flex items-center justify-between">
          {/* Logo - Centered for admin pages, left-aligned for user pages */}
          {isAdminPage ? (
            <>
              <div className="flex-1"></div>
              <Link href="/admin" className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  GLOW NETWORK
                </span>
              </Link>
              <div className="flex-1 flex justify-end">
                {/* User Info - Only show if authenticated */}
                {isAuthenticated && (
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                      <div className="text-sm">
                        <p className="font-medium">{user?.name}</p>
                        <Badge variant="secondary" className="text-xs">
                          {user?.rank?.replace("_", " ").toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={logout}>
                      Logout
                    </Button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Logo */}
              <Link href={isAuthenticated ? (user?.role === "admin" ? "/admin" : "/dashboard") : "/"} className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  GLOW NETWORK
                </span>
              </Link>

              {/* Desktop Navigation - Only for user pages */}
              {isAuthenticated ? (
                <div className="hidden md:flex items-center space-x-6">
                  {user?.role === "admin" ? (
                    // Admin Navigation
                    <>
                      <Link href="/admin">
                        <Button variant="ghost" size="sm">
                          Admin Dashboard
                        </Button>
                      </Link>
                      <Link href="/admin/packages">
                        <Button variant="ghost" size="sm">
                          Package Approvals
                        </Button>
                      </Link>
                      <Link href="/admin/orders">
                        <Button variant="ghost" size="sm">
                          Order Management
                        </Button>
                      </Link>
                      <Link href="/admin/payouts">
                        <Button variant="ghost" size="sm">
                          Payout Management
                        </Button>
                      </Link>
                      <Link href="/admin/users">
                        <Button variant="ghost" size="sm">
                          User Management
                        </Button>
                      </Link>
                    </>
                  ) : (
                    // User Navigation
                    <>
                      <Link href="/dashboard">
                        <Button variant="ghost" size="sm">
                          Dashboard
                        </Button>
                      </Link>
                      <Link href="/packages">
                        <Button variant="ghost" size="sm">
                          Packages
                        </Button>
                      </Link>
                      <Link href="/shop">
                        <Button variant="ghost" size="sm">
                          Shop
                        </Button>
                      </Link>
                      <Link href="/payouts">
                        <Button variant="ghost" size="sm">
                          Payouts
                        </Button>
                      </Link>
                      <Link href="/order-history">
                        <Button variant="ghost" size="sm">
                          Order History
                        </Button>
                      </Link>
                    </>
                  )}

                  {/* User Info */}
                  <div className="flex items-center space-x-3 pl-4 border-l border-white/20">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                      <div className="text-sm">
                        <p className="font-medium">{user?.name}</p>
                        <Badge variant="secondary" className="text-xs">
                          {user?.rank?.replace("_", " ").toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={logout} className="ml-4">
                      Logout
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="hidden md:flex items-center space-x-4">
                  <Link href="/login">
                    <Button variant="ghost">Sign In</Button>
                  </Link>
                  <Link href="/signup">
                    <Button className="gradient-brand text-white">Get Started</Button>
                  </Link>
                </div>
              )}

              {/* Mobile Navigation - Only for user pages */}
              {isAuthenticated ? (
                <MobileNav />
              ) : (
                <div className="flex md:hidden items-center space-x-2">
                  <Link href="/login">
                    <Button variant="ghost" size="sm">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/signup">
                    <Button size="sm" className="gradient-brand text-white">
                      Join
                    </Button>
                  </Link>
                </div>
              )}
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
