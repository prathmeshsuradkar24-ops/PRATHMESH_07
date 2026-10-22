import {
  LayoutDashboard,
  Plane,
  CloudRain,
  Cpu,
  Compass,
  FileCheck2,
  Activity,
  X,
  Menu,
  ShieldCheck,
  Sparkles,
  BarChart3,
} from 'lucide-react'

export default function Sidebar({
  menuOpen,
  setMenuOpen,
  activeSection,
  onNavigate,
  userRole = 'Duty officer',
  setUserRole,
}) {
  const navItems = [
    { id: 'overview', label: 'Command Center', icon: LayoutDashboard },
    { id: 'flights', label: 'Flight Operations', icon: Plane },
    { id: 'prediction', label: 'Delay Prediction (ML)', icon: Sparkles },
    { id: 'analytics', label: 'Delay Analytics', icon: BarChart3 },
    { id: 'weather', label: 'Weather & Disruptions', icon: CloudRain },
    { id: 'research', label: 'Flight Research', icon: Compass },
    { id: 'agents', label: 'AI Agent Monitoring', icon: Cpu },
    { id: 'decisions', label: 'Decision Support', icon: FileCheck2 },
    { id: 'activity', label: 'Activity Log', icon: Activity },
  ]

  return (
    <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
      <div className="brand">
        <div className="brand-icon">✈</div>
        <div>
          <h2>AirportOps</h2>
          <p>Coordination Engine</p>
        </div>

        <button
          className="menu-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <p className="nav-label">COMMAND & CONTROL</p>

      <nav className="navigation">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeSection === item.id

          return (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={isActive ? 'active' : ''}
              onClick={(e) => onNavigate(e, item.id)}
            >
              <Icon size={16} />
              <span>{item.label}</span>
            </a>
          )
        })}
      </nav>

      {/* Role Indicator / Switcher in Sidebar */}
      <div style={{ marginTop: '20px', padding: '12px', background: 'rgba(255,255,255,0.06)', borderRadius: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#93a5c1', marginBottom: '6px' }}>
          <ShieldCheck size={14} color="#60a5fa" />
          <span>Active Role (PRD A4)</span>
        </div>
        <select
          value={userRole}
          onChange={(e) => setUserRole(e.target.value)}
          style={{
            width: '100%',
            padding: '6px 8px',
            background: '#1a2b47',
            color: '#ffffff',
            border: '1px solid #33496c',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 600,
          }}
          aria-label="Switch User Persona Role"
        >
          <option value="Duty officer">Duty officer (Approver)</option>
          <option value="Analyst">Analyst</option>
          <option value="Manager">Manager</option>
          <option value="Admin">Admin</option>
          <option value="Ground staff">Ground staff</option>
        </select>
      </div>

      <div className="sidebar-footer">
        <span className="online-dot" />
        Operational Dashboard · PRD v1.0
      </div>
    </aside>
  )
}
