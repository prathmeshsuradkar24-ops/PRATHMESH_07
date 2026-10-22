import { useState, useMemo } from 'react'
import { Search, Filter, Compass } from 'lucide-react'
import '../dashboard/Dashboard.css'

export default function FlightStatusTable({
  flights = [],
  selectedFlightId,
  onSelectFlight,
  activeAirport = 'ORD',
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRisk, setSelectedRisk] = useState('All')
  const [selectedStatus, setSelectedStatus] = useState('All')

  const filteredFlights = useMemo(() => {
    return flights.filter((flight) => {
      const q = searchTerm.toLowerCase().trim()
      const matchesSearch =
        !q ||
        flight.flight_id.toLowerCase().includes(q) ||
        flight.origin.toLowerCase().includes(q) ||
        flight.destination.toLowerCase().includes(q) ||
        flight.aircraft?.toLowerCase().includes(q)

      const matchesRisk = selectedRisk === 'All' || flight.risk_level === selectedRisk
      const matchesStatus =
        selectedStatus === 'All' ||
        flight.status.toLowerCase().replace('-', ' ') === selectedStatus.toLowerCase()

      return matchesSearch && matchesRisk && matchesStatus
    })
  }, [flights, searchTerm, selectedRisk, selectedStatus])

  return (
    <div className="flight-table-panel" id="flights">
      <div className="flight-table-header">
        <div>
          <h3 style={{ margin: '0 0 4px', fontSize: '18px', color: '#0f172a' }}>
            Flight Operations & Delay Risk
          </h3>
          <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
            Active flights connected to hub {activeAirport}. Select any flight to request AI research analysis.
          </p>
        </div>

        {/* Search & Filter Controls */}
        <div className="flight-filter-controls">
          <div style={{ position: 'relative' }}>
            <Search
              size={14}
              color="#94a3b8"
              style={{ position: 'absolute', left: '10px', top: '10px' }}
            />
            <input
              type="text"
              className="flight-search-input"
              placeholder="Search flight, route, aircraft..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '32px' }}
              aria-label="Search flight records"
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={14} color="#64748b" />
            <select
              className="flight-filter-select"
              value={selectedRisk}
              onChange={(e) => setSelectedRisk(e.target.value)}
              aria-label="Filter by Risk Level"
            >
              <option value="All">All Risk Levels</option>
              <option value="High">High Risk</option>
              <option value="Medium">Medium Risk</option>
              <option value="Low">Low Risk</option>
            </select>
          </div>

          <select
            className="flight-filter-select"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            aria-label="Filter by Status"
          >
            <option value="All">All Statuses</option>
            <option value="Delayed">Delayed</option>
            <option value="Boarding">Boarding</option>
            <option value="On Schedule">On Schedule</option>
            <option value="In Flight">In Flight</option>
            <option value="Scheduled">Scheduled</option>
          </select>
        </div>
      </div>

      {/* Responsive Table */}
      <div className="table-responsive-wrapper">
        <table className="cmd-flights-table">
          <thead>
            <tr>
              <th>Flight</th>
              <th>Route</th>
              <th>Scheduled</th>
              <th>Delay Probability</th>
              <th>Expected Delay</th>
              <th>Risk Level</th>
              <th>Status</th>
              <th>Data Source</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredFlights.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                  No flight records match your filter criteria.
                </td>
              </tr>
            ) : (
              filteredFlights.map((flight) => {
                const isSelected = flight.flight_id === selectedFlightId
                const delayPercent = Math.round((flight.delay_probability || 0) * 100)
                const isSynthetic = flight.is_synthetic || flight.source?.toLowerCase().includes('synthetic')

                return (
                  <tr
                    key={flight.flight_id}
                    className={isSelected ? 'selected-row' : ''}
                  >
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <strong style={{ color: '#0f172a', fontSize: '13px' }}>
                          {flight.flight_id}
                        </strong>
                        {flight.aircraft && (
                          <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                            {flight.aircraft}
                          </span>
                        )}
                      </div>
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: 700, color: '#1e293b' }}>{flight.origin}</span>
                        <span style={{ color: '#94a3b8', fontSize: '11px' }}>➔</span>
                        <span style={{ fontWeight: 700, color: '#1e293b' }}>{flight.destination}</span>
                      </div>
                    </td>

                    <td>
                      <span style={{ color: '#334155', fontWeight: 500 }}>
                        {flight.scheduled_departure}
                      </span>
                    </td>

                    <td>
                      <span style={{ fontWeight: 700, color: '#0f172a' }}>
                        {delayPercent}%
                      </span>
                      <span className="est-tag">Estimate</span>
                    </td>

                    <td>
                      <span style={{ fontWeight: 700, color: '#0f172a' }}>
                        {flight.expected_delay_minutes} min
                      </span>
                      <span className="est-tag">Estimate</span>
                    </td>

                    <td>
                      <span className={`risk-pill ${flight.risk_level}`}>
                        {flight.risk_level}
                      </span>
                    </td>

                    <td>
                      <span className={`status-pill ${flight.status.replace(/\s+/g, '-')}`}>
                        {flight.status}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`source-tag ${
                          isSynthetic
                            ? 'synthetic'
                            : flight.source?.includes('Live')
                              ? 'live'
                              : 'cached'
                        }`}
                      >
                        <span className="source-dot" />
                        {isSynthetic ? 'Synthetic' : flight.source || 'Live Feed'}
                      </span>
                    </td>

                    <td>
                      <button
                        className={`select-flight-btn ${isSelected ? 'active' : ''}`}
                        onClick={() => onSelectFlight(flight.flight_id)}
                        title="Select flight for research and decision analysis"
                      >
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Compass size={12} />
                          <span>{isSelected ? 'Selected' : 'Analyze'}</span>
                        </span>
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <p style={{ marginTop: '14px', marginBottom: 0, fontSize: '11px', color: '#64748b', lineHeight: 1.6 }}>
        <strong>PRD Compliance Note:</strong> Delay values are model estimates trained on 2023 US BTS data and may be less accurate with forecast weather. Gates, staff and fallback flights are synthetic and flagged with <span className="est-tag">Estimate</span> or <span className="source-tag synthetic" style={{ display: 'inline-flex', padding: '1px 5px', fontSize: '9px' }}>Synthetic</span>.
      </p>
    </div>
  )
}
