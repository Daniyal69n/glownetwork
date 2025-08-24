"use client"
import { useState, useEffect } from "react"
import { useAuth } from "../../lib/auth-context"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import { Alert, AlertDescription } from "../../components/ui/alert"
import { CheckCircle, Star, Package, TrendingUp, Users, Gift } from "lucide-react"

export default function PackagesPage() {
  const [packages, setPackages] = useState([])
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState(null)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const { user, token } = useAuth()

  useEffect(() => {
    fetchPackages()
  }, [])

  const fetchPackages = async () => {
    try {
      const response = await fetch("/api/packages")
      const data = await response.json()

      if (response.ok) {
        setPackages(data.packages)
      } else {
        setError(data.error)
      }
    } catch (error) {
      setError("Failed to load packages")
    } finally {
      setLoading(false)
    }
  }

  const handlePurchase = async (packageAmount) => {
    if (!token) {
      setError("Please login to purchase a package")
      return
    }

    setPurchasing(packageAmount)
    setError("")
    setMessage("")

    try {
      const response = await fetch("/api/packages/purchase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ packageAmount }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(data.message)
      } else {
        setError(data.error)
      }
    } catch (error) {
      setError("Network error. Please try again.")
    } finally {
      setPurchasing(null)
    }
  }

  const getRankPercentage = (amount) => {
    if (!user) return "30%"
    switch (user.rank) {
      case "assistant":
        return "30%"
      case "manager":
        return "35%"
      default:
        return "40%"
    }
  }

  const calculateDirectPayout = (amount) => {
    if (!user) return amount * 0.3
    switch (user.rank) {
      case "assistant":
        return amount * 0.3
      case "manager":
        return amount * 0.35
      default:
        return amount * 0.4
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-primary/5">
      <div className="container mx-auto px-4 py-6 md:py-8">
        {/* Header */}
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Choose Your Package</h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Select the perfect package to start or grow your beauty business. All packages include premium products and
            earning opportunities.
          </p>
          {user && (
            <div className="mt-4 p-4 bg-primary/10 rounded-lg inline-block">
              <p className="text-sm text-muted-foreground">
                Your current rank: <Badge variant="secondary">{user.rank.replace("_", " ").toUpperCase()}</Badge>
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Direct payout rate: <span className="font-semibold text-primary">{getRankPercentage()}</span>
              </p>
            </div>
          )}
        </div>

        {/* Messages */}
        {message && (
          <Alert className="mb-6 border-green-200 bg-green-50 text-green-800">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Packages Grid */}
        <div className="grid gap-6 md:gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
          {packages.map((pkg) => (
            <Card
              key={pkg.id}
              className={`glass border-white/20 shadow-xl relative ${
                pkg.popular ? "ring-2 ring-primary/50 md:scale-105" : ""
              }`}
            >
              {pkg.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="gradient-brand text-white px-4 py-1">
                    <Star className="w-3 h-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Package className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-xl md:text-2xl">{pkg.name}</CardTitle>
                <CardDescription className="text-sm">{pkg.description}</CardDescription>
                <div className="mt-4">
                                  <div className="text-2xl md:text-3xl font-bold text-primary">Rs {pkg.amount.toLocaleString()}</div>
                {user && (
                  <div className="text-sm text-muted-foreground mt-1">
                    Direct payout: Rs {calculateDirectPayout(pkg.amount).toLocaleString()}
                  </div>
                )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {pkg.features.map((feature, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handlePurchase(pkg.amount)}
                  disabled={purchasing === pkg.amount || !user}
                  className={`w-full h-12 ${pkg.popular ? "gradient-brand text-white" : ""} font-semibold`}
                  variant={pkg.popular ? "default" : "outline"}
                >
                  {purchasing === pkg.amount ? "Processing..." : !user ? "Login to Purchase" : `Purchase ${pkg.name}`}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Benefits Section */}
        <div className="mt-12 md:mt-16 grid gap-6 md:gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto">
          <Card className="glass border-white/20 text-center">
            <CardContent className="p-6">
              <TrendingUp className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Immediate Returns</h3>
              <p className="text-sm text-muted-foreground">
                Earn direct payouts immediately upon package approval based on your current rank
              </p>
            </CardContent>
          </Card>

          <Card className="glass border-white/20 text-center">
            <CardContent className="p-6">
              <Users className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Passive Income</h3>
              <p className="text-sm text-muted-foreground">
                Earn 5% passive income from your downline's package purchases (Manager rank and above)
              </p>
            </CardContent>
          </Card>

          <Card className="glass border-white/20 text-center md:col-span-2 lg:col-span-1">
            <CardContent className="p-6">
              <Gift className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Premium Products</h3>
              <p className="text-sm text-muted-foreground">
                Access to high-quality beauty and cosmetics products worth your package amount
              </p>
            </CardContent>
          </Card>
        </div>

        {!user && (
          <div className="mt-12 text-center">
            <Card className="glass border-white/20 max-w-md mx-auto">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-2">Ready to Get Started?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create your account to purchase packages and start earning
                </p>
                <Button className="gradient-brand text-white w-full h-12">Create Account</Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
