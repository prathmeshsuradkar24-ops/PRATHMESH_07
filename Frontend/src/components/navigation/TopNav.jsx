import { useState, useEffect } from 'react'
import { Clock, Globe, Shield, Radio } from 'lucide-react'
import '../dashboard/Dashboard.css'

export default function TopNav({
  selectedAirport = 'ORD',
  onSelectAirport,
  airports = [],
  weatherSource = 'Live (Open-Meteo)',
  backendConnected = false,
  userRole = 'Duty officer',
  highAlertsCount = 0,
}) {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Format times per PRD Section A8 (UTC and airport local time)
  const utcString = currentTime.toISOString().substring(11, 19) + ' UTC'
  const localString = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  return (
    <header className="cmd-topnav">
      {/* Airport Hub Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
        <div className="airport-hub-selector">
          <Globe size={16} color="#2563eb" />
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>HUB:</span>
          <select
            value={selectedAirport}
            onChange={(e) => onSelectAirport(e.target.value)}
            aria-label="Active Airport Hub"
          >
            {airports.map((airport) => (
              <option key={airport.id || airport.shortName} value={airport.shortName}>
                {airport.shortName} — {airport.name}
              </option>
            ))}
          </select>
        </div>

        {/* Dual Clocks (UTC & Local) */}
        <div className="clock-display">
          <Clock size={14} color="#64748b" />
          <span><strong>LOCAL:</strong> {localString}</span>
          <span style={{ color: '#cbd5e1' }}>|</span>
          <span><strong>UTC:</strong> {utcString}</span>
        </div>
      </div>

      {/* Right Side Status & Role Badges */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        {/* Weather API Stream status */}
        <div
          className="system-status"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <span
            className="online-dot"
            style={{
              background: weatherSource?.includes('Live')
                ? '#22c55e'
                : weatherSource?.includes('Cached')
                  ? '#38bdf8'
                  : '#f59e0b',
            }}
          />
          <span>Weather: {weatherSource}</span>
        </div>

        {/* Backend API status */}
        <div
          className="system-status"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <Radio size={13} color={backendConnected ? '#22c55e' : '#f59e0b'} />
          <span>Backend: {backendConnected ? 'Connected (Port 8000)' : 'Simulated / Demo Mode'}</span>
        </div>

        {/* Active Disruption indicator */}
        {highAlertsCount > 0 && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              background: '#fee2e2',
              color: '#991b1b',
              borderRadius: '8px',
              fontSize: '11px',
              fontWeight: 700,
            }}
          >
            <span>⚠️ {highAlertsCount} Active Disruptions</span>
          </div>
        )}

        {/* User Role Badge */}
        <div className="role-switcher-badge">
          <Shield size={14} color="#2563eb" />
          <span>Role: <strong>{userRole}</strong></span>
        </div>
      </div>
    </header>
  )
}
