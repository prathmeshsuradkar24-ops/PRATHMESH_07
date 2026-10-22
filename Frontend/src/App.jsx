import { useCallback, useEffect, useState } from 'react'
import './App.css'
import { analyzeFlight } from './services/researchApi'
import { fetchAirportsWeather, DEFAULT_AIRPORTS } from './services/weatherService'
import { loadOperationsFlights } from './services/flightService'

import AdvisoryBanner from './components/common/AdvisoryBanner'
import Sidebar from './components/navigation/Sidebar'
import TopNav from './components/navigation/TopNav'
import OperationalMetrics from './components/dashboard/OperationalMetrics'
import DelayRiskChart from './components/dashboard/DelayRiskChart'
import FlightStatusTable from './components/flights/FlightStatusTable'
import AirportWeatherSummary from './components/weather/AirportWeatherSummary'
import WeatherPanel from './components/weather/WeatherPanel'
import WeatherAlertList from './components/weather/WeatherAlertList'
import DelayPredictionPanel from './components/delay/DelayPredictionPanel'
import DelayAnalyticsSection from './components/analytics/DelayAnalyticsSection'
import AgentActivityTimeline from './components/agents/AgentActivityTimeline'



function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('overview')
  const [selectedAirport, setSelectedAirport] = useState('ORD')
  const [userRole, setUserRole] = useState('Duty officer')
  const [backendConnected, setBackendConnected] = useState(false)

  // Flights state
  const [flights, setFlights] = useState([])
  const [selectedFlightId, setSelectedFlightId] = useState('DEMO205')
  const [analysis, setAnalysis] = useState(null)
  const [loadingFlights, setLoadingFlights] = useState(true)
  const [loadingAnalysis, setLoadingAnalysis] = useState(false)
  const [error, setError] = useState('')
  const [flightError, setFlightError] = useState('')

  // Weather monitoring state
  const [weatherList, setWeatherList] = useState([])
  const [weatherAlerts, setWeatherAlerts] = useState([])
  const [weatherLoading, setWeatherLoading] = useState(false)
  const [weatherError, setWeatherError] = useState('')
  const [weatherSource, setWeatherSource] = useState('Live (Open-Meteo)')
  const [weatherLastUpdated, setWeatherLastUpdated] = useState(null)

  const handleRefreshWeather = useCallback(async () => {
    setWeatherLoading(true)
    setWeatherError('')
    try {
      const res = await fetchAirportsWeather(DEFAULT_AIRPORTS)
      setWeatherList(res.weather || [])
      setWeatherAlerts(res.alerts || [])
      setWeatherSource(res.source || 'Live (Open-Meteo)')
      setWeatherLastUpdated(new Date())
      if (res.error) {
        setWeatherError(res.error)
      }
    } catch (err) {
      setWeatherError(err.message || 'Unable to update weather conditions.')
    } finally {
      setWeatherLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadInitialWeather() {
      setWeatherLoading(true)
      try {
        const res = await fetchAirportsWeather(DEFAULT_AIRPORTS)
        if (!cancelled) {
          setWeatherList(res.weather || [])
          setWeatherAlerts(res.alerts || [])
          setWeatherSource(res.source || 'Live (Open-Meteo)')
          setWeatherLastUpdated(new Date())
          if (res.error) setWeatherError(res.error)
        }
      } catch (err) {
        if (!cancelled) {
          setWeatherError(err.message || 'Unable to update weather conditions.')
        }
      } finally {
        if (!cancelled) setWeatherLoading(false)
      }
    }

    loadInitialWeather()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadFlights() {
      setLoadingFlights(true)
      try {
        const data = await loadOperationsFlights()

        if (!cancelled) {
          setFlights(data.flights || [])
          setBackendConnected(!data.isFallback)

          if (data.flights?.length > 0) {
            const hasExisting = data.flights.some((f) => f.flight_id === selectedFlightId)
            if (!hasExisting) {
              setSelectedFlightId(data.flights[0].flight_id)
            }
          }
        }
      } catch (err) {
        if (!cancelled) {
          setFlightError(err.message || 'Unable to load flights.')
        }
      } finally {
        if (!cancelled) setLoadingFlights(false)
      }
    }

    loadFlights()

    return () => {
      cancelled = true
    }
  }, [selectedFlightId])

  const selectedFlight = flights.find(
    (flight) => flight.flight_id === selectedFlightId,
  )

  function handleSelectFlightFromTable(flightId) {
    setSelectedFlightId(flightId)
    setAnalysis(null)
    setError('')
    document.getElementById('research')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  function getFlightWeatherContext(flight) {
    if (!flight) return null
    const originCode = (flight.origin || '').toUpperCase()
    const destCode = (flight.destination || '').toUpperCase()

    const originAlert = weatherAlerts.find((a) => a.airportCode === originCode)
    const destAlert = weatherAlerts.find((a) => a.airportCode === destCode)
    const originWeather = weatherList.find((w) => w.shortName === originCode)
    const destWeather = weatherList.find((w) => w.shortName === destCode)

    if (originAlert && originAlert.severity === 'High') {
      return `⚠️ High Weather Alert at Origin (${originCode}): ${originAlert.condition}, wind ${originAlert.windSpeed} km/h.`
    }
    if (destAlert && destAlert.severity === 'High') {
      return `⚠️ High Weather Alert at Destination (${destCode}): ${destAlert.condition}, wind ${destAlert.windSpeed} km/h.`
    }
    if (originAlert) {
      return `⚠️ ${originAlert.severity} Alert at ${originCode}: ${originAlert.condition}.`
    }
    if (destAlert) {
      return `⚠️ ${destAlert.severity} Alert at ${destCode}: ${destAlert.condition}.`
    }

    const originDesc = originWeather ? `${originCode}: ${originWeather.icon} ${originWeather.temperature}°C` : originCode
    const destDesc = destWeather ? `${destCode}: ${destWeather.icon} ${destWeather.temperature}°C` : destCode
    return `✓ Route weather nominal (${originDesc} ➔ ${destDesc}).`
  }

  async function handleAnalyze() {
    if (!selectedFlight) {
      setError('Please select a flight first.')
      return
    }

    setLoadingAnalysis(true)
    setError('')
    setAnalysis(null)

    try {
      const result = await analyzeFlight({
        flight_id: selectedFlight.flight_id,
        origin: selectedFlight.origin,
        destination: selectedFlight.destination,
        scheduled_departure: selectedFlight.scheduled_departure,
        status: selectedFlight.status,
      })

      setAnalysis(result)
    } catch (err) {
      setError(err.message || 'Flight analysis failed.')
    } finally {
      setLoadingAnalysis(false)
    }
  }

  function scrollToSection(event, sectionId) {
    event.preventDefault()
    setActiveSection(sectionId)
    setMenuOpen(false)
    document.getElementById(sectionId)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  const riskClass = {
    low: 'risk-low',
    medium: 'risk-medium',
    high: 'risk-high',
    unknown: 'risk-unknown',
  }[(analysis?.risk_level || 'unknown').toLowerCase()] || 'risk-unknown'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* FE-1: Mandatory Top Advisory Banner */}
      <AdvisoryBanner />

      <div className="app-shell" style={{ flex: 1 }}>
        {/* FE-1: Responsive Command Sidebar */}
        <Sidebar
          menuOpen={menuOpen}
          setMenuOpen={setMenuOpen}
          activeSection={activeSection}
          onNavigate={scrollToSection}
          userRole={userRole}
          setUserRole={setUserRole}
        />

        <main className="main-content">
          {/* FE-1: Command Center Top Navigation */}
          <TopNav
            selectedAirport={selectedAirport}
            onSelectAirport={setSelectedAirport}
            airports={weatherList.length > 0 ? weatherList : DEFAULT_AIRPORTS}
            weatherSource={weatherSource}
            backendConnected={backendConnected}
            userRole={userRole}
            highAlertsCount={weatherAlerts.filter((a) => a.severity === 'High').length}
          />

          {/* Operational Welcome & Active Hub Banner */}
          <section className="welcome" id="overview">
            <div>
              <p className="eyebrow">AIRPORT OPERATIONS COORDINATION ENGINE</p>
              <h1>Operations Command Center</h1>
              <p className="welcome-text">
                Multi-agent decision support, live weather monitoring, and BTS predictive delay analytics.
              </p>
            </div>

            <div className="flight-badge">
              <span>✈</span>
              <div>
                <small>Selected Flight</small>
                <strong>{selectedFlightId || 'No flight selected'}</strong>
              </div>
            </div>
          </section>

          {/* FE-3: Command Center Operational Metrics */}
          <OperationalMetrics
            flights={flights}
            alerts={weatherAlerts}
            pendingDecisionsCount={analysis?.human_approval_required ? 1 : 0}
            activeAirport={selectedAirport}
          />

          {/* FE-3: Delay Risk Analytics Charts */}
          <DelayRiskChart flights={flights} />

          {/* Weather Summary Bar */}
          <AirportWeatherSummary
            weather={weatherList}
            alerts={weatherAlerts}
            loading={weatherLoading}
            onRefresh={handleRefreshWeather}
            lastUpdated={weatherLastUpdated}
            dataSource={weatherSource}
          />

          {flightError && (
            <div className="api-error" role="alert">
              <strong>Notice:</strong>
              <p>{flightError}</p>
              <button onClick={() => window.location.reload()}>
                Retry connection
              </button>
            </div>
          )}

          {/* FE-3: Comprehensive Flight Operations & Delay Risk Table */}
          <FlightStatusTable
            flights={flights}
            selectedFlightId={selectedFlightId}
            onSelectFlight={handleSelectFlightFromTable}
            activeAirport={selectedAirport}
          />

          {/* FE-7: Predictive Delay & Risk Scoring Panel */}
          <DelayPredictionPanel
            flights={flights}
            selectedFlightId={selectedFlightId}
            onSelectFlight={setSelectedFlightId}
            activeWeather={weatherList.find((w) => w.shortName === selectedAirport)}
          />

          {/* FE-6: Recharts Delay Analytics & Risk Distribution */}
          <DelayAnalyticsSection
            flights={flights}
            onSelectFlight={handleSelectFlightFromTable}
          />

          {/* Weather Monitoring Panel & Operational Alerts */}
          <section className="panel" id="weather">
            <WeatherPanel
              weather={weatherList}
              loading={weatherLoading}
              error={weatherError}
              onRefresh={handleRefreshWeather}
              dataSource={weatherSource}
            />
            <WeatherAlertList
              alerts={weatherAlerts}
            />
          </section>

          {/* Flight Research Panel (Preserves Existing Research API) */}
          <section className="flight-selector-panel panel" id="research">
            <div className="section-heading">
              <div>
                <h2>AI Flight Research Agent</h2>
                <p>Select a flight to evaluate real-time weather and operational impact via Gemini API.</p>
              </div>
              <span className="demo-tag">LIVE RESEARCH API</span>
            </div>

            <label className="field-label" htmlFor="flight-select">
              Select Flight to Analyze
            </label>

            <select
              id="flight-select"
              className="flight-select"
              value={selectedFlightId}
              onChange={(event) => {
                setSelectedFlightId(event.target.value)
                setAnalysis(null)
                setError('')
              }}
              disabled={loadingFlights || flights.length === 0}
            >
              {loadingFlights && <option value="">Loading flights...</option>}
              {!loadingFlights && flights.length === 0 && (
                <option value="">No flights available</option>
              )}
              {flights.map((flight) => (
                <option key={flight.flight_id} value={flight.flight_id}>
                  {flight.flight_id} — {flight.origin} to {flight.destination} ({flight.status})
                </option>
              ))}
            </select>

            {selectedFlight && (
              <div className="flight-details">
                <div>
                  <small>Origin</small>
                  <strong>{selectedFlight.origin}</strong>
                </div>
                <div>
                  <small>Destination</small>
                  <strong>{selectedFlight.destination}</strong>
                </div>
                <div>
                  <small>Scheduled Departure</small>
                  <strong>{selectedFlight.scheduled_departure}</strong>
                </div>
                <div>
                  <small>Flight Status</small>
                  <strong>{selectedFlight.status}</strong>
                </div>

                {/* Connected Route Weather Context */}
                <div style={{ gridColumn: '1 / -1', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 12px' }}>
                  <small style={{ color: '#2563eb', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Live Route Weather Context
                  </small>
                  <div style={{ marginTop: '4px', fontSize: '12px', color: '#1e293b', fontWeight: 600 }}>
                    {getFlightWeatherContext(selectedFlight)}
                  </div>
                </div>
              </div>
            )}

            <button
              className="analyze-button"
              onClick={handleAnalyze}
              disabled={!selectedFlight || loadingFlights || loadingAnalysis}
            >
              {loadingAnalysis ? 'Analyzing flight...' : '✦ Analyze Flight with Research Agent'}
            </button>

            {loadingAnalysis && (
              <p className="loading-message" role="status">
                The Research Agent is querying Gemini and flight status. This may take a little while.
              </p>
            )}
          </section>

          {/* Multi-Agent Workflow State */}
          <section className="stats-grid">
            <div className="stat-card">
              <span className="stat-icon blue-bg">◈</span>
              <p>Total Agents</p>
              <h2>05</h2>
              <small>Planned workflow stages</small>
            </div>

            <div className="stat-card">
              <span className="stat-icon green-bg">✓</span>
              <p>Research Agent</p>
              <h2>Ready</h2>
              <small>API endpoint available</small>
            </div>

            <div className="stat-card">
              <span className="stat-icon amber-bg">◷</span>
              <p>Analysis Status</p>
              <h2>
                {loadingAnalysis
                  ? 'Running'
                  : error
                    ? 'Error'
                    : analysis
                      ? 'Completed'
                      : 'Ready'}
              </h2>
              <small>Current browser session</small>
            </div>

            <div className="stat-card">
              <span className="stat-icon purple-bg">◇</span>
              <p>Human Review</p>
              <h2>{analysis?.human_approval_required ? 'Required' : 'Pending'}</h2>
              <small>Review before action</small>
            </div>
          </section>

          {/* FE-4: AI Multi-Agent Orchestration & Activity Timeline */}
          <AgentActivityTimeline />

          {/* Activity Log */}
          <section className="panel" id="activity">
            <div className="section-heading">
              <div>
                <h2>Agent Activity Log</h2>
                <p>Current session and audit events</p>
              </div>
              <span className="demo-tag">SESSION STATUS</span>
            </div>

            <div className="activity-list">
              <div className="activity-row">
                <div className="activity-marker" />
                <div className="activity-info">
                  <strong>Flight Operations Data Stream</strong>
                  <p>
                    {loadingFlights
                      ? 'Loading flight records...'
                      : `Active stream with ${flights.length} monitored flights (${backendConnected ? 'Live Backend API' : 'Calibrated PRD Data'}).`}
                  </p>
                </div>
                <div className="activity-meta">
                  <small>{loadingFlights ? 'Loading' : 'Ready'}</small>
                </div>
              </div>

              <div className="activity-row">
                <div className="activity-marker" />
                <div className="activity-info">
                  <strong>Research Agent</strong>
                  <p>
                    {loadingAnalysis
                      ? `Analyzing ${selectedFlightId}...`
                      : analysis
                        ? `Analysis returned for ${analysis.flight_id}.`
                        : 'Waiting for flight analysis trigger.'}
                  </p>
                </div>
                <div className="activity-meta">
                  <small>
                    {loadingAnalysis ? 'Running' : analysis ? 'Completed' : 'Idle'}
                  </small>
                </div>
              </div>
            </div>
          </section>

          {/* Decision Support & Human Review */}
          <section className="decision-grid" id="decisions">
            <div className="panel">
              <div className="section-heading">
                <div>
                  <h2>Decision Support Findings</h2>
                  <p>AI Agent risk assessment & recommendations</p>
                </div>
                {analysis && (
                  <span className="demo-tag">ANALYSIS RECEIVED</span>
                )}
              </div>

              {error && (
                <div className="api-error" role="alert">
                  <strong>Analysis Notice</strong>
                  <p>{error}</p>
                  <small>
                    Check Python backend terminal and Gemini API key availability.
                  </small>
                </div>
              )}

              {!analysis && !error && !loadingAnalysis && (
                <div className="empty-state">
                  <div className="empty-icon">◇</div>
                  <h3>No analysis loaded</h3>
                  <p>
                    Select a flight from the operations table and click "Analyze Flight" to view the Research Agent's assessment.
                  </p>
                </div>
              )}

              {analysis && (
                <div className="analysis-result">
                  <div className="analysis-field">
                    <small>Flight ID</small>
                    <strong>{analysis.flight_id}</strong>
                  </div>

                  <div className="analysis-field">
                    <small>Observed Status</small>
                    <strong>{analysis.observed_status}</strong>
                  </div>

                  <div className="analysis-field">
                    <small>Risk Level</small>
                    <span className={`risk-badge ${riskClass}`}>
                      {analysis.risk_level}
                    </span>
                  </div>

                  <div className="analysis-field">
                    <small>Reason</small>
                    <p>{analysis.reason}</p>
                  </div>

                  <div className="analysis-field">
                    <small>Recommended Action</small>
                    <p>{analysis.recommended_action}</p>
                  </div>

                  <div className="analysis-field">
                    <small>Missing Information</small>
                    {analysis.missing_information?.length > 0 ? (
                      <ul>
                        {analysis.missing_information.map((item, index) => (
                          <li key={`${item}-${index}`}>{item}</li>
                        ))}
                      </ul>
                    ) : (
                      <p>No missing information reported.</p>
                    )}
                  </div>

                  <div className="approval-notice">
                    <strong>
                      {analysis.human_approval_required
                        ? 'Human approval required'
                        : 'No approval requirement reported'}
                    </strong>
                    <p>
                      Review the recommendations before issuing any operational dispatch.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="panel">
              <div className="section-heading">
                <div>
                  <h2>Duty Officer Approval Panel</h2>
                  <p>Role: {userRole}</p>
                </div>
              </div>

              <div className="review-box">
                <span className="review-badge">
                  {userRole === 'Duty officer' ? 'Action Authorized' : 'Read-Only Mode'}
                </span>
                <p>
                  Every AI decision remains pending until a certified Duty Officer approves or rejects the recommendation.
                </p>
                <button
                  disabled={userRole !== 'Duty officer' || !analysis}
                  onClick={() => alert(`Recommendation approved for ${selectedFlightId}. Result logged to audit trail.`)}
                >
                  Approve Recommendation
                </button>
                <button
                  className="reject-button"
                  disabled={userRole !== 'Duty officer' || !analysis}
                  onClick={() => alert(`Recommendation rejected for ${selectedFlightId}. Result logged to audit trail.`)}
                >
                  Reject Recommendation
                </button>
                <small>
                  {userRole !== 'Duty officer'
                    ? 'Only a Duty officer can approve or reject recommendations (PRD A4).'
                    : analysis
                      ? 'Decision will be written to the append-only audit log.'
                      : 'Waiting for an active flight analysis.'}
                </small>
              </div>
            </div>
          </section>

          <footer className="page-footer">
            Airport Operations Coordination Engine · PRD v1.0 · Developed as part of Infosys Springboard Internship 7.0
          </footer>
        </main>
      </div>
    </div>
  )
}

export default App
