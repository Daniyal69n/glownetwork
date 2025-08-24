"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "../lib/auth-context"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Sparkles, Users, TrendingUp, Gift, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  const { isAuthenticated, user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && isAuthenticated) {
      if (user?.role === "admin") {
        router.push("/admin")
      } else {
        router.push("/dashboard")
      }
    }
  }, [isAuthenticated, user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-primary/5">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 md:py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Transform Your Beauty
            <span className="block bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Business Dreams
            </span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of entrepreneurs building successful beauty businesses with premium cosmetics and our proven
            network marketing system.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="gradient-brand text-white px-8 w-full sm:w-auto">
                Start Your Journey
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent">
                Member Login
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-12 md:py-20">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4">Why Choose GLOW NETWORK?</h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need to build and grow your beauty business
          </p>
        </div>

        <div className="grid gap-6 md:gap-8 md:grid-cols-2 lg:grid-cols-3">
          <Card className="glass border-white/20 shadow-lg">
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Premium Products</CardTitle>
              <CardDescription>High-quality beauty and cosmetics products that customers love</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Skincare essentials</li>
                <li>• Professional makeup</li>
                <li>• Luxury fragrances</li>
                <li>• Hair & body care</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="glass border-white/20 shadow-lg">
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Proven System</CardTitle>
              <CardDescription>Structured packages and rank advancement for sustainable growth</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Multiple package options</li>
                <li>• Clear rank progression</li>
                <li>• Direct & passive income</li>
                <li>• Performance rewards</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="glass border-white/20 shadow-lg md:col-span-2 lg:col-span-1">
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Strong Community</CardTitle>
              <CardDescription>Join a supportive network of beauty entrepreneurs</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Referral system</li>
                <li>• Team building tools</li>
                <li>• Training & support</li>
                <li>• Success recognition</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-12 md:py-20">
        <Card className="glass border-white/20 shadow-xl max-w-4xl mx-auto">
          <CardContent className="p-8 md:p-12 text-center">
            <Gift className="w-12 h-12 md:w-16 md:h-16 text-primary mx-auto mb-6" />
            <h3 className="text-2xl md:text-3xl font-bold mb-4">Ready to Start Earning?</h3>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join GLOW NETWORK today and start building your beauty business with our premium products and proven
              marketing system.
            </p>
            <Link href="/signup">
              <Button size="lg" className="gradient-brand text-white px-8 w-full sm:w-auto">
                Create Your Account
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t border-border/50">
        <div className="text-center text-muted-foreground">
          <p>&copy; 2024 GLOW NETWORK. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
