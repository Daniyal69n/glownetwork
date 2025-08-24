"use client"
import { useAuth } from "../lib/auth-context.js"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Sparkles, User } from "lucide-react"
import Link from "next/link"

export function SiteHeader() {
  const { user, isAuthenticated, logout } = useAuth() as any

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/20 bg-white/80 backdrop-blur-md">
      <div className="container mx-auto px-4 py-3">
        <nav className="flex items-center justify-between">
          {/* Logo - Centered */}
          <div className="flex-1"></div>
          <Link href={isAuthenticated ? (user?.role === "admin" ? "/admin" : "/dashboard") : "/"} className="flex items-center space-x-2">
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
        </nav>
      </div>
    </header>
  )
}
