import './Weather.css'

export default function AirportWeatherSummary({
  weather = [],
  alerts = [],
  loading = false,
  onRefresh,
  lastUpdated,
  dataSource = 'Live (Open-Meteo)',
}) {
  const ordWeather = weather.find((item) => item.shortName === 'ORD') || weather[0]
  const highAlertsCount = alerts.filter((a) => a.severity === 'High').length

  const getSourceClass = (src) => {
    if (src?.includes('Live')) return 'live'
    if (src?.includes('Cached')) return 'cached'
    return 'synthetic'
  }

  return (
    <div className="weather-summary-grid">
      {/* Primary Disruption Hub (ORD) */}
      <div className="summary-card">
        <div className="summary-card-content">
          <div className="summary-label">Primary Hub Weather (ORD)</div>
          <div className="summary-value">
            {ordWeather ? `${ordWeather.temperature}°C` : '--'}
          </div>
          <div className="summary-subtext">
            <span>{ordWeather?.icon || '✈'}</span>
            <span>{ordWeather?.condition || 'Awaiting conditions'}</span>
            {ordWeather && <span>· {ordWeather.windSpeed} km/h wind</span>}
          </div>
        </div>
        <div className="summary-icon-box blue">
          <span>{ordWeather?.icon || '⛅'}</span>
        </div>
      </div>

      {/* Critical Weather Alerts */}
      <div className="summary-card">
        <div className="summary-card-content">
          <div className="summary-label">High Weather Alerts</div>
          <div className="summary-value" style={{ color: highAlertsCount > 0 ? '#dc2626' : '#15803d' }}>
            {highAlertsCount}
          </div>
          <div className="summary-subtext">
            <span>{highAlertsCount > 0 ? '⚠️ High priority disruptions' : '✓ Nominal hub conditions'}</span>
          </div>
        </div>
        <div className={`summary-icon-box ${highAlertsCount > 0 ? 'red' : 'green'}`}>
          <span>{highAlertsCount > 0 ? '⚠' : '✓'}</span>
        </div>
      </div>

      {/* Monitored Hub Airports */}
      <div className="summary-card">
        <div className="summary-card-content">
          <div className="summary-label">Monitored US Hubs</div>
          <div className="summary-value">{weather.length}</div>
          <div className="summary-subtext">
            <span>ORD, ATL, DFW, DEN, JFK, LAX</span>
          </div>
        </div>
        <div className="summary-icon-box amber">
          <span>🏢</span>
        </div>
      </div>

      {/* Weather Data Stream & Sync */}
      <div className="summary-card">
        <div className="summary-card-content">
          <div className="summary-label">Weather Data Stream</div>
          <div>
            <span className={`source-tag ${getSourceClass(dataSource)}`}>
              <span className="source-dot" />
              {dataSource}
            </span>
          </div>
          <div className="summary-subtext" style={{ marginTop: '8px' }}>
            <span>Updated: {lastUpdated ? lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Syncing...'}</span>
          </div>
        </div>
        <div className="summary-icon-box green">
          <button
            onClick={onRefresh}
            disabled={loading}
            title="Refresh airport weather"
            style={{
              background: 'none',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '18px',
              padding: 0,
            }}
          >
            <span className={loading ? 'spin-icon' : ''}>↻</span>
          </button>
        </div>
      </div>
    </div>
  )
}
