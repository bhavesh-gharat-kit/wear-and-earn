'use client'
import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { 
  Users, 
  Crown,
  Eye,
  Filter,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Calendar,
  Mail,
  UserCheck
} from 'lucide-react'

export default function TeamManagementPage() {
  const { data: session, status } = useSession()
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    level: 'all',
    status: 'all',
    page: 1,
    limit: 20
  })
  const [pagination, setPagination] = useState({})
  const [expandedTeams, setExpandedTeams] = useState(new Set())

  const fetchTeams = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/teams?level=${filters.level}&status=${filters.status}&page=${filters.page}&limit=${filters.limit}`)
      
      if (response.ok) {
        const data = await response.json()
        setTeams(data.teams || [])
        setPagination(data.pagination || {})
      }
    } catch (error) {
      console.error('Error fetching teams:', error)
    } finally {
      setLoading(false)
    }
  }, [filters.level, filters.status, filters.page, filters.limit])

  useEffect(() => {
    if (status !== 'loading' && session?.user?.role === 'admin') {
      fetchTeams()
    }
  }, [session, status, filters, fetchTeams])

  const toggleTeamExpansion = (teamId) => {
    const newExpanded = new Set(expandedTeams)
    if (newExpanded.has(teamId)) {
      newExpanded.delete(teamId)
    } else {
      newExpanded.add(teamId)
    }
    setExpandedTeams(newExpanded)
  }

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value,
      page: 1 // Reset to first page when filters change
    }))
  }

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }))
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session?.user?.role || session.user.role !== 'admin') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="text-gray-600">You don&apos;t have permission to access this page.</p>
        </div>
      </div>
    )
  }

  return (
  <div className="container mx-auto px-4 py-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Team Management</h1>
        <p className="text-gray-600 dark:text-gray-300">View and manage all teams in the pool MLM system</p>
      </div>

      {/* Filters and Controls */}
  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 mb-6">
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Level Filter</label>
            <select
              value={filters.level}
              onChange={(e) => handleFilterChange('level', e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="all">All Levels</option>
              <option value="1">Level 1</option>
              <option value="2">Level 2</option>
              <option value="3">Level 3</option>
              <option value="4">Level 4</option>
              <option value="5">Level 5</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Status Filter</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="all">All Teams</option>
              <option value="active">Complete Teams</option>
              <option value="inactive">Incomplete Teams</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Page Size</label>
            <select
              value={filters.limit}
              onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
              className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value={10}>10 per page</option>
              <option value={20}>20 per page</option>
              <option value={50}>50 per page</option>
            </select>
          </div>
          
          <button
            onClick={fetchTeams}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center mt-6"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>

        {/* Quick Stats */}
  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{pagination.total || 0}</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Total Teams</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {teams.filter(t => t.isComplete).length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Complete Teams</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {teams.filter(t => !t.isComplete).length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Incomplete Teams</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {teams.filter(t => t.level >= 3).length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">L3+ Teams</div>
          </div>
        </div>
      </div>

      {/* Teams List */}
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        {teams.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-300">
            <Users className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-500" />
            <h3 className="text-lg font-medium mb-2 dark:text-gray-100">No Teams Found</h3>
            <p>No teams match your current filters.</p>
          </div>
        ) : (
          <div className="overflow-hidden">
            {teams.map((team) => (
              <div key={team.id} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                {/* Team Header */}
                <div 
                  className="p-6 hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer"
                  onClick={() => toggleTeamExpansion(team.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-full ${team.isComplete ? 'bg-green-100' : 'bg-orange-100'}`}>
                        <Users className={`w-6 h-6 ${team.isComplete ? 'text-green-600' : 'text-orange-600'}`} />
                      </div>
                      
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{team.leaderName}</h3>
                          <div className="flex items-center space-x-1">
                            <Crown className={`w-4 h-4 ${team.level >= 4 ? 'text-yellow-500' : 'text-gray-400 dark:text-gray-500'}`} />
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">L{team.level}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-300 mt-1">
                          <div className="flex items-center">
                            <Mail className="w-3 h-3 mr-1" />
                            {team.leaderEmail}
                          </div>
                          <div className="flex items-center">
                            <Users className="w-3 h-3 mr-1" />
                            {team.memberCount} members
                          </div>
                          <div className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            {new Date(team.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                        team.isComplete ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-400' : 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-400'
                      }`}>
                        {team.isComplete ? 'Complete' : 'Incomplete'}
                      </span>
                      
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                        team.isActive ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
                      }`}>
                        {team.isActive ? 'Active' : 'Inactive'}
                      </span>
                      
                      <div className="text-2xl font-bold text-gray-600 dark:text-gray-100">
                        {team.teamCount}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-300">teams</div>
                      
                      {expandedTeams.has(team.id) ? (
                        <ChevronUp className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Team Details */}
                {expandedTeams.has(team.id) && (
                  <div className="px-6 pb-6 bg-gray-50 dark:bg-gray-900">
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Team Members</h4>
                      {team.members && team.members.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {team.members.map((member) => (
                            <div key={member.id} className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                              <div className="flex items-center space-x-2">
                                <UserCheck className="w-4 h-4 text-green-600 dark:text-green-400" />
                                <div>
                                  <div className="font-medium text-sm dark:text-gray-100">{member.name}</div>
                                  <div className="text-xs text-gray-500 dark:text-gray-300">{member.email}</div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 dark:text-gray-300 text-sm">No members in this team yet.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-700 dark:text-gray-200">
            Showing page {pagination.page} of {pagination.totalPages} 
            ({pagination.total} total teams)
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            <div className="flex items-center space-x-1">
              {[...Array(Math.min(pagination.totalPages, 10))].map((_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-2 border rounded-md text-sm font-medium ${
                      page === pagination.page
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'text-gray-700 dark:text-gray-100 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
