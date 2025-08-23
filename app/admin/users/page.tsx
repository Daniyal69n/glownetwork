"use client"
import { useState, useEffect } from "react"
import { useAuth } from "../../../lib/auth-context.js"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card"
import { Badge } from "../../../components/ui/badge"
import { Alert, AlertDescription } from "../../../components/ui/alert"
import { Input } from "../../../components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select"
import { Users, Search, Star, TrendingUp } from "lucide-react"

export default function AdminUsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [rankFilter, setRankFilter] = useState("all")
  const [stats, setStats] = useState({})

  const { user, token } = useAuth()

  useEffect(() => {
    if (user?.role === "admin" && token) {
      fetchUsers()
    }
  }, [user, token])

  const fetchUsers = async () => {
    try {
      // Fetch users and reports data
      const [usersRes, reportsRes] = await Promise.all([
        fetch("/api/admin/reports/earnings", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/admin/reports/earnings", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])

      const [usersData, reportsData] = await Promise.all([usersRes.json(), reportsRes.json()])

      if (usersRes.ok && reportsRes.ok) {
        setUsers(reportsData.topEarners || [])
        setStats({
          totalUsers: reportsData.overallStats?.totalUsers || 0,
          activeUsers: reportsData.overallStats?.activeUsers || 0,
          rankDistribution: reportsData.rankDistribution || [],
        })
      } else {
        setError("Failed to load user data")
      }
    } catch (error) {
      setError("Failed to load users")
    } finally {
      setLoading(false)
    }
  }

  const getRankBadgeColor = (rank) => {
    switch (rank) {
      case "assistant":
        return "bg-gray-100 text-gray-800"
      case "manager":
        return "bg-blue-100 text-blue-800"
      case "senior_manager":
        return "bg-purple-100 text-purple-800"
      case "diamond_manager":
        return "bg-pink-100 text-pink-800"
      case "global_manager":
        return "bg-yellow-100 text-yellow-800"
      case "director":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRank = rankFilter === "all" || user.rank === rankFilter
    return matchesSearch && matchesRank
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-md">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">User Management</h1>
        <p className="text-muted-foreground">View and manage GLOW NETWORK members</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass border-white/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{stats.totalUsers}</p>
              </div>
              <Users className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-white/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold text-green-600">{stats.activeUsers}</p>
                <p className="text-xs text-muted-foreground">
                  {stats.totalUsers > 0 ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0}% of total
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-white/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Top Earners</p>
                <p className="text-2xl font-bold text-primary">{users.length}</p>
                <p className="text-xs text-muted-foreground">Users with earnings</p>
              </div>
              <Star className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rank Distribution */}
      <Card className="glass border-white/20">
        <CardHeader>
          <CardTitle>Rank Distribution</CardTitle>
          <CardDescription>Member distribution across ranks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {stats.rankDistribution?.map((rank) => (
              <div key={rank._id} className="text-center p-4 border rounded-lg">
                <Badge className={getRankBadgeColor(rank._id)} variant="secondary">
                  {rank._id.replace("_", " ").toUpperCase()}
                </Badge>
                <p className="text-2xl font-bold mt-2">{rank.count}</p>
                <p className="text-xs text-muted-foreground">
                  Avg: ₹{Math.round(rank.avgIncome || 0).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* User List */}
      <Card className="glass border-white/20">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <div>
              <CardTitle>Top Earning Members</CardTitle>
              <CardDescription>Members ranked by total earnings</CardDescription>
            </div>
            <div className="flex space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Select value={rankFilter} onValueChange={setRankFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by rank" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ranks</SelectItem>
                  <SelectItem value="assistant">Assistant</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="senior_manager">Senior Manager</SelectItem>
                  <SelectItem value="diamond_manager">Diamond Manager</SelectItem>
                  <SelectItem value="global_manager">Global Manager</SelectItem>
                  <SelectItem value="director">Director</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredUsers.length > 0 ? (
            <div className="space-y-4">
              {filteredUsers.map((user, index) => (
                <div key={user._id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary">#{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <div className="flex items-center space-x-4 mt-1">
                        <Badge className={getRankBadgeColor(user.rank)} variant="secondary">
                          {user.rank.replace("_", " ").toUpperCase()}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Total: ₹{user.totalIncome?.toLocaleString() || 0}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Released: ₹{user.releasedIncome?.toLocaleString() || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary">₹{user.totalIncome?.toLocaleString() || 0}</p>
                    <p className="text-xs text-muted-foreground">Total Earnings</p>
                    {user.pendingIncome > 0 && (
                      <p className="text-xs text-yellow-600">₹{user.pendingIncome.toLocaleString()} pending</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm || rankFilter !== "all" ? "No users match your filters" : "No users found"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
