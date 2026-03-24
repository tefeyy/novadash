import { useEffect, useState } from 'react'

export default function ProcessMonitor() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchProcesses = () => {
    fetch('https://dash.volkris.net/api/processes')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    fetchProcesses()
    const interval = setInterval(fetchProcesses, 10000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <p className="text-gray-400 text-sm font-medium uppercase tracking-wider">Process Monitor</p>
        {data && (
          <span className="text-gray-500 text-xs">{data.running} running / {data.total} total</span>
        )}
      </div>

      {loading && <p className="text-gray-500 text-sm">Loading processes...</p>}

      {data && (
        <div className="space-y-2">
          <div className="grid grid-cols-12 gap-2 text-xs text-gray-500 uppercase tracking-wider pb-2 border-b border-gray-700">
            <span className="col-span-5">Process</span>
            <span className="col-span-2 text-right">PID</span>
            <span className="col-span-2 text-right">CPU</span>
            <span className="col-span-3 text-right">Memory</span>
          </div>

          {data.list.map((p, i) => (
            <div key={p.pid} className="grid grid-cols-12 gap-2 text-sm items-center py-1">
              <span className="col-span-5 text-white truncate font-mono text-xs">{p.name}</span>
              <span className="col-span-2 text-right text-gray-500 font-mono text-xs">{p.pid}</span>
              <span className={`col-span-2 text-right text-xs font-mono ${parseFloat(p.cpu) > 10 ? 'text-yellow-400' : 'text-gray-300'}`}>
                {p.cpu}%
              </span>
              <span className={`col-span-3 text-right text-xs font-mono ${parseFloat(p.mem) > 10 ? 'text-red-400' : parseFloat(p.mem) > 5 ? 'text-yellow-400' : 'text-gray-300'}`}>
                {p.memMb > 0 ? `${p.memMb} MB` : `${p.mem}%`}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
