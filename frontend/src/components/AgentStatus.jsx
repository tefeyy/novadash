import { useState, useEffect } from 'react'

const DISPLAY_NAMES = {
  'novadash-backend': 'NovaDash Backend',
  'discord-bot': 'Discord Bot',
  'staffbot': 'Staff Bot',
  'openclaw-gateway': 'OpenClaw / Jarvis',
}

function AgentRow({ agent }) {
  const isOnline = agent.status === 'online'

  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-700 last:border-0">
      <div className="flex items-center gap-3">
        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${isOnline ? 'bg-green-400' : 'bg-red-500'}`} />
        <span className="text-white font-medium text-sm">
          {DISPLAY_NAMES[agent.name] || agent.name}
        </span>
      </div>
      <div className="flex items-center gap-6 text-right">
        <div className="hidden sm:block">
          <p className="text-gray-500 text-xs uppercase tracking-wider">Memory</p>
          <p className="text-gray-300 text-sm">{agent.memoryMB > 0 ? `${agent.memoryMB} MB` : '—'}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs uppercase tracking-wider">Uptime</p>
          <p className="text-gray-300 text-sm">{agent.uptime}</p>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${isOnline ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
          {isOnline ? 'Online' : 'Offline'}
        </span>
      </div>
    </div>
  )
}

export default function AgentStatus() {
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchAgents = () => {
    const token = localStorage.getItem('novadash_token')
    fetch('https://dash.volkris.net/api/agents', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((data) => {
        setAgents(data)
        setError(null)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchAgents()
    const interval = setInterval(fetchAgents, 10000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <p className="text-gray-400 text-sm font-medium uppercase tracking-wider">Agent Status</p>
        {!loading && (
          <span className="text-gray-600 text-xs">auto-refresh 10s</span>
        )}
      </div>

      {loading && (
        <p className="text-gray-500 text-sm">Loading agents...</p>
      )}

      {error && !loading && (
        <p className="text-red-400 text-sm">Failed to load: {error}</p>
      )}

      {!loading && !error && agents.length === 0 && (
        <p className="text-gray-500 text-sm">No agents found.</p>
      )}

      {!loading && !error && agents.length > 0 && (
        <div>
          {agents.map((agent) => (
            <AgentRow key={agent.name} agent={agent} />
          ))}
        </div>
      )}
    </div>
  )
}
