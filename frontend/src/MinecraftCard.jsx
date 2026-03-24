import { useEffect, useState } from 'react'

export default function MinecraftCard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchStatus = () => {
    fetch('https://dash.volkris.net/api/minecraft')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => { setData({ online: false }); setLoading(false) })
  }

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <p className="text-gray-400 text-sm font-medium uppercase tracking-wider">Volkris — Minecraft</p>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${loading ? 'bg-gray-500' : data?.online ? 'bg-green-400' : 'bg-red-400'}`} />
          <span className={`text-sm font-medium ${loading ? 'text-gray-500' : data?.online ? 'text-green-400' : 'text-red-400'}`}>
            {loading ? 'Checking...' : data?.online ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>

      {data?.online && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Players</span>
            <span className="text-white font-bold text-lg">{data.players.online}
              <span className="text-gray-500 font-normal text-sm"> / {data.players.max}</span>
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Version</span>
            <span className="text-gray-300 text-sm">{data.version}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Address</span>
            <span className="text-gray-300 text-sm font-mono">play.volkris.net</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-1.5 mt-2">
            <div
              className="bg-green-400 h-1.5 rounded-full transition-all"
              style={{ width: `${(data.players.online / data.players.max) * 100}%` }}
            />
          </div>
        </div>
      )}

      {!loading && !data?.online && (
        <p className="text-gray-500 text-sm">Server is not responding</p>
      )}
    </div>
  )
}
