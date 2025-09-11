'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { 
  Users, 
  TrendingUp, 
  Award,
  Target,
  Eye,
  Download,
  RefreshCw,
  Search,
  Filter,
  PieChart,
  BarChart3,
  UserPlus,
  Calendar,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  Crown,
  ArrowRight,
  User
} from 'lucide-react'

export default function TeamManagementDashboard() {
  const { data: session, status } = useSession()
  const [teamStats, setTeamStats] = useState(null)
  const [levelDistribution, setLevelDistribution] = useState(null)
  const [teamDetails, setTeamDetails] = useState(null)
  const [recentFormations, setRecentFormations] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedLevel, setSelectedLevel] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedTeams, setExpandedTeams] = useState(new Set())

  const fetchTeamData = async () => {
    try {
      setRefreshing(true)

      // Fetch comprehensive team management data
      const [statsRes, distributionRes, detailsRes, formationsRes] = await Promise.all([
        fetch('/api/admin/team-overview-stats'),
        fetch('/api/admin/team-level-distribution'), 
        fetch(`/api/admin/team-details?level=${selectedLevel}&search=${searchTerm}`),
        fetch('/api/admin/team-recent-formations')
      ])

      if (statsRes.ok) {
        const data = await statsRes.json()
        setTeamStats(data.data)
      }

      if (distributionRes.ok) {
        const data = await distributionRes.json()
        setLevelDistribution(data.data)
      }

      if (detailsRes.ok) {
        const data = await detailsRes.json()
        setTeamDetails(data.data)
      }

      if (formationsRes.ok) {
        const data = await formationsRes.json()
        setRecentFormations(data.data || [])
      }

    } catch (error) {
      console.error('Error fetching team data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchTeamData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLevel, searchTerm])

  const handleRefresh = () => {
    fetchTeamData()
  }

  // Check admin access
  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!session?.user?.role || session.user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Access Denied</h1>
          <p className="text-gray-600 dark:text-gray-300">You need admin privileges to access this page.</p>
        </div>
      </div>
    )
  }

  const handleExport = async (type) => {
    try {
      const response = await fetch(`/api/admin/team-export?type=${type}&level=${selectedLevel}`, {
        method: 'GET',
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `team-${type}-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Export error:', error)
    }
  }

  const toggleTeamExpansion = (teamId) => {
    const newExpanded = new Set(expandedTeams)
    if (newExpanded.has(teamId)) {
      newExpanded.delete(teamId)
    } else {
      newExpanded.add(teamId)
    }
    setExpandedTeams(newExpanded)
  }

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-IN').format(num || 0)
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const calculateMemberCount = (team) => {
    // Calculate members based on actual Team schema relationships
    let count = 0
    if (team.member1Id) count++
    if (team.member2Id) count++
    if (team.member3Id) count++
    return count
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading team management dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Team Management Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Comprehensive team analytics and management tools
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-3">
              <div className="flex gap-2">
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-md text-sm font-medium transition-colors"
                >
                  <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
                <button
                  onClick={() => handleExport('overview')}
                  className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium transition-colors"
                >
                  <Download className="h-4 w-4" />
                  Export
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', name: 'Team Overview', icon: Users },
                { id: 'distribution', name: 'Level Distribution', icon: PieChart },
                { id: 'details', name: 'Team Details', icon: Eye },
                { id: 'formations', name: 'Recent Formations', icon: UserPlus }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Team Overview Stats */}
        {teamStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Target className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Total Teams</h3>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatNumber(teamStats.totalTeams)}
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    +{teamStats.newTeamsThisMonth} this month
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Active Builders</h3>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatNumber(teamStats.activeBuilders)}
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    {((teamStats.activeBuilders / teamStats.totalUsers) * 100).toFixed(1)}% of users
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Growth Rate</h3>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {teamStats.growthRate}%
                  </p>
                  <p className="text-sm text-purple-600 dark:text-purple-400">
                    Monthly team formation rate
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Award className="h-8 w-8 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Avg Team Size</h3>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {teamStats.avgTeamSize}
                  </p>
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">
                    Members per team
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'overview' && teamStats && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Team Formation Trends */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Team Formation Trends</h3>
                  <BarChart3 className="h-5 w-5 text-gray-400" />
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-300">This Week</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {teamStats.teamsThisWeek} teams
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-300">This Month</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {teamStats.teamsThisMonth} teams
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-300">Average per Week</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {teamStats.avgTeamsPerWeek} teams
                    </span>
                  </div>
                </div>
              </div>

              {/* Level Progression Summary */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Level Progression</h3>
                  <TrendingUp className="h-5 w-5 text-gray-400" />
                </div>
                <div className="space-y-3">
                  {['L1', 'L2', 'L3', 'L4', 'L5'].map((level, index) => (
                    <div key={level} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-3 bg-${['blue', 'green', 'yellow', 'purple', 'red'][index]}-500`}></div>
                        <span className="text-gray-600 dark:text-gray-300">{level}</span>
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatNumber(teamStats.levelCounts?.[level] || 0)} users
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'distribution' && levelDistribution && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Level Distribution Chart */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Users per Level</h3>
                  <PieChart className="h-5 w-5 text-gray-400" />
                </div>
                <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                  <p className="text-gray-500 dark:text-gray-400">Level distribution chart will be displayed here</p>
                </div>
              </div>

              {/* Level Statistics */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Level Statistics</h3>
                  <BarChart3 className="h-5 w-5 text-gray-400" />
                </div>
                <div className="space-y-4">
                  {levelDistribution.levels?.map((level) => (
                    <div key={level.level} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-gray-900 dark:text-white">Level {level.level}</span>
                        <span className="text-sm text-gray-500">{level.userCount} users</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600 dark:text-gray-300">Avg Teams:</span>
                          <span className="ml-2 font-medium text-gray-900 dark:text-white">{level.avgTeams}</span>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-300">Growth:</span>
                          <span className="ml-2 font-medium text-green-600">+{level.monthlyGrowth}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'details' && (
          <div className="space-y-6">
            {/* Search and Filter */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="h-5 w-5 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="Search teams or members..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="all">All Levels</option>
                  <option value="L1">Level 1</option>
                  <option value="L2">Level 2</option>
                  <option value="L3">Level 3</option>
                  <option value="L4">Level 4</option>
                  <option value="L5">Level 5</option>
                </select>
              </div>
            </div>

            {/* Team Details List */}
            {teamDetails?.teams && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Team Details</h3>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {teamDetails.teams.map((team) => (
                    <div key={team.id} className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                              <Crown className="h-5 w-5 text-white" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                              {team.leaderName}
                            </h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Team Leader • Level {team.level} • {calculateMemberCount(team)} members
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              Formed: {formatDate(team.formedAt)}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {team.daysActive} days active
                            </p>
                          </div>
                          <button
                            onClick={() => toggleTeamExpansion(team.id)}
                            className="flex items-center gap-2 px-3 py-1 text-blue-600 hover:text-blue-700 transition-colors"
                          >
                            {expandedTeams.has(team.id) ? (
                              <>
                                <ChevronUp className="h-4 w-4" />
                                Hide
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-4 w-4" />
                                View
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Expanded Team Members */}
                      {expandedTeams.has(team.id) && (
                        <div className="mt-4 pl-14">
                          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                            <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Team Members</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {team.members?.map((member) => (
                                <div key={member.id} className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                                    member.isActive ? 'bg-green-500 text-white' : 'bg-gray-400 text-white'
                                  }`}>
                                    <User className="w-4 h-4" />
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                      {member.name}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      Joined: {formatDate(member.joinedAt)}
                                    </p>
                                  </div>
                                  {member.isActive ? (
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                  ) : (
                                    <XCircle className="w-4 h-4 text-gray-400" />
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'formations' && (
          <div className="space-y-6">
            {/* Recent Team Formations */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Team Formations</h3>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {recentFormations.map((formation) => (
                  <div key={formation.id} className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                            <UserPlus className="h-5 w-5 text-white" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                            New Team Formed
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Leader: {formation.leaderName} • Level {formation.level}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatDate(formation.formedAt)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formation.membersCount} initial members
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
