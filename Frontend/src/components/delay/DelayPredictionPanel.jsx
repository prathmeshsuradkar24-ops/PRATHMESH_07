import { useState } from 'react'
import { Sparkles, AlertCircle, Info, RefreshCw, BarChart2 } from 'lucide-react'
import { predictFlightDelay } from '../../services/mlService'
import '../analytics/Analytics.css'

export default function DelayPredictionPanel({
  flights = [],
  selectedFlightId = 'DEMO205',
  onSelectFlight,
  activeWeather,
}) {
  const [selectedFlight, setSelectedFlight] = useState(
    flights.find((f) => f.flight_id === selectedFlightId) || flights[0] || null
  )
  const [prediction, setPrediction] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const activeFlight =
    flights.find((f) => f.flight_id === selectedFlightId) || selectedFlight || flights[0]

  async function handlePredict() {
    if (!activeFlight) {
      setError('Please select a flight to evaluate.')
      return
    }

    setLoading(true)
    setError('')
    try {
      const weatherCtx = activeWeather || { code: 95, windSpeed: 38, source: 'Open-Meteo METAR Live' }
      const res = await predictFlightDelay(activeFlight, weatherCtx)
      setPrediction(res)
    } catch (err) {
      setError(err.message || 'Failed to generate delay prediction.')
    } finally {
      setLoading(false)
    }
  }

  const getRiskColor = (risk) => {
    if (risk === 'High') return '#dc2626'
    if (risk === 'Medium') return '#d97706'
    return '#16a34a'
  }

  const getRiskBg = (risk) => {
    if (risk === 'High') return '#fee2e2'
    if (risk === 'Medium') return '#fef3c7'
    return '#dcfce7'
  }

  return (
    <div className="prediction-panel-root" id="prediction">
      <div className="section-heading" style={{ marginBottom: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={20} color="#2563eb" />
            <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>
              Predictive Delay & Risk Scoring Panel
            </h3>
            <span className="est-tag" style={{ fontSize: '10px', padding: '2px 8px' }}>
              FE-7 ML ESTIMATE
            </span>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
            LightGBM classification and regression model trained on 2023 US BTS on-time data.
          </p>
        </div>

        {prediction && (
          <span
            className={`source-tag ${prediction.is_demo ? 'synthetic' : 'live'}`}
          >
            <span className="source-dot" />
            {prediction.source}
          </span>
        )}
      </div>

      {/* Flight Selection & Trigger Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          flexWrap: 'wrap',
          background: '#f8fafc',
          padding: '16px',
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
        }}
      >
        <div style={{ flex: 1, minWidth: '220px' }}>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
            Target Flight Manifest
          </label>
          <select
            value={activeFlight?.flight_id || ''}
            onChange={(e) => {
              const matched = flights.find((f) => f.flight_id === e.target.value)
              setSelectedFlight(matched)
              if (onSelectFlight) onSelectFlight(e.target.value)
              setPrediction(null)
            }}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontWeight: 600,
              fontSize: '13px',
              background: '#ffffff',
            }}
          >
            {flights.map((f) => (
              <option key={f.flight_id} value={f.flight_id}>
                {f.flight_id} — {f.origin} ➔ {f.destination} ({f.scheduled_departure}) · {f.risk_level} Risk
              </option>
            ))}
          </select>
        </div>

        <div style={{ minWidth: '160px' }}>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
            Associated Weather Hub
          </label>
          <div style={{ padding: '8px 12px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>
            {activeFlight?.origin || 'ORD'} (Open-Meteo)
          </div>
        </div>

        <div style={{ alignSelf: 'flex-end' }}>
          <button
            onClick={handlePredict}
            disabled={loading || !activeFlight}
            className="weather-refresh-btn"
            style={{ height: '38px', padding: '0 18px', fontWeight: 700 }}
          >
            {loading ? (
              <>
                <RefreshCw size={14} className="spin-icon" />
                <span>Running ML Inference...</span>
              </>
            ) : (
              <>
                <Sparkles size={14} />
                <span>Generate Delay Estimate</span>
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="weather-error-banner" style={{ marginTop: '14px' }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Demo Mock Warning Banner when running in demo mode */}
      {prediction?.is_demo && (
        <div
          style={{
            marginTop: '16px',
            padding: '10px 14px',
            background: '#fff7ed',
            border: '1px solid #fed7aa',
            borderRadius: '8px',
            fontSize: '11px',
            color: '#9a3412',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <AlertCircle size={15} color="#ea580c" style={{ flexShrink: 0 }} />
          <span>
            <strong>DEMO MODE — CALIBRATED MOCK DATA ONLY:</strong> Backend ML service is unreachable. The values shown below are calibrated BTS 2023 mock data for demonstration purposes only. This is not a real model prediction.
          </span>
        </div>
      )}

      {/* Prediction Output Display */}
      {prediction && (
        <div className="prediction-results-grid">
          {/* Probability & Delay Gauge Card */}
          <div className="prediction-score-box">
            <div className="prob-meter-label">
              Delay Probability
              <span className="est-tag">Estimate</span>
            </div>
            <div
              className="prob-meter-number"
              style={{ color: getRiskColor(prediction.risk_level) }}
            >
              {Math.round(prediction.delay_probability * 100)}%
            </div>
            <span
              style={{
                display: 'inline-block',
                marginTop: '6px',
                padding: '3px 10px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: 800,
                color: getRiskColor(prediction.risk_level),
                background: getRiskBg(prediction.risk_level),
                width: 'fit-content',
                margin: '8px auto 0',
              }}
            >
              {prediction.risk_level} Risk Level
              <span className="est-tag" style={{ marginLeft: '4px' }}>Estimate</span>
            </span>

            <div className="expected-minutes-label">
              +{prediction.expected_delay_minutes} min
              <span className="est-tag">Estimate</span>
            </div>
            <small style={{ color: '#64748b', fontSize: '11px', marginTop: '4px' }}>
              Expected arrival delay duration (statistical estimate)
            </small>

            <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #e2e8f0', fontSize: '10px', color: '#94a3b8' }}>
              Cutoffs: Low &lt; 0.30 · Med 0.30–0.55 · High &gt; 0.55
            </div>
          </div>

          {/* SHAP Factor Impact Breakdown */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <BarChart2 size={16} color="#2563eb" />
                <h4 style={{ margin: 0, fontSize: '14px', color: '#0f172a' }}>
                  Top Contributing Risk Factors (SHAP Values)
                </h4>
                <span className="est-tag">Estimate</span>
              </div>
              <span style={{ fontSize: '11px', color: '#64748b' }}>
                Feature Impact Ranking
              </span>
            </div>

            <div className="shap-factors-container">
              {prediction.top_factors.map((factorItem, index) => (
                <div key={index} className="shap-factor-row">
                  <div className="shap-factor-top">
                    <span className="shap-factor-name">
                      {factorItem.factor}
                    </span>
                    <span
                      className={`shap-factor-effect ${factorItem.effect.startsWith('-') ? 'negative' : ''}`}
                    >
                      {factorItem.effect} <span className="est-tag">Estimate</span>
                    </span>
                  </div>
                  <div className="shap-factor-desc">
                    <span>Feature value: <strong>{factorItem.value}</strong></span>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: '4px',
                        background: factorItem.impact === 'High' ? '#fee2e2' : factorItem.impact === 'Medium' ? '#fef3c7' : '#dcfce7',
                        color: factorItem.impact === 'High' ? '#b91c1c' : factorItem.impact === 'Medium' ? '#92400e' : '#15803d',
                      }}
                    >
                      {factorItem.impact} Impact
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Weather Source, Limitations & Advisory-Only Disclaimer */}
            <div
              style={{
                marginTop: '16px',
                padding: '12px 14px',
                background: '#fffbeb',
                border: '1px solid #fde68a',
                borderRadius: '8px',
                fontSize: '11px',
                color: '#92400e',
                lineHeight: 1.5,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, marginBottom: '4px' }}>
                <Info size={14} color="#b45309" />
                <span>PRD Section A7 Compliance: Limitations & Advisory Notice</span>
              </div>
              <p style={{ margin: '0 0 6px' }}>
                <strong>Advisory-Only:</strong> {prediction.disclaimer} Weather source: <strong>{prediction.weather_source}</strong>. All predictions carry the <span className="est-tag">Estimate</span> label.
              </p>
              <p style={{ margin: 0, fontSize: '10.5px', color: '#78350f' }}>
                <strong>Model Limitations:</strong> Delay probabilities and expected minutes are statistical approximations trained on 2023 BTS records. Real-time ATC sequencing, tactical holds, and sudden convective squalls may cause actual arrival times to diverge.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
