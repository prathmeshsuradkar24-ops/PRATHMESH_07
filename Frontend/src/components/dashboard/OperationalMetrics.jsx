import { Plane, AlertTriangle, FileCheck, CloudLightning } from 'lucide-react'
import './Dashboard.css'

export default function OperationalMetrics({
  flights = [],
  alerts = [],
  pendingDecisionsCount = 1,
  activeAirport = 'ORD',
}) {
  const totalFlights = flights.length
  const highRiskFlights = flights.filter((f) => f.risk_level === 'High').length
  const mediumRiskFlights = flights.filter((f) => f.risk_level === 'Medium').length
  const lowRiskFlights = flights.filter((f) => f.risk_level === 'Low').length

  const highAlerts = alerts.filter((a) => a.severity === 'High').length
  const activeHubAlert = alerts.find((a) => a.airportCode === activeAirport)

  return (
    <div className="command-metrics-grid">
      {/* 1. Total Flights Monitored */}
      <div className="cmd-metric-card">
        <div className="cmd-metric-info">
          <div className="cmd-metric-label">Flights Monitored</div>
          <div className="cmd-metric-value">{totalFlights}</div>
          <div className="cmd-metric-sub">
            <span>{lowRiskFlights} on-time · {mediumRiskFlights + highRiskFlights} monitored</span>
          </div>
        </div>
        <div className="cmd-icon-box blue">
          <Plane size={22} />
        </div>
      </div>

      {/* 2. High Delay Risk Flights (with Estimate tag) */}
      <div className="cmd-metric-card">
        <div className="cmd-metric-info">
          <div className="cmd-metric-label">
            High Delay Risk
            <span className="est-tag">Estimate</span>
          </div>
          <div
            className="cmd-metric-value"
            style={{ color: highRiskFlights > 0 ? '#dc2626' : '#15803d' }}
          >
            {highRiskFlights}
          </div>
          <div className="cmd-metric-sub">
            <span>
              {highRiskFlights > 0
                ? `${Math.round((highRiskFlights / (totalFlights || 1)) * 100)}% of flights exceed 30m delay`
                : 'All flights within nominal schedule'}
            </span>
          </div>
        </div>
        <div className={`cmd-icon-box ${highRiskFlights > 0 ? 'red' : 'green'}`}>
          <AlertTriangle size={22} />
        </div>
      </div>

      {/* 3. Decisions Pending Approval */}
      <div className="cmd-metric-card">
        <div className="cmd-metric-info">
          <div className="cmd-metric-label">Decisions Pending Approval</div>
          <div className="cmd-metric-value" style={{ color: '#d97706' }}>
            {pendingDecisionsCount}
          </div>
          <div className="cmd-metric-sub">
            <span>Requires Duty officer authorization</span>
          </div>
        </div>
        <div className="cmd-icon-box amber">
          <FileCheck size={22} />
        </div>
      </div>

      {/* 4. Active Weather Alert */}
      <div className="cmd-metric-card">
        <div className="cmd-metric-info">
          <div className="cmd-metric-label">Weather Disruptions</div>
          <div className="cmd-metric-value">
            {activeHubAlert ? activeHubAlert.condition.split(' ')[0] : 'Nominal'}
          </div>
          <div className="cmd-metric-sub">
            <span>
              {activeHubAlert
                ? `${activeHubAlert.severity} alert at ${activeAirport}`
                : `${alerts.length} total warnings across hubs`}
            </span>
          </div>
        </div>
        <div className={`cmd-icon-box ${highAlerts > 0 ? 'red' : 'blue'}`}>
          <CloudLightning size={22} />
        </div>
      </div>
    </div>
  )
}
