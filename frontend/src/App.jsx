import { useEffect, useState } from 'react'
import ProcessMonitor from './ProcessMonitor'
import QuickActions from './components/QuickActions'
import AgentStatus from './components/AgentStatus'
import LogViewer from './components/LogViewer'
import NovaMindPanel from './components/NovaMindPanel'
import { io } from 'socket.io-client'
import Login from './Login'
import MinecraftCard from './MinecraftCard'

let socket = null

function StatCard({ title, value, subtitle, color }) {
  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <p className="text-gray-400 text-sm font-medium uppercase tracking-wider">{title}</p>
      <p className={`text-4xl font-bold mt-2 ${color}`}>{value}</p>
      {subtitle && <p className="text-gray-500 text-sm mt-1">{subtitle}</p>}
    </div>
  )
}

function formatUptime(seconds) {
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return `${d}d ${h}h ${m}m`
}

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('novadash_token'))
  const [stats, setStats] = useState(null)
  const [connected, setConnected] = useState(false)
  const [uptime, setUptime] = useState(null)

  useEffect(() => {
    if (!token) return

    socket = io('https://dash.volkris.net')
    socket.on('connect', () => setConnected(true))
    socket.on('disconnect', () => setConnected(false))
    socket.on('stats', (data) => setStats(data))

    fetch('https://dash.volkris.net/api/health')
      .then(r => r.json())
      .then(d => setUptime(d.uptime))

    return () => socket?.off('stats')
  }, [token])

  if (!token) return <Login onLogin={setToken} />

  const cpuColor = stats?.cpu > 80 ? 'text-red-400' : stats?.cpu > 50 ? 'text-yellow-400' : 'text-green-400'
  const memPercent = stats ? ((stats.memUsed / stats.memTotal) * 100).toFixed(1) : null
  const memColor = memPercent > 85 ? 'text-red-400' : memPercent > 70 ? 'text-yellow-400' : 'text-green-400'
  const diskColor = stats?.disk?.percent > 80 ? 'text-red-400' : 'text-green-400'

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">NovaDash</h1>
          <p className="text-gray-500 text-sm">VPS Command Centre — volkris.net</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`} />
          <span className="text-sm text-gray-400">{connected ? 'Live' : 'Disconnected'}</span>
        </div>
      </div>

      {/* Main content */}
      <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        {/* Server Health */}
        <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-widest mb-4">Server Health</h2>
        {!stats ? (
          <p className="text-gray-500">Connecting to server...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="CPU Load"
              value={`${stats.cpu}%`}
              subtitle="Current usage"
              color={cpuColor}
            />
            <StatCard
              title="Memory"
              value={`${memPercent}%`}
              subtitle={`${stats.memUsed} GB / ${stats.memTotal} GB`}
              color={memColor}
            />
            <StatCard
              title="Disk"
              value={`${stats.disk?.percent}%`}
              subtitle={`${stats.disk?.used} GB / ${stats.disk?.size} GB`}
              color={diskColor}
            />
            <StatCard
              title="Uptime"
              value={uptime ? formatUptime(uptime) : '—'}
              subtitle="Since last reboot"
              color="text-blue-400"
            />
          </div>
        )}

        {/* Game Servers */}
        <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-widest mt-10 mb-4">Game Servers</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <MinecraftCard />
        </div>

        {/* Processes */}
        <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-widest mt-10 mb-4">Processes</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ProcessMonitor />
        </div>

        {/* Quick Actions */}
        <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-widest mt-10 mb-4">Quick Actions</h2>
        <QuickActions />

        {/* Agent Status */}
        <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-widest mt-10 mb-4">Agents</h2>
        <AgentStatus />

        {/* Log Viewer */}
        <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-widest mt-10 mb-4">Logs</h2>
        <LogViewer />

        {/* NovaMind */}
        <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-widest mt-10 mb-4">NovaMind</h2>
        <NovaMindPanel />

      </div>
    </div>
  )
}
