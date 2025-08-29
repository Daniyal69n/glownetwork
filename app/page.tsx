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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-primary/5">
        <div className="animate-pulse-glow rounded-full h-12 w-12 border-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-primary/5 particles">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 md:py-20 text-center">
        <div className="max-w-4xl mx-auto animate-fade-in-scale">
          <div className="animate-float mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-primary/20 to-primary/10 mb-6 glow-primary">
              <Sparkles className="w-10 h-10 text-primary animate-bounce-subtle" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Transform Your Beauty
            <span className="block gradient-text-rainbow">
              Business Dreams
            </span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-slide-in-up">
            Join thousands of entrepreneurs building successful beauty businesses with premium cosmetics and our proven
            network marketing system.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-in-up">
            <Link href="/signup">
              <Button size="lg" className="gradient-brand-rainbow text-white px-8 w-full sm:w-auto interactive-button glow-primary-hover">
                Start Your Journey
                <ArrowRight className="ml-2 h-5 w-5 animate-bounce-subtle" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent glass-card interactive-button">
                Member Login
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-12 md:py-20">
        <div className="text-center mb-12 md:mb-16 animate-slide-in-up">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 gradient-text">Why Choose GLOW NETWORK?</h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need to build and grow your beauty business
          </p>
        </div>

        <div className="grid gap-6 md:gap-8 md:grid-cols-2 lg:grid-cols-3">
          <Card className="glass-enhanced interactive-card animate-fade-in-scale">
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-primary/20 to-primary/10 flex items-center justify-center mb-4 glow-primary animate-pulse-glow">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="gradient-text">Premium Products</CardTitle>
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

          <Card className="glass-enhanced interactive-card animate-fade-in-scale" style={{ animationDelay: '0.1s' }}>
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-primary/20 to-primary/10 flex items-center justify-center mb-4 glow-primary animate-pulse-glow">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="gradient-text">Proven System</CardTitle>
              <CardDescription>Structured packages and rank advancement for sustainable growth</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• 7-tier rank system</li>
                <li>• Passive income streams</li>
                <li>• Direct & indirect bonuses</li>
                <li>• Performance incentives</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="glass-enhanced interactive-card animate-fade-in-scale" style={{ animationDelay: '0.2s' }}>
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-primary/20 to-primary/10 flex items-center justify-center mb-4 glow-primary animate-pulse-glow">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="gradient-text">Community Support</CardTitle>
              <CardDescription>Join a thriving community of beauty entrepreneurs</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Training & mentorship</li>
                <li>• Marketing materials</li>
                <li>• Team collaboration</li>
                <li>• Success stories</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="glass-enhanced interactive-card animate-fade-in-scale" style={{ animationDelay: '0.3s' }}>
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-primary/20 to-primary/10 flex items-center justify-center mb-4 glow-primary animate-pulse-glow">
                <Gift className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="gradient-text">Rewards & Incentives</CardTitle>
              <CardDescription>Earn while you build your business</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Commission structure</li>
                <li>• Performance bonuses</li>
                <li>• Travel incentives</li>
                <li>• Recognition programs</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="glass-enhanced interactive-card animate-fade-in-scale" style={{ animationDelay: '0.4s' }}>
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-primary/20 to-primary/10 flex items-center justify-center mb-4 glow-primary animate-pulse-glow">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="gradient-text">Digital Platform</CardTitle>
              <CardDescription>Modern tools to manage your business</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Online dashboard</li>
                <li>• Order management</li>
                <li>• Analytics & reports</li>
                <li>• Mobile-friendly</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="glass-enhanced interactive-card animate-fade-in-scale" style={{ animationDelay: '0.5s' }}>
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-primary/20 to-primary/10 flex items-center justify-center mb-4 glow-primary animate-pulse-glow">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="gradient-text">Growth Potential</CardTitle>
              <CardDescription>Unlimited earning potential</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Scalable business</li>
                <li>• Global reach</li>
                <li>• Residual income</li>
                <li>• Financial freedom</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-12 md:py-20">
        <div className="text-center">
          <Card className="glass-enhanced max-w-2xl mx-auto animate-fade-in-scale">
            <CardContent className="p-8 md:p-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-4 gradient-text-rainbow">
                Ready to Start Your Journey?
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                Join GLOW NETWORK today and start building your beauty business with our premium products and proven
                system.
              </p>
              <Link href="/signup">
                <Button size="lg" className="gradient-brand-rainbow text-white px-8 interactive-button glow-primary-hover">
                  Get Started Now
                  <ArrowRight className="ml-2 h-5 w-5 animate-bounce-subtle" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-primary/5 to-primary/10 border-t border-primary/10 py-8">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; 2024 GLOW NETWORK. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
