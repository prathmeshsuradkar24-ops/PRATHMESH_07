import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from 'recharts'
import './Dashboard.css'

function getBarColor(risk) {
  if (risk === 'High') return '#ef4444'
  if (risk === 'Medium') return '#f59e0b'
  return '#10b981'
}

function CustomTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #cbd5e1',
          borderRadius: '8px',
          padding: '10px 14px',
          boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
          fontSize: '12px',
        }}
      >
        <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>
          {data.name} ({data.route})
        </div>
        <div style={{ color: '#475569' }}>
          Delay Probability: <strong>{data.probability}%</strong> <span className="est-tag">Estimate</span>
        </div>
        <div style={{ color: '#475569', marginTop: '2px' }}>
          Expected Delay: <strong>{data.delayMins} min</strong> <span className="est-tag">Estimate</span>
        </div>
        <div style={{ marginTop: '4px', fontWeight: 700, color: getBarColor(data.risk) }}>
          Risk Level: {data.risk}
        </div>
      </div>
    )
  }
  return null
}

export default function DelayRiskChart({ flights = [] }) {
  // 1. Data for Delay Probability Bar Chart
  const chartData = flights.slice(0, 8).map((f) => ({
    name: f.flight_id,
    route: `${f.origin}➔${f.destination}`,
    probability: Math.round((f.delay_probability || 0) * 100),
    delayMins: f.expected_delay_minutes || 0,
    risk: f.risk_level || 'Low',
  }))

  // 2. Data for Risk Distribution Pie Chart
  const highCount = flights.filter((f) => f.risk_level === 'High').length
  const medCount = flights.filter((f) => f.risk_level === 'Medium').length
  const lowCount = flights.filter((f) => f.risk_level === 'Low').length

  const pieData = [
    { name: 'High Risk (>55%)', value: highCount, color: '#ef4444' },
    { name: 'Medium Risk (30-55%)', value: medCount, color: '#f59e0b' },
    { name: 'Low Risk (<30%)', value: lowCount, color: '#10b981' },
  ].filter((d) => d.value > 0)

  return (
    <div className="charts-split-grid">
      {/* Flight Delay Probability Graph */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '14px',
          padding: '20px',
          boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h4 style={{ margin: '0 0 4px', fontSize: '14px', color: '#0f172a' }}>
              Delay Probability by Flight
              <span className="est-tag">Estimate</span>
            </h4>
            <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>
              ML Model predictions (trained on 2023 BTS data)
            </p>
          </div>
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#2563eb' }}>
            Target Cutoff: 55% High
          </span>
        </div>

        <div style={{ width: '100%', height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: '#64748b' }}
                interval={0}
                angle={-20}
                textAnchor="end"
              />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} domain={[0, 100]} unit="%" />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="probability" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.risk)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Risk Level Distribution Pie / Summary */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '14px',
          padding: '20px',
          boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)',
        }}
      >
        <div style={{ marginBottom: '16px' }}>
          <h4 style={{ margin: '0 0 4px', fontSize: '14px', color: '#0f172a' }}>
            Operational Risk Breakdown
          </h4>
          <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>
            Distribution of risk across {flights.length} monitored operations
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', height: 220 }}>
          <div style={{ flex: 1, height: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`pie-cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div style={{ display: 'grid', gap: '8px', minWidth: '150px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: '#fee2e2', borderRadius: '6px', fontSize: '12px', color: '#991b1b', fontWeight: 600 }}>
              <span>High Risk</span>
              <strong>{highCount}</strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: '#fef3c7', borderRadius: '6px', fontSize: '12px', color: '#92400e', fontWeight: 600 }}>
              <span>Medium Risk</span>
              <strong>{medCount}</strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: '#dcfce7', borderRadius: '6px', fontSize: '12px', color: '#166534', fontWeight: 600 }}>
              <span>Low Risk</span>
              <strong>{lowCount}</strong>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '10px', color: '#94a3b8' }}>
              Cutoffs: Low &lt; 0.30, Med 0.30–0.55, High &gt; 0.55
            </p>
          </div>
        </div>
      </div>

      {/* Advisory & Limitations Notice */}
      <div
        style={{
          gridColumn: '1 / -1',
          padding: '8px 14px',
          background: '#fffbeb',
          border: '1px solid #fde68a',
          borderRadius: '8px',
          fontSize: '11px',
          color: '#92400e',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <span>
          <strong>Advisory-Only:</strong> Delay probability and expected delay duration are statistical model estimates trained on 2023 US BTS data. Synthetic/demo records are flagged. All estimates are advisory and not official ATC clearance.
        </span>
      </div>
    </div>
  )
}
