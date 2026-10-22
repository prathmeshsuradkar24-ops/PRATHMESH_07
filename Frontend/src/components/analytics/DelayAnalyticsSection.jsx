import { useState, useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  AreaChart,
  Area,
  PieChart,
  Pie,
} from 'recharts'
import { BarChart3, TrendingUp, PieChart as PieIcon, ShieldAlert } from 'lucide-react'
import './Analytics.css'

// 1. BTS Standard Delay Cause Breakdown (2023 Training Data)
const BTS_CAUSE_DATA = [
  { name: 'Weather / Squall Line', value: 42, color: '#ef4444' },
  { name: 'National Airspace (NAS)', value: 26, color: '#f59e0b' },
  { name: 'Air Carrier Operations', value: 18, color: '#3b82f6' },
  { name: 'Late Aircraft Turnaround', value: 14, color: '#8b5cf6' },
]

// 2. Hourly Delay & Congestion Trend (Chicago Local Time)
const HOURLY_TREND_DATA = [
  { hour: '12:00', avgDelay: 8, probability: 18, flights: 12 },
  { hour: '13:00', avgDelay: 11, probability: 22, flights: 15 },
  { hour: '14:00', avgDelay: 14, probability: 28, flights: 18 },
  { hour: '15:00', avgDelay: 19, probability: 35, flights: 22 },
  { hour: '16:00', avgDelay: 28, probability: 48, flights: 26 },
  { hour: '17:00', avgDelay: 48, probability: 78, flights: 32 }, // Peak Storm Disruption
  { hour: '18:00', avgDelay: 44, probability: 72, flights: 29 },
  { hour: '19:00', avgDelay: 32, probability: 54, flights: 24 },
  { hour: '20:00', avgDelay: 21, probability: 38, flights: 20 },
  { hour: '21:00', avgDelay: 15, probability: 25, flights: 16 },
]

// 3. Route Delay Ranking
const ROUTE_RANKING_DATA = [
  { route: 'ORD ➔ DFW', delay: 52, probability: 78, risk: 'High' },
  { route: 'ORD ➔ LAX', delay: 44, probability: 71, risk: 'High' },
  { route: 'ORD ➔ DEN', delay: 38, probability: 64, risk: 'High' },
  { route: 'ORD ➔ ATL', delay: 24, probability: 47, risk: 'Medium' },
  { route: 'ORD ➔ SEA', delay: 17, probability: 39, risk: 'Medium' },
  { route: 'ORD ➔ BOS', delay: 9, probability: 22, risk: 'Low' },
]

function getRouteColor(risk) {
  if (risk === 'High') return '#ef4444'
  if (risk === 'Medium') return '#f59e0b'
  return '#10b981'
}

function CauseTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #cbd5e1',
          borderRadius: '8px',
          padding: '8px 12px',
          fontSize: '11px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        }}
      >
        <div style={{ fontWeight: 700, color: '#0f172a' }}>{data.name}</div>
        <div style={{ color: '#64748b', marginTop: '2px' }}>
          Contribution Share: <strong>{data.value}%</strong>
        </div>
      </div>
    )
  }
  return null
}

function HourlyTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #cbd5e1',
          borderRadius: '8px',
          padding: '8px 12px',
          fontSize: '11px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        }}
      >
        <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '2px' }}>
          Local Time: {data.hour}
        </div>
        <div style={{ color: '#dc2626' }}>
          Avg Expected Delay: <strong>{data.avgDelay} min</strong> <span className="est-tag">Estimate</span>
        </div>
        <div style={{ color: '#2563eb' }}>
          Disruption Probability: <strong>{data.probability}%</strong>
        </div>
        <div style={{ color: '#64748b' }}>Operations Volume: {data.flights} flights/hr</div>
      </div>
    )
  }
  return null
}

function RouteTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #cbd5e1',
          borderRadius: '8px',
          padding: '8px 12px',
          fontSize: '11px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        }}
      >
        <div style={{ fontWeight: 800, color: '#0f172a' }}>{data.route}</div>
        <div style={{ color: '#dc2626', marginTop: '2px' }}>
          Expected Delay: <strong>{data.delay} min</strong> <span className="est-tag">Estimate</span>
        </div>
        <div style={{ color: '#2563eb' }}>
          Delay Probability: <strong>{data.probability}%</strong> <span className="est-tag">Estimate</span>
        </div>
        <div style={{ color: getRouteColor(data.risk), fontWeight: 700, marginTop: '2px' }}>
          Risk Assessment: {data.risk}
        </div>
      </div>
    )
  }
  return null
}

