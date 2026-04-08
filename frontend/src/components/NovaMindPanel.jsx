import { useState, useEffect } from 'react'

const SEVERITY_STYLES = {
  critical: 'bg-red-900 text-red-300 border-red-700',
  warning:  'bg-yellow-900 text-yellow-300 border-yellow-700',
  info:     'bg-blue-900 text-blue-300 border-blue-700',
}

const SEVERITY_BADGE = {
  critical: 'bg-red-800 text-red-200',
  warning:  'bg-yellow-800 text-yellow-200',
  info:     'bg-blue-800 text-blue-200',
}

function FindingRow({ finding }) {
  const style = SEVERITY_STYLES[finding.severity] || SEVERITY_STYLES.info
  const badge = SEVERITY_BADGE[finding.severity] || SEVERITY_BADGE.info
  const ts = new Date(finding.created_at).toLocaleString()

  return (
    <div className={`rounded-lg p-4 border mb-3 ${style}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-snug">{finding.message}</p>
          {finding.detail && (
            <p className="text-xs opacity-70 mt-1">{finding.detail}</p>
          )}
          <p className="text-xs opacity-50 mt-1">{ts}</p>
        </div>
        <span className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${badge}`}>
          {finding.severity}
        </span>
      </div>
    </div>
  )
}

export default function NovaMindPanel() {
  const [findings, setFindings] = useState([])
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState(null)
  const [lastRun, setLastRun] = useState(null)

  const token = localStorage.getItem('novadash_token')
  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }

  const fetchFindings = () => {
    fetch('https://dash.volkris.net/api/novamind/findings', { headers: authHeaders })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((data) => {
        setFindings(data)
        setError(null)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  const runScan = async () => {
    setScanning(true)
    setError(null)
    try {
      const res = await fetch('https://dash.volkris.net/api/novamind/run', {
        method: 'POST',
        headers: authHeaders,
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setLastRun(new Date().toLocaleTimeString())
      fetchFindings()
    } catch (e) {
      setError(`Scan failed: ${e.message}`)
    } finally {
      setScanning(false)
    }
  }

  useEffect(() => {
    fetchFindings()
  }, [])

  const counts = findings.reduce((acc, f) => {
    acc[f.severity] = (acc[f.severity] || 0) + 1
    return acc
  }, {})

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-gray-400 text-sm font-medium uppercase tracking-wider">NovaMind</p>
          {lastRun && <p className="text-gray-600 text-xs mt-0.5">Last scan: {lastRun}</p>}
        </div>
        <div className="flex items-center gap-3">
          {!loading && findings.length > 0 && (
            <div className="flex gap-2">
              {counts.critical > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-900 text-red-300">
                  {counts.critical} critical
                </span>
              )}
              {counts.warning > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-900 text-yellow-300">
                  {counts.warning} warning
                </span>
              )}
              {counts.info > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-900 text-blue-300">
                  {counts.info} info
                </span>
              )}
            </div>
          )}
          <button
            onClick={runScan}
            disabled={scanning}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {scanning ? 'Scanning...' : 'Run Scan'}
          </button>
        </div>
      </div>

      {loading && <p className="text-gray-500 text-sm">Loading findings...</p>}

      {error && !loading && (
        <p className="text-red-400 text-sm">{error}</p>
      )}

      {!loading && !error && findings.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-400 text-sm font-medium">No findings</p>
          <p className="text-gray-600 text-xs mt-1">Run a scan to analyse the system</p>
        </div>
      )}

      {!loading && !error && findings.length > 0 && (
        <div className="max-h-96 overflow-y-auto pr-1">
          {findings.map((f) => (
            <FindingRow key={f.id} finding={f} />
          ))}
        </div>
      )}
    </div>
  )
}
