import { useState } from 'react'

const PROCESSES = [
  { id: 'novadash-backend', label: 'NovaDash Backend' },
  { id: 'discord-bot', label: 'Discord Bot' },
  { id: 'staffbot', label: 'Staff Bot' },
]

export default function QuickActions() {
  const [statuses, setStatuses] = useState({})

  const handleRestart = async (proc) => {
    const confirmed = window.confirm(`Restart ${proc}? This will briefly interrupt the service.`)
    if (!confirmed) return

    setStatuses(s => ({ ...s, [proc]: 'loading' }))

    try {
      const token = localStorage.getItem('novadash_token')
      const res = await fetch('https://dash.volkris.net/api/actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'restart', process: proc }),
      })

      const data = await res.json()
      if (res.ok && data.ok) {
        setStatuses(s => ({ ...s, [proc]: 'ok' }))
      } else {
        setStatuses(s => ({ ...s, [proc]: 'error' }))
      }
    } catch (e) {
      setStatuses(s => ({ ...s, [proc]: 'error' }))
    }

    setTimeout(() => setStatuses(s => ({ ...s, [proc]: null })), 3000)
  }

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <p className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-4">Quick Actions</p>
      <div className="flex flex-wrap gap-3">
        {PROCESSES.map(({ id, label }) => {
          const status = statuses[id]
          const isLoading = status === 'loading'
          const isOk = status === 'ok'
          const isError = status === 'error'
          const btnClass = isOk
            ? 'bg-green-600 text-white'
            : isError
            ? 'bg-red-600 text-white'
            : 'bg-gray-700 text-gray-200 hover:bg-gray-600 active:bg-gray-500'

          return (
            <button
              key={id}
              onClick={() => handleRestart(id)}
              disabled={isLoading}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${btnClass}`}
            >
              {isLoading
                ? 'Restarting...'
                : isOk
                ? `${label} restarted`
                : isError
                ? 'Failed'
                : `Restart ${label}`}
            </button>
          )
        })}
      </div>
    </div>
  )
}
