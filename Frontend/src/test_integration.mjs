/**
 * Automated Verification & Testing Suite
 * Module 07: API Integration & Module 08: Testing & Responsive UI
 * Owner: Prathmesh Suradkar
 */

import { calculateRiskLevel, predictFlightDelay } from './services/mlService.js'
import { loadOperationsFlights, PRD_DEMO_FLIGHTS } from './services/flightService.js'
import { loadWorkflowDetails, DEMO_WORKFLOWS } from './services/workflowService.js'
import { getWeatherDescription, getWeatherIcon, DEFAULT_AIRPORTS } from './services/weatherService.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

let passedCount = 0
let failedCount = 0

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`)
    passedCount++
  } else {
    console.error(`  ✗ FAIL: ${testName}`)
    failedCount++
  }
}

async function runTestSuite() {
  console.log('\n======================================================')
  console.log(' AIRPORT OPERATIONS PLATFORM - FRONTEND TEST SUITE')
  console.log(' Owner: Prathmesh Suradkar (API Integration & Testing)')
  console.log('======================================================\n')

  // --- TEST 1: Flight Operations API Service & Fallback Handling ---
  console.log('[TEST 1] Flight Service API & Fallback Handling')
  const flightResult = await loadOperationsFlights()
  assert(flightResult && Array.isArray(flightResult.flights), 'Returns flight list array')
  assert(flightResult.flights.length >= 6, 'Contains all monitored demo flight operations')
  const hasSyntheticFlags = flightResult.flights.some(f => f.is_synthetic !== undefined)
  assert(hasSyntheticFlags, 'Flags synthetic/cached fallback flight records per PRD A3')
  const demoFlight = flightResult.flights.find(f => f.flight_id === 'AA 2231')
  assert(demoFlight && demoFlight.origin === 'ORD' && demoFlight.risk_level === 'High', 'Flight AA 2231 matches ORD high risk manifest')

  // --- TEST 2: Weather API Integration (Open-Meteo & WMO Mapping) ---
  console.log('\n[TEST 2] Weather API Integration & WMO Codes')
  assert(DEFAULT_AIRPORTS.length === 6, 'Configured 6 primary US Hubs (ORD, ATL, DFW, DEN, JFK, LAX)')
  assert(getWeatherDescription(0) === 'Clear Sky', 'WMO code 0 translates to Clear Sky')
  assert(getWeatherDescription(95) === 'Severe Thunderstorm', 'WMO code 95 translates to Severe Thunderstorm')
  assert(getWeatherIcon(0) === '☀️', 'Clear sky icon mapped correctly')
  assert(getWeatherIcon(45) === '🌫️', 'Fog/low visibility icon mapped correctly')

  // --- TEST 3: ML Delay Prediction Service & PRD Cutoffs ---
  console.log('\n[TEST 3] ML Delay Prediction (FE-7) & SHAP Factor Contract')
  assert(calculateRiskLevel(0.20) === 'Low', 'Risk level < 0.30 evaluates to Low')
  assert(calculateRiskLevel(0.45) === 'Medium', 'Risk level 0.30 - 0.55 evaluates to Medium')
  assert(calculateRiskLevel(0.75) === 'High', 'Risk level > 0.55 evaluates to High')

  const sampleFlight = PRD_DEMO_FLIGHTS[0] // AA 2231
  const weatherCtx = { code: 95, windSpeed: 38, source: 'Open-Meteo METAR Live' }
  const prediction = await predictFlightDelay(sampleFlight, weatherCtx)
  assert(prediction.estimate === true, 'Delay prediction carries mandatory estimate: true flag')
  assert(prediction.delay_probability > 0.55 && prediction.risk_level === 'High', 'High crosswinds at ORD result in High risk level')
  assert(prediction.expected_delay_minutes > 30, 'Expected delay duration calculated (>30 min)')
  assert(Array.isArray(prediction.top_factors) && prediction.top_factors.length > 0, 'SHAP contributing factors ranking populated')
  assert(prediction.disclaimer.includes('advisory') || prediction.disclaimer.includes('Advisory'), 'Advisory-only disclaimer populated')
  assert(prediction.is_demo === true, 'Demo mode flag preserved when backend offline')

  // --- TEST 4: Multi-Agent Workflow Coordination (FE-4) ---
  console.log('\n[TEST 4] Multi-Agent Workflow Coordination & Error States (FE-4)')
  assert(DEMO_WORKFLOWS.length >= 3, 'Contains at least 3 disruption scenarios (ORD, DEN, JFK)')
  
  // Scenario 1: WF-1042 ORD Severe Weather (Pending Approval)
  const wf1042 = await loadWorkflowDetails('WF-1042')
  assert(wf1042.workflow.agents.length === 4, 'WF-1042 contains all 4 agents: Research, Analysis, Resource, Decision')
  const agentIds = wf1042.workflow.agents.map(a => a.id)
  assert(
    agentIds.includes('research') &&
    agentIds.includes('analysis') &&
    agentIds.includes('resource') &&
    agentIds.includes('decision'),
    'Agent IDs cover complete 4-agent LangGraph pipeline'
  )
  assert(wf1042.workflow.recommendationPlan.length === 3, 'Decision Agent synthesized 3-point mitigation plan')

  // Scenario 3: WF-1044 JFK Runway Icing & Telemetry Fault (Error State)
  const wf1044 = await loadWorkflowDetails('WF-1044')
  assert(wf1044.workflow.status.includes('Failed') || wf1044.workflow.status.includes('Error'), 'WF-1044 is in Error State')
  const resourceAgent = wf1044.workflow.agents.find(a => a.id === 'resource')
  assert(resourceAgent && resourceAgent.status === 'Error', 'Resource Agent correctly reflects Error status')
  const errorTool = resourceAgent.toolsCalled.find(t => t.status === 'error')
  assert(errorTool && errorTool.error.includes('ERR_CAPACITY_EXHAUSTED'), 'Tool activity log records error state & exception')
  const decisionAgent = wf1044.workflow.agents.find(a => a.id === 'decision')
  assert(decisionAgent && decisionAgent.status === 'Blocked', 'Decision Agent correctly reflects Blocked status upon upstream failure')

  // --- TEST 5: Responsive UI Styles & Media Queries (Module 08) ---
  console.log('\n[TEST 5] Responsive UI Styles & Breakpoints (Module 08)')
  const analyticsCss = fs.readFileSync(path.join(__dirname, 'components/analytics/Analytics.css'), 'utf-8')
  assert(analyticsCss.includes('@media (max-width: 1024px)'), 'Contains 1024px tablet responsive breakpoint')
  assert(analyticsCss.includes('@media (max-width: 640px)'), 'Contains 640px mobile responsive breakpoint')
  assert(analyticsCss.includes('.stage-status-badge.Error'), 'Contains CSS styles for Agent Error status badges')
  assert(analyticsCss.includes('.tool-run-item.tool-error'), 'Contains CSS styles for Tool Error states')

  console.log('\n------------------------------------------------------')
  console.log(` RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`)
  console.log('------------------------------------------------------\n')

  if (failedCount > 0) {
    process.exit(1)
  }
}

runTestSuite().catch(err => {
  console.error('Test suite execution error:', err)
  process.exit(1)
})
