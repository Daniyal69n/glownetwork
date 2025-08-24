"use client"
import { useState } from "react"
import { useAuth } from "../lib/auth-context"
import { Button } from "./ui/button"
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet"
import { Badge } from "./ui/badge"
import { 
  Menu, 
  X, 
  Home, 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  User, 
  LogOut, 
  Sparkles, 
  Gift,
  LayoutDashboard,
  Users,
  BarChart3
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

const userNavItems = [
  { href: "/dashboard", icon: Home, label: "Dashboard" },
  { href: "/packages", icon: Package, label: "Packages" },
  { href: "/shop", icon: ShoppingCart, label: "Shop" },
  { href: "/orders", icon: Gift, label: "My Orders" },
  { href: "/payouts", icon: TrendingUp, label: "Payouts" },
]

const adminNavItems = [
  { href: "/admin", icon: LayoutDashboard, label: "Admin Dashboard" },
  { href: "/admin/packages", icon: Package, label: "Package Approvals" },
  { href: "/admin/orders", icon: ShoppingCart, label: "Order Management" },
  { href: "/admin/payouts", icon: TrendingUp, label: "Payout Management" },
  { href: "/admin/users", icon: Users, label: "User Management" },
  { href: "/admin/reports", icon: BarChart3, label: "Reports & Analytics" },
]

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const { user, logout } = useAuth() as any
  const pathname = usePathname()

  if (!user) return null

  // Choose navigation items based on user role
  const navItems = user.role === "admin" ? adminNavItems : userNavItems

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="md:hidden">
          <Menu className="w-5 h-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 glass border-white/20">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between pb-6 border-b border-white/20">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <span className="text-lg font-bold text-primary">GLOW NETWORK</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* User Info */}
          <div className="py-6 border-b border-white/20">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">{user.name}</p>
                <Badge className="text-xs" variant="secondary">
                  {user.rank.replace("_", " ").toUpperCase()}
                </Badge>
              </div>
            </div>
            <div className="mt-3 text-sm text-muted-foreground">
              <p>Credit: Rs {user.packageCredit?.toLocaleString() || 0}</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-6 space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className={`w-full justify-start ${
                      isActive ? "gradient-brand text-white" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <item.icon className="w-4 h-4 mr-3" />
                    {item.label}
                  </Button>
                </Link>
              )
            })}
          </nav>

          {/* Logout */}
          <div className="pt-6 border-t border-white/20">
            <Button onClick={logout} variant="outline" size="sm" className="w-full bg-transparent">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
