import './Weather.css'

export default function WeatherPanel({
  weather = [],
  loading = false,
  error = '',
  onRefresh,
  dataSource = 'Live (Open-Meteo)',
}) {
  const getSourceClass = (src) => {
    if (src?.includes('Live')) return 'live'
    if (src?.includes('Cached')) return 'cached'
    return 'synthetic'
  }

  return (
    <div className="weather-panel-root">
      <div className="weather-header-bar">
        <div>
          <h3 style={{ margin: '0 0 4px', fontSize: '18px', color: '#0f172a' }}>
            Hub Airport Weather
          </h3>
          <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
            Real-time METAR-equivalent conditions from Open-Meteo across US hub airports.
          </p>
        </div>

        <div className="weather-header-actions">
          <span className={`source-tag ${getSourceClass(dataSource)}`}>
            <span className="source-dot" />
            {dataSource}
          </span>

          <button
            className="weather-refresh-btn"
            onClick={onRefresh}
            disabled={loading}
          >
            <span className={loading ? 'spin-icon' : ''}>↻</span>
            <span>{loading ? 'Refreshing...' : 'Refresh Weather'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="weather-error-banner" role="alert">
          <div>
            <strong>Notice:</strong> {error}
          </div>
          <button onClick={onRefresh}>Retry Connection</button>
        </div>
      )}

      {loading && weather.length === 0 ? (
        <div className="weather-cards-grid">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div key={idx} className="airport-weather-card" style={{ minHeight: '180px' }}>
              <div className="skeleton-box" style={{ width: '40%', height: '24px', marginBottom: '12px' }} />
              <div className="skeleton-box" style={{ width: '70%', height: '16px', marginBottom: '20px' }} />
              <div className="skeleton-box" style={{ width: '50%', height: '36px', marginBottom: '20px' }} />
              <div className="skeleton-box" style={{ width: '100%', height: '30px' }} />
            </div>
          ))}
        </div>
      ) : weather.length === 0 ? (
        <div className="weather-empty-box">
          <div className="weather-empty-icon">⛅</div>
          <h4>No Airport Weather Available</h4>
          <p>Click "Refresh Weather" to fetch conditions from Open-Meteo API.</p>
        </div>
      ) : (
        <div className="weather-cards-grid">
          {weather.map((airport) => {
            const isOrd = airport.shortName === 'ORD'
            const itemSource = airport.source || dataSource

            return (
              <div
                key={airport.id}
                className={`airport-weather-card ${isOrd ? 'hub-featured' : ''}`}
              >
                {isOrd && <span className="hub-flag">Primary Hub</span>}

                <div className="card-top-row">
                  <div>
                    <span className="iata-badge">{airport.shortName}</span>
                    <h4 className="card-airport-name" title={airport.name}>
                      {airport.name}
                    </h4>
                  </div>
                  <span className={`source-tag ${getSourceClass(itemSource)}`}>
                    {itemSource.includes('Live') ? 'Live' : itemSource.includes('Cached') ? 'Cached' : 'Synthetic'}
                  </span>
                </div>

                <div className="temperature-display">
                  <div>
                    <span className="temp-primary">{airport.temperature}°C</span>
                    <span className="temp-condition">{airport.condition}</span>
                  </div>
                  <span className="weather-icon-large" role="img" aria-label={airport.condition}>
                    {airport.icon}
                  </span>
                </div>

                <div className="weather-metrics-row">
                  <div className="metric-pill">
                    <small>Feels Like</small>
                    <strong>{airport.feelsLike}°C</strong>
                  </div>
                  <div className="metric-pill">
                    <small>Wind Speed</small>
                    <strong>{airport.windSpeed} km/h</strong>
                  </div>
                  <div className="metric-pill">
                    <small>Humidity</small>
                    <strong>{airport.humidity}%</strong>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
