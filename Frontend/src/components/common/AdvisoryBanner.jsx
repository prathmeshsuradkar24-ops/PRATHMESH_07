import { AlertTriangle, Info } from 'lucide-react'

export default function AdvisoryBanner() {
  return (
    <div
      style={{
        background: '#fffbeb',
        borderBottom: '1px solid #fde68a',
        color: '#92400e',
        padding: '8px 24px',
        fontSize: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px',
        zIndex: 50,
      }}
      role="banner"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <AlertTriangle size={15} color="#b45309" style={{ flexShrink: 0 }} />
        <span>
          <strong>OPERATIONAL ADVISORY NOTICE:</strong> This system is an AI Decision Support Simulation. Every output is a recommendation, not an official ATC clearance.
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#b45309' }}>
        <Info size={13} />
        <span>Delay metrics are ML estimates trained on 2023 US BTS data. Synthetic records are flagged.</span>
      </div>
    </div>
  )
}
