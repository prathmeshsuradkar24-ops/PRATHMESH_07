import { useState, useEffect } from 'react'
import {
  Cpu,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Terminal,
  Play,
  XCircle,
  AlertCircle,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react'
import { DEMO_WORKFLOWS, loadWorkflowDetails } from '../../services/workflowService'
import '../analytics/Analytics.css'

export default function AgentActivityTimeline() {
  const [selectedWorkflowId, setSelectedWorkflowId] = useState('WF-1042')
  const [workflow, setWorkflow] = useState(DEMO_WORKFLOWS[0])
  const [isDemo, setIsDemo] = useState(true)
  const [loading, setLoading] = useState(false)
  const [expandedAgent, setExpandedAgent] = useState('research')
  const [simulating, setSimulating] = useState(false)
  const [activeStepIndex, setActiveStepIndex] = useState(-1)
  const [fetchError, setFetchError] = useState('')

  useEffect(() => {
    let cancelled = false
    async function fetchWorkflow() {
      setLoading(true)
      setFetchError('')
      try {
        const res = await loadWorkflowDetails(selectedWorkflowId)
        if (!cancelled && res.workflow) {
          setWorkflow(res.workflow)
          setIsDemo(res.is_demo ?? true)
          // Default expand the first agent with tools or error
          const firstWithTools = res.workflow.agents?.find((a) => a.status === 'Error' || a.toolsCalled?.length > 0)
          if (firstWithTools) {
            setExpandedAgent(firstWithTools.id)
          }
        }
      } catch (err) {
        if (!cancelled) {
          setFetchError(err.message || 'Failed to load workflow state.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchWorkflow()
    return () => {
      cancelled = true
    }
  }, [selectedWorkflowId])

  // Step-by-step interactive workflow simulation
  function handleSimulateRun() {
    setSimulating(true)
    setActiveStepIndex(0)

    const stepInterval = setInterval(() => {
      setActiveStepIndex((prev) => {
        if (prev >= 3) {
          clearInterval(stepInterval)
          setSimulating(false)
          return -1
        }
        return prev + 1
      })
    }, 700)
  }

  const agentsList = workflow?.agents || []
  const isWorkflowError =
    workflow?.status?.toLowerCase().includes('failed') ||
    workflow?.status?.toLowerCase().includes('error') ||
    Boolean(workflow?.errorMessage)

  function getStatusBadgeClass(status = '') {
    const s = String(status).toLowerCase()
    if (s.includes('completed')) return 'Completed'
    if (s.includes('running')) return 'Running'
    if (s.includes('pending')) return 'Pending'
    if (s.includes('fail') || s.includes('error')) return 'Failed'
    if (s.includes('warn')) return 'Warning'
    if (s.includes('block')) return 'Blocked'
    return 'Pending'
  }

  return (
    <div className="panel" id="agents">
      {/* Workflow Control Bar */}
      <div className="workflow-control-bar">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <Cpu size={20} color="#2563eb" />
            <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>
              Multi-Agent Orchestration & Activity Timeline
            </h3>
            <span className="demo-tag">FE-4 LANGGRAPH WORKFLOW</span>
            {isDemo && (
              <span className="source-tag synthetic">
                <span className="source-dot" />
                Demo Mode: Calibrated Mock
              </span>
            )}
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
            LangGraph pipeline: Research ➔ Analysis ➔ Resource ➔ Decision Agents with real-time tool logs & error states.
          </p>
        </div>

        {/* Workflow Switcher & Trigger */}
        <div className="workflow-selector-group">
          <label htmlFor="workflow-select" style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>
            Scenario:
          </label>
          <select
            id="workflow-select"
            value={selectedWorkflowId}
            onChange={(e) => setSelectedWorkflowId(e.target.value)}
          >
            {DEMO_WORKFLOWS.map((w) => (
              <option key={w.id} value={w.id}>
                {w.id} — {w.name} ({w.status})
              </option>
            ))}
          </select>

          <button
            onClick={handleSimulateRun}
            disabled={simulating || loading}
            className="weather-refresh-btn"
            style={{ padding: '7px 12px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            {simulating ? (
              <>
                <RefreshCw size={12} className="spin-icon" />
                <span>Simulating Step 0{activeStepIndex + 1}...</span>
              </>
            ) : (
              <>
                <Play size={12} />
                <span>Re-run Workflow</span>
              </>
            )}
          </button>
        </div>
      </div>

      {fetchError && (
        <div className="workflow-error-banner">
          <AlertCircle size={16} color="#dc2626" />
          <span>{fetchError} (Showing cached workflow snapshot)</span>
        </div>
      )}

      {/* Critical Workflow Fault Alert Banner if workflow in Error State */}
      {isWorkflowError && (
        <div className="workflow-error-banner">
          <XCircle size={18} color="#dc2626" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <strong style={{ fontSize: '13px' }}>Workflow Disruption Interrupted (Fault State Detected)</strong>
            <p style={{ margin: '2px 0 0', fontSize: '12px' }}>
              {workflow.errorMessage || 'One or more downstream agents encountered a critical failure. Automated mitigation halted.'}
            </p>
          </div>
          <span style={{ fontSize: '10px', fontWeight: 800, background: '#fee2e2', color: '#b91c1c', padding: '2px 8px', borderRadius: '4px' }}>
            HUMAN INTERVENTION REQUIRED
          </span>
        </div>
      )}

      {/* Workflow Summary Header Card */}
      <div
        style={{
          background: isWorkflowError ? '#fef2f2' : '#f8fafc',
          border: `1px solid ${isWorkflowError ? '#fca5a5' : '#e2e8f0'}`,
          borderRadius: '10px',
          padding: '14px 18px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
            <strong style={{ fontSize: '14px', color: '#0f172a' }}>{workflow.name}</strong>
            <span
              className={`stage-status-badge ${getStatusBadgeClass(workflow.status)}`}
            >
              {workflow.status}
            </span>
            <span style={{ fontSize: '11px', color: '#64748b' }}>
              Trigger: <em>{workflow.trigger}</em>
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '12px', color: '#475569' }}>
            {workflow.summary}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '11px', color: '#64748b', flexWrap: 'wrap' }}>
          <span>📍 Hub: <strong>{workflow.airport}</strong></span>
          <span>⏱ Started: <strong>{workflow.startedAt}</strong></span>
          <span>✈ Monitored: <strong>{workflow.affectedFlights?.join(', ') || 'None'}</strong></span>
        </div>
      </div>

      {/* 4-Agent Interactive Timeline (FE-4) */}
      <div className="agent-timeline-grid">
        {agentsList.map((agent, index) => {
          const isExpanded = expandedAgent === agent.id
          const isSimulatingActive = simulating && activeStepIndex === index
          const hasError =
            agent.status === 'Error' ||
            agent.status === 'Failed' ||
            agent.status === 'Blocked' ||
            agent.toolsCalled?.some((t) => t.status === 'error')

          const stepNames = ['01 RESEARCH', '02 ANALYSIS', '03 RESOURCE', '04 DECISION']

          return (
            <div
              key={agent.id}
              className={`agent-stage-card ${isExpanded ? 'status-active' : ''} ${hasError ? 'status-error' : ''}`}
              style={{
                transition: 'all 0.2s ease',
                boxShadow: isSimulatingActive ? '0 0 0 2px #3b82f6, 0 8px 20px rgba(59, 130, 246, 0.15)' : undefined,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span className={`stage-step-number ${agent.id}`}>
                  {stepNames[index] || `STEP 0${index + 1}`}
                </span>
                {hasError ? (
                  <AlertTriangle size={14} color="#dc2626" />
                ) : agent.status === 'Completed' ? (
                  <CheckCircle2 size={14} color="#16a34a" />
                ) : null}
              </div>

              <div className="agent-stage-header">
                <h4>{agent.name}</h4>
                <span className={`stage-status-badge ${getStatusBadgeClass(isSimulatingActive ? 'Running' : agent.status)}`}>
                  {isSimulatingActive ? 'Running...' : agent.status}
                </span>
              </div>

              <p className="agent-role-desc">{agent.role}</p>

              {/* Agent Error Message if present */}
              {agent.error && (
                <div className="agent-error-alert">
                  <strong>Fault:</strong> {agent.error}
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '10px', color: '#64748b', margin: '10px 0 12px' }}>
                <span>Execution: {agent.durationMs}ms</span>
                <span>{agent.toolsCalled?.length || 0} tools executed</span>
              </div>

              <button
                className="tools-count-badge"
                onClick={() => setExpandedAgent(isExpanded ? null : agent.id)}
                aria-expanded={isExpanded}
              >
                <Terminal size={12} />
                <span>{isExpanded ? 'Hide Tools Log' : `Inspect Tools (${agent.toolsCalled?.length || 0})`}</span>
                {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
            </div>
          )
        })}
      </div>

      {/* Active Agent Tool Execution Drawer */}
      {expandedAgent && (
        <div className="tools-execution-list">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
            <h4 style={{ margin: 0, fontSize: '13px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Terminal size={14} color="#0284c7" />
              <span>
                Tool Execution Log: {agentsList.find((a) => a.id === expandedAgent)?.name}
              </span>
            </h4>
            <span style={{ fontSize: '11px', color: '#64748b' }}>
              PRD B4 Tool Layer with Pydantic validation, schema verification & timeout fallbacks
            </span>
          </div>

          {agentsList.find((a) => a.id === expandedAgent)?.toolsCalled?.length === 0 && (
            <p style={{ margin: 0, fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>
              No tools recorded for this agent in the selected workflow.
            </p>
          )}

          {agentsList.find((a) => a.id === expandedAgent)?.toolsCalled?.map((toolCall, idx) => {
            const isToolError = toolCall.status === 'error' || toolCall.status === 'failed'
            const isToolWarning = toolCall.status === 'warning'

            return (
              <div
                key={idx}
                className={`tool-run-item ${isToolError ? 'tool-error' : ''}`}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                    <span className="tool-name-code">{toolCall.tool}</span>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>at {toolCall.time}</span>
                    <span
                      style={{
                        fontSize: '9px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        background: isToolError
                          ? '#fee2e2'
                          : isToolWarning
                            ? '#fef3c7'
                            : '#dcfce7',
                        color: isToolError
                          ? '#b91c1c'
                          : isToolWarning
                            ? '#92400e'
                            : '#15803d',
                      }}
                    >
                      {toolCall.status}
                    </span>
                  </div>

                  <div style={{ fontSize: '11px', color: '#475569', marginBottom: '4px' }}>
                    <strong>Input Args:</strong> {JSON.stringify(toolCall.args)}
                  </div>

                  <div style={{ fontSize: '12px', color: isToolError ? '#991b1b' : '#0f172a', fontWeight: 600 }}>
                    <strong>Result:</strong> {toolCall.output}
                  </div>

                  {toolCall.error && (
                    <div className="tool-error-msg">
                      ⚠️ Exception: {toolCall.error}
                    </div>
                  )}
                </div>

                <div>
                  {isToolError ? (
                    <XCircle size={18} color="#dc2626" />
                  ) : isToolWarning ? (
                    <AlertTriangle size={18} color="#d97706" />
                  ) : (
                    <CheckCircle2 size={18} color="#16a34a" />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Recommendation Plan synthesized by Decision Agent */}
      {workflow.recommendationPlan && (
        <div style={{ background: '#f8fafc', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
            <h4 style={{ margin: 0, fontSize: '13px', color: '#1e3a8a' }}>
              Synthesized Decision Agent Directives ({workflow.id})
            </h4>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                color: isWorkflowError ? '#dc2626' : '#b45309',
                background: isWorkflowError ? '#fee2e2' : '#fef3c7',
                padding: '2px 8px',
                borderRadius: '4px',
              }}
            >
              {isWorkflowError ? 'STATUS: EXECUTION BLOCKED' : 'STATUS: PENDING DUTY OFFICER APPROVAL'}
            </span>
          </div>

          <ul style={{ margin: '0 0 10px', paddingLeft: '20px', fontSize: '12px', color: '#334155', lineHeight: 1.6 }}>
            {workflow.recommendationPlan.map((planItem, idx) => (
              <li key={idx}>
                {planItem}
              </li>
            ))}
          </ul>

          <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
            <Clock size={12} />
            <span>Root causes: {workflow.reasons?.join(' · ')}</span>
          </div>

          {/* Operational Advisory Disclaimer & Limitations */}
          <div
            style={{
              padding: '8px 12px',
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '6px',
              fontSize: '11px',
              color: '#1e40af',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <ShieldAlert size={14} color="#2563eb" style={{ flexShrink: 0 }} />
            <span>
              <strong>Advisory Only:</strong> Agent recommendations are decision-support directives. All timeframes carry the <span className="est-tag">Estimate</span> label. Final dispatch authorization must be granted by the certified Duty Officer (PRD Section A4).
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