export default function DelayAnalyticsSection({ flights = [], onSelectFlight }) {
  const [activeTab, setActiveTab] = useState('hub') // 'hub' or 'flights'

  // Format active flights for dynamic Recharts visualization
  const activeFlightsData = useMemo(() => {
    return flights.slice(0, 10).map((f) => ({
      name: f.flight_id,
      route: `${f.origin}➔${f.destination}`,
      delay: f.expected_delay_minutes || 0,
      probability: Math.round((f.delay_probability || 0) * 100),
      risk: f.risk_level || 'Low',
    }))
  }, [flights])

  return (
    <div className="analytics-section-root" id="analytics">
      <div className="section-heading" style={{ marginBottom: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <BarChart3 size={20} color="#2563eb" />
            <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>
              Delay Analytics & Risk Distribution
            </h3>
            <span className="demo-tag">FE-6 RECHARTS VISUALIZATION</span>
            <span className="source-tag synthetic">
              <span className="source-dot" />
              Demo Mode: BTS 2023 Baseline
            </span>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
            Historical 2023 BTS delay causes, hourly traffic curves, and route-level severity comparison.
          </p>
        </div>

        {/* Analytics View Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setActiveTab('hub')}
            style={{
              padding: '6px 12px',
              fontSize: '11px',
              fontWeight: 700,
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              background: activeTab === 'hub' ? '#2563eb' : '#ffffff',
              color: activeTab === 'hub' ? '#ffffff' : '#475569',
              cursor: 'pointer',
            }}
          >
            Hub Aggregate (ORD)
          </button>
          <button
            onClick={() => setActiveTab('flights')}
            style={{
              padding: '6px 12px',
              fontSize: '11px',
              fontWeight: 700,
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              background: activeTab === 'flights' ? '#2563eb' : '#ffffff',
              color: activeTab === 'flights' ? '#ffffff' : '#475569',
              cursor: 'pointer',
            }}
          >
            Active Monitored Flights ({flights.length})
          </button>
        </div>
      </div>

      {activeTab === 'hub' ? (
        <div className="analytics-grid-two">
          {/* Chart 1: Hourly Disruption & Delay Curve */}
          <div className="chart-card-box">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <TrendingUp size={16} color="#2563eb" />
              <h4 className="chart-card-title">Hourly Delay & Congestion Curve (ORD)</h4>
              <span className="est-tag">Estimate</span>
            </div>
            <p className="chart-card-subtitle">
              Expected delay minutes across airport departure banks <span className="est-tag">Estimate</span>
            </p>

            <div style={{ width: '100%', height: 210 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={HOURLY_TREND_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="delayGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} unit="m" />
                  <Tooltip content={<HourlyTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="avgDelay"
                    stroke="#ef4444"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#delayGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Route Delay Severity Ranking */}
          <div className="chart-card-box">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <BarChart3 size={16} color="#059669" />
              <h4 className="chart-card-title">Route Delay Severity Comparison</h4>
              <span className="est-tag">Estimate</span>
            </div>
            <p className="chart-card-subtitle">
              Expected delay minutes by flight corridor <span className="est-tag">Estimate</span>
            </p>

            <div style={{ width: '100%', height: 210 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ROUTE_RANKING_DATA} layout="vertical" margin={{ top: 5, right: 30, left: 30, bottom: 0 }}>
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} unit="m" />
                  <YAxis dataKey="route" type="category" tick={{ fontSize: 10, fill: '#334155', fontWeight: 600 }} />
                  <Tooltip content={<RouteTooltip />} />
                  <Bar dataKey="delay" radius={[0, 4, 4, 0]}>
                    {ROUTE_RANKING_DATA.map((entry, index) => (
                      <Cell key={`route-${index}`} fill={getRouteColor(entry.risk)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 3: BTS Delay Cause Breakdown */}
          <div className="chart-card-box" style={{ gridColumn: '1 / -1' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <PieIcon size={16} color="#7c3aed" />
                <h4 className="chart-card-title">BTS Primary Delay Cause Attribution</h4>
                <span className="est-tag">Estimate</span>
              </div>
              <span style={{ fontSize: '11px', color: '#64748b' }}>
                Calibrated from 2023 US BTS Training Set (Section ML-7)
              </span>
            </div>
            <p className="chart-card-subtitle">
              Categorization of airport operational delay root causes during weather and slot constraints
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
              <div style={{ width: 180, height: 160 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={BTS_CAUSE_DATA}
                      cx="50%"
                      cy="50%"
                      innerRadius={35}
                      outerRadius={65}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {BTS_CAUSE_DATA.map((entry, index) => (
                        <Cell key={`cause-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CauseTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div style={{ flex: 1, minWidth: '240px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                {BTS_CAUSE_DATA.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderLeft: `4px solid ${item.color}`,
                    }}
                  >
                    <div style={{ fontSize: '11px', fontWeight: 600, color: '#334155' }}>{item.name}</div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                      {item.value}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Dynamic Active Flights Manifest Risk Profile */
        <div className="chart-card-box" style={{ marginTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <h4 className="chart-card-title">
                Active Flights Delay Profile (Expected Delay vs Probability)
                <span className="est-tag">Estimate</span>
              </h4>
              <p className="chart-card-subtitle">
                Click any bar to select the flight and populate AI research & ML prediction panels.
              </p>
            </div>
            <span style={{ fontSize: '11px', color: '#64748b' }}>
              Showing {activeFlightsData.length} monitored operations
            </span>
          </div>

          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={activeFlightsData}
                margin={{ top: 15, right: 20, left: -10, bottom: 25 }}
                onClick={(e) => {
                  if (e && e.activePayload && e.activePayload[0] && onSelectFlight) {
                    onSelectFlight(e.activePayload[0].payload.name)
                  }
                }}
              >
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  angle={-15}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} unit="m" />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload
                      return (
                        <div
                          style={{
                            background: '#ffffff',
                            border: '1px solid #cbd5e1',
                            borderRadius: '8px',
                            padding: '8px 12px',
                            fontSize: '11px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                          }}
                        >
                          <div style={{ fontWeight: 800, color: '#0f172a' }}>{d.name} ({d.route})</div>
                          <div style={{ color: '#dc2626', marginTop: '2px' }}>
                            Expected Delay: <strong>{d.delay} min</strong> <span className="est-tag">Estimate</span>
                          </div>
                          <div style={{ color: '#2563eb' }}>
                            Delay Probability: <strong>{d.probability}%</strong> <span className="est-tag">Estimate</span>
                          </div>
                          <div style={{ color: getRouteColor(d.risk), fontWeight: 700, marginTop: '2px' }}>
                            Risk Level: {d.risk}
                          </div>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Bar dataKey="delay" radius={[4, 4, 0, 0]} cursor="pointer">
                  {activeFlightsData.map((entry, index) => (
                    <Cell key={`flight-cell-${index}`} fill={getRouteColor(entry.risk)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Advisory & Limitations Disclaimer Card (FE-6 Mandatory Compliance) */}
      <div
        style={{
          marginTop: '20px',
          padding: '12px 16px',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderLeft: '4px solid #2563eb',
          borderRadius: '8px',
          fontSize: '11px',
          color: '#475569',
          lineHeight: 1.5,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#1e3a8a', marginBottom: '4px' }}>
          <ShieldAlert size={14} color="#2563eb" />
          <span>Operational Advisory & Limitations Notice (PRD Section A7):</span>
        </div>
        <p style={{ margin: '0 0 4px' }}>
          <strong>Advisory-Only:</strong> Visualizations depict statistical model estimates trained on 2023 US BTS data and forecast weather parameters. All values carry the <span className="est-tag">Estimate</span> label and do not constitute official air traffic control clearances or FAA ground delay program notices.
        </p>
        <p style={{ margin: 0, fontSize: '10.5px', color: '#64748b' }}>
          <strong>Limitations:</strong> Convective squalls, ground stop orders, and equipment outages may cause actual operations to deviate significantly from statistical baselines.
        </p>
      </div>
    </div>
  )
}
