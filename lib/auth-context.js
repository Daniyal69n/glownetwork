"use client"
import { createContext, useContext, useEffect, useState } from "react"

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(null)

  // Initialize auth state from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem("token")
    const storedUser = localStorage.getItem("user")

    if (storedToken && storedUser) {
      setToken(storedToken)
      setUser(JSON.parse(storedUser))
      // Verify token is still valid
      verifyCurrentUser(storedToken)
    } else {
      setLoading(false)
    }
  }, [])

  const verifyCurrentUser = async (authToken) => {
    try {
      const response = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        localStorage.setItem("user", JSON.stringify(data.user))
      } else {
        // Token is invalid, clear auth state
        logout()
      }
    } catch (error) {
      console.error("Auth verification failed:", error)
      logout()
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        setUser(data.user)
        setToken(data.token)
        localStorage.setItem("token", data.token)
        localStorage.setItem("user", JSON.stringify(data.user))
        // Ensure middleware can read token by also setting a cookie on the client
        document.cookie = `token=${data.token}; Path=/; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}`
        return { success: true, user: data.user }
      } else {
        return { success: false, error: data.error }
      }
    } catch (error) {
      console.error("Login error:", error)
      return { success: false, error: "Network error. Please try again." }
    }
  }

  const signup = async (name, email, password, referralCode) => {
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password, referralCode }),
      })

      const data = await response.json()

      if (response.ok) {
        setUser(data.user)
        setToken(data.token)
        localStorage.setItem("token", data.token)
        localStorage.setItem("user", JSON.stringify(data.user))
        // Ensure middleware can read token by also setting a cookie on the client
        document.cookie = `token=${data.token}; Path=/; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}`
        return {
          success: true,
          user: data.user,
          referredBy: data.referredBy,
        }
      } else {
        return { success: false, error: data.error }
      }
    } catch (error) {
      console.error("Signup error:", error)
      return { success: false, error: "Network error. Please try again." }
    }
  }

  const logout = () => {
    // Call API to clear httpOnly cookie, then clear client state
    ;(async () => {
      try {
        await fetch("/api/auth/logout", { method: "POST" })
      } catch (e) {
        // ignore network errors, proceed to clear client state
      } finally {
        setUser(null)
        setToken(null)
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        // Clear auth cookie (non-httpOnly copy)
        document.cookie = "token=; Path=/; Max-Age=0"
        // Redirect to login
        if (typeof window !== "undefined") {
          window.location.href = "/login"
        }
      }
    })()
  }

  const updateUser = (updatedUser) => {
    setUser(updatedUser)
    localStorage.setItem("user", JSON.stringify(updatedUser))
  }

  const value = {
    user,
    token,
    loading,
    login,
    signup,
    logout,
    updateUser,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
