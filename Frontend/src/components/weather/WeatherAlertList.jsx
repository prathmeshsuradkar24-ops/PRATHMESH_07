import { useState } from 'react'
import './Weather.css'

export default function WeatherAlertList({ alerts = [] }) {
  const [selectedSeverity, setSelectedSeverity] = useState('All')
  const [activeAlert, setActiveAlert] = useState(null)

  const counts = {
    All: alerts.length,
    High: alerts.filter((a) => a.severity === 'High').length,
    Medium: alerts.filter((a) => a.severity === 'Medium').length,
    Low: alerts.filter((a) => a.severity === 'Low').length,
  }

  const filteredAlerts =
    selectedSeverity === 'All'
      ? alerts
      : alerts.filter((alert) => alert.severity === selectedSeverity)

  const getSourceClass = (src) => {
    if (src?.includes('Live')) return 'live'
    if (src?.includes('Cached')) return 'cached'
    return 'synthetic'
  }

  return (
    <div className="alerts-section-container">
      <div className="section-heading" style={{ marginBottom: '14px' }}>
        <div>
          <h3 style={{ margin: '0 0 4px', fontSize: '18px', color: '#0f172a' }}>
            Operational Weather Alerts
          </h3>
          <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
            Automated alerts indicating potential flight disruptions and resource holds.
          </p>
        </div>
      </div>

      {/* Severity Filter Controls */}
      <div className="severity-filter-bar">
        {['All', 'High', 'Medium', 'Low'].map((sev) => (
          <button
            key={sev}
            className={`severity-btn ${selectedSeverity === sev ? 'active' : ''}`}
            onClick={() => setSelectedSeverity(sev)}
          >
            <span>{sev}</span>
            <span className="badge-count">{counts[sev]}</span>
          </button>
        ))}
      </div>

      {/* Alerts Stream */}
      {filteredAlerts.length === 0 ? (
        <div className="weather-empty-box">
          <div className="weather-empty-icon">✓</div>
          <h4>No {selectedSeverity === 'All' ? 'Active' : selectedSeverity} Weather Alerts</h4>
          <p>
            {selectedSeverity === 'All'
              ? 'All monitored US hub airports are operating within nominal weather limits.'
              : `No alerts matching the "${selectedSeverity}" priority filter.`}
          </p>
        </div>
      ) : (
        <div className="alerts-cards-flow">
          {filteredAlerts.map((alert) => (
            <article
              key={alert.id}
              className={`weather-alert-card severity-${alert.severity.toLowerCase()}`}
            >
              <div className="alert-severity-icon">
                {alert.severity === 'High' ? '⛈️' : alert.severity === 'Medium' ? '⚠️' : '🌦️'}
              </div>

              <div className="alert-body">
                <div className="alert-title-heading">
                  <h4>{alert.title}</h4>
                  <span className={`severity-tag ${alert.severity.toLowerCase()}`}>
                    {alert.severity} Priority
                  </span>
                  <span className={`source-tag ${getSourceClass(alert.source)}`}>
                    {alert.source}
                  </span>
                </div>

                <p className="alert-message-text">{alert.message}</p>

                <div className="alert-footer-meta">
                  <span>📍 {alert.airportCode} · {alert.airportName}</span>
                  <span>💨 Wind: {alert.windSpeed} km/h</span>
                  <span>⏱ {alert.timestamp}</span>
                </div>
              </div>

              <button
                className="alert-details-btn"
                onClick={() => setActiveAlert(alert)}
              >
                View Impact
              </button>
            </article>
          ))}
        </div>
      )}

      {/* Detailed Operational Alert Modal */}
      {activeAlert && (
        <div
          className="alert-modal-backdrop"
          onClick={() => setActiveAlert(null)}
          role="presentation"
        >
          <div
            className="alert-modal-dialog"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="alert-modal-title"
          >
            <div className="modal-head">
              <div>
                <span className={`severity-tag ${activeAlert.severity.toLowerCase()}`} style={{ marginBottom: '8px' }}>
                  {activeAlert.severity} Priority Alert
                </span>
                <h3 id="alert-modal-title">{activeAlert.title}</h3>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setActiveAlert(null)}
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '13px', color: '#334155', lineHeight: 1.6, margin: '12px 0' }}>
              {activeAlert.message}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', margin: '16px 0' }}>
              <div className="metric-pill" style={{ textAlign: 'left', padding: '10px' }}>
                <small>Airport</small>
                <strong>{activeAlert.airportName} ({activeAlert.airportCode})</strong>
              </div>
              <div className="metric-pill" style={{ textAlign: 'left', padding: '10px' }}>
                <small>Condition</small>
                <strong>{activeAlert.condition}</strong>
              </div>
              <div className="metric-pill" style={{ textAlign: 'left', padding: '10px' }}>
                <small>Surface Wind</small>
                <strong>{activeAlert.windSpeed} km/h</strong>
              </div>
              <div className="metric-pill" style={{ textAlign: 'left', padding: '10px' }}>
                <small>Data Source</small>
                <strong>{activeAlert.source}</strong>
              </div>
            </div>

            <div className="modal-impact-box">
              <strong>Operational Coordination Directive:</strong>
              <p style={{ margin: '4px 0 0' }}>{activeAlert.operationalImpact}</p>
            </div>

            <div className="modal-disclaimer">
              <strong>Advisory Notice:</strong> This weather alert is generated from automated Open-Meteo meteorological indicators for decision support simulation only. It does not replace official FAA or ATC clearances.
            </div>

            <button
              onClick={() => setActiveAlert(null)}
              className="weather-refresh-btn"
              style={{ width: '100%', marginTop: '16px', justifyContent: 'center' }}
            >
              Acknowledge & Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
