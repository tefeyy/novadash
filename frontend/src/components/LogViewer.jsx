import { useState, useEffect, useRef } from 'react'

const PROCESSES = [
  { id: 'novadash-backend', label: 'NovaDash Backend' },
  { id: 'discord-bot', label: 'Discord Bot' },
]

export default function LogViewer() {
  const [selectedProcess, setSelectedProcess] = useState('novadash-backend')
  const [lines, setLines] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [lastRefresh, setLastRefresh] = useState(null)
  const logRef = useRef(null)

  const fetchLogs = (proc) => {
    setLoading(true)
    setError(null)
    const token = localStorage.getItem('novadash_token')
    fetch(`https://dash.volkris.net/api/logs/${proc}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((data) => {
        setLines(data.lines || [])
        setLastRefresh(new Date().toLocaleTimeString())
      })
      .catch((err) => {
        setError(err.message)
        setLines([])
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchLogs(selectedProcess)
  }, [selectedProcess])

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [lines])

  const handleProcessChange = (e) => {
    setSelectedProcess(e.target.value)
  }

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <p className="text-gray-400 text-sm font-medium uppercase tracking-wider">Log Viewer</p>
        <div className="flex items-center gap-3">
          <select
            value={selectedProcess}
            onChange={handleProcessChange}
            className="bg-gray-700 text-gray-200 text-sm rounded-lg px-3 py-1.5 border border-gray-600 focus:outline-none focus:border-gray-500"
          >
            {PROCESSES.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
          <button
            onClick={() => fetchLogs(selectedProcess)}
            disabled={loading}
            className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm rounded-lg border border-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {lastRefresh && !loading && (
        <p className="text-gray-600 text-xs mb-2">Last loaded: {lastRefresh} — showing last 50 lines</p>
      )}

      {error && (
        <p className="text-red-400 text-sm mb-2">Error: {error}</p>
      )}

      <div
        ref={logRef}
        className="bg-gray-950 rounded-lg p-4 h-72 overflow-y-auto border border-gray-700"
      >
        {loading && lines.length === 0 && (
          <p className="text-gray-500 text-xs font-mono">Loading logs...</p>
        )}
        {!loading && lines.length === 0 && !error && (
          <p className="text-gray-500 text-xs font-mono">No log lines found.</p>
        )}
        {lines.map((line, i) => (
          <pre
            key={i}
            className="text-green-300 text-xs font-mono whitespace-pre-wrap break-all leading-5"
          >
            {line}
          </pre>
        ))}
      </div>
    </div>
  )
}
