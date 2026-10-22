/**
 * Workflow and AI Multi-Agent Service (FE-4 & PRD Sections A6, B4)
 * Coordinates the 4 specialized agents:
 * 1. Research Agent
 * 2. Analysis Agent
 * 3. Resource Agent
 * 4. Decision Agent
 */

import { apiRequest } from './apiClient.js'

export const DEMO_WORKFLOWS = [
  {
    id: 'WF-1042',
    name: 'Severe Weather Disruption at ORD',
    airport: 'ORD',
    trigger: 'Open-Meteo Thunderstorm Alert (WMO 95) & Wind Gusts 38 kt',
    status: 'Pending Approval',
    startedAt: '17:10:00',
    summary: 'Gusts 38 kt exceed 30 kt simulated limit; 3 departures delayed; gate B12 turnaround conflict identified.',
    affectedFlights: ['AA 2231', 'UA 482', 'WN 1308'],
    recommendationPlan: [
      'Hold departures on runway 10L/28R until surface visibility and squall line clear (estimate: 45 min).',
      'Reassign AA 2231 from gate B12 to gate B14 to clear turnaround buffer conflict.',
      'Deploy two reserve ramp crew members for the 18:00–20:00 weather recovery window.',
    ],
    reasons: [
      'Gusts 38 kt exceed 30 kt simulated limit (hard weather constraint).',
      'Visibility 1.5 mi below 3.0 mi VFR threshold.',
      'Aircraft turnaround buffer at gate B12 overlaps by 22 minutes.',
    ],
    agents: [
      {
        id: 'research',
        name: 'Research Agent',
        role: 'Data Aggregation & Past Disruptions',
        status: 'Completed',
        durationMs: 420,
        toolsCalled: [
          {
            tool: 'fetch_flight_status',
            args: { hub: 'ORD', window: '17:00-19:00' },
            output: 'Retrieved 6 active flight manifests (3 delayed, 1 boarding, 2 scheduled)',
            status: 'success',
            time: '17:10:02',
          },
          {
            tool: 'query_open_meteo_weather',
            args: { lat: 41.9742, lon: -87.9073 },
            output: 'WMO 95 Severe Thunderstorm, wind 38 kt, visibility 1.5 mi',
            status: 'success',
            time: '17:10:04',
          },
          {
            tool: 'search_chroma_disruptions',
            args: { query: 'summer squall wind > 35kt ORD', top_k: 3 },
            output: 'Found 3 past matching disruptions (WF-0812, WF-0941, WF-0998)',
            status: 'success',
            time: '17:10:07',
          },
        ],
      },
      {
        id: 'analysis',
        name: 'Analysis Agent',
        role: 'Delay Risk Scoring & Rule Checks',
        status: 'Completed',
        durationMs: 510,
        toolsCalled: [
          {
            tool: 'predict_bts_delay_model',
            args: { flights: ['AA 2231', 'UA 482', 'WN 1308'], features: 'wind_38kt_vis_1.5mi' },
            output: '3 flights rated High risk (p=0.78, p=0.64, p=0.71); expected delay +45m [Estimate]',
            status: 'success',
            time: '17:10:11',
          },
          {
            tool: 'evaluate_weather_safety_rules',
            args: { crosswind_kt: 38, limit_kt: 30 },
            output: 'RULE_BREACH: Crosswind limit exceeded. Suggest runway hold.',
            status: 'warning',
            time: '17:10:14',
          },
        ],
      },
      {
        id: 'resource',
        name: 'Resource Agent',
        role: 'Runway, Gate & Crew Conflict Check',
        status: 'Completed',
        durationMs: 380,
        toolsCalled: [
          {
            tool: 'check_runway_slot_separation',
            args: { active_runways: ['10L', '28C'], closed: ['10R'] },
            output: 'Slot capacity reduced from 42 to 24 operations/hour',
            status: 'success',
            time: '17:10:18',
          },
          {
            tool: 'check_gate_clash_matrix',
            args: { gate: 'B12', arrival: '17:15', departure: '17:50' },
            output: 'CONFLICT: Inbound UA 482 overlaps AA 2231 turnaround at gate B12. Gate B14 available.',
            status: 'warning',
            time: '17:10:21',
          },
          {
            tool: 'verify_ramp_crew_roster',
            args: { window: '18:00-20:00' },
            output: 'Roster short by 2 ground crew under severe weather handling protocol.',
            status: 'success',
            time: '17:10:23',
          },
        ],
      },
      {
        id: 'decision',
        name: 'Decision Agent',
        role: 'Plan Synthesis & Recommendation',
        status: 'Pending Approval',
        durationMs: 290,
        toolsCalled: [
          {
            tool: 'synthesize_mitigation_plan',
            args: { disruption_id: 'WF-1042', auto_execute: false },
            output: 'Drafted 3-point operational recovery plan. Marked status: PENDING duty officer approval.',
            status: 'success',
            time: '17:10:26',
          },
        ],
      },
    ],
  },
  {
    id: 'WF-1043',
    name: 'Denver (DEN) Low Visibility / Fog Protocol',
    airport: 'DEN',
    trigger: 'Dense Fog Bank (WMO 45) Visibility 0.75 mi',
    status: 'Completed',
    startedAt: '16:30:00',
    summary: 'CAT III instrument landing procedures instituted; departure slot separation expanded to 4 miles; all 4 workflow agents completed successfully.',
    affectedFlights: ['UA 1198', 'UA 482'],
    recommendationPlan: [
      'Institute ILS CAT III approach spacing across runways 35L and 35R.',
      'Hold regional turboprop departures for 30 minutes (estimate: 30 min) [Estimate].',
      'Authorize progressive taxi routing with airport surface detection radar (ASDE-X).',
    ],
    reasons: [
      'Surface Runway Visual Range (RVR) below 1,200 ft.',
      'Aircraft separation safety rule requires 4-mile spacing in CAT III conditions.',
    ],
    agents: [
      {
        id: 'research',
        name: 'Research Agent',
        role: 'Data Aggregation & Past Disruptions',
        status: 'Completed',
        durationMs: 310,
        toolsCalled: [
          {
            tool: 'fetch_flight_status',
            args: { hub: 'DEN', window: '16:30-18:30' },
            output: 'Retrieved 8 active flight manifests (2 inbound, 6 outbound)',
            status: 'success',
            time: '16:30:02',
          },
          {
            tool: 'query_open_meteo_weather',
            args: { lat: 39.8561, lon: -104.6737 },
            output: 'WMO 45 Fog, visibility 0.75 mi, ceiling 200 ft, temperature -1°C',
            status: 'success',
            time: '16:30:04',
          },
        ],
      },
      {
        id: 'analysis',
        name: 'Analysis Agent',
        role: 'Delay Risk Scoring & Rule Checks',
        status: 'Completed',
        durationMs: 440,
        toolsCalled: [
          {
            tool: 'predict_bts_delay_model',
            args: { flights: ['UA 1198', 'UA 482'], features: 'fog_vis_0.75mi' },
            output: 'UA 1198 rated High risk (p=0.68); expected delay +42m [Estimate]',
            status: 'success',
            time: '16:30:08',
          },
          {
            tool: 'evaluate_weather_safety_rules',
            args: { visibility_mi: 0.75, vfr_threshold_mi: 3.0 },
            output: 'RULE_BREACH: IFR/CAT III Spacing Rules mandatory.',
            status: 'warning',
            time: '16:30:10',
          },
        ],
      },
      {
        id: 'resource',
        name: 'Resource Agent',
        role: 'Runway, Gate & Crew Conflict Check',
        status: 'Completed',
        durationMs: 360,
        toolsCalled: [
          {
            tool: 'check_runway_slot_separation',
            args: { runways: ['35L', '35R'], separation_miles: 4 },
            output: 'Departure flow capped at 28 operations/hr to preserve CAT III safety margin.',
            status: 'success',
            time: '16:30:13',
          },
          {
            tool: 'check_gate_clash_matrix',
            args: { gate: 'B32', buffer_min: 30 },
            output: 'Gate buffer adequate. No gate clash detected.',
            status: 'success',
            time: '16:30:16',
          },
        ],
      },
      {
        id: 'decision',
        name: 'Decision Agent',
        role: 'Plan Synthesis & Recommendation',
        status: 'Completed',
        durationMs: 250,
        toolsCalled: [
          {
            tool: 'synthesize_mitigation_plan',
            args: { disruption_id: 'WF-1043', auto_execute: true },
            output: 'Generated CAT III pacing protocol. Dispatched to Denver Tower and Operations Center.',
            status: 'success',
            time: '16:30:19',
          },
        ],
      },
    ],
  },
  {
    id: 'WF-1044',
    name: 'JFK Runway Icing & Telemetry Fault (Error State)',
    airport: 'JFK',
    trigger: 'Freezing Rain Alert & Surface Sensor Telemetry 504 Gateway Timeout',
    status: 'Failed (Error State)',
    startedAt: '18:15:00',
    summary: 'Sensor telemetry failed on runway 22R; Resource Agent detected de-icing fluid truck shortage; automated workflow halted in error state awaiting human Duty Officer intervention.',
    affectedFlights: ['DL 2410', 'B6 620'],
    errorMessage: 'Resource allocation failure: insufficient de-icing equipment on ramp. Synthesis blocked.',
    recommendationPlan: [
      'MANUAL INTERVENTION REQUIRED: Direct airfield ground crew to perform physical pavement friction test on Runway 22R.',
      'Emergency hold on all narrow-body departures pending secondary fluid tanker arrival (estimate: 60 min) [Estimate].',
    ],
    reasons: [
      'Field telemetry sensor timeout (HTTP 504) on sensor station JFK-R22R.',
      'ERR_CAPACITY_EXHAUSTED: Only 1 de-icing truck operational; minimum 4 required under winter storm protocol.',
    ],
    agents: [
      {
        id: 'research',
        name: 'Research Agent',
        role: 'Data Aggregation & Past Disruptions',
        status: 'Completed',
        durationMs: 380,
        toolsCalled: [
          {
            tool: 'fetch_flight_status',
            args: { hub: 'JFK', window: '18:00-20:00' },
            output: 'Retrieved 4 active departures in de-icing queue',
            status: 'success',
            time: '18:15:02',
          },
          {
            tool: 'query_open_meteo_weather',
            args: { lat: 40.6413, lon: -73.7781 },
            output: 'WMO 66 Freezing Rain, temperature -2°C, wind 22 kt',
            status: 'success',
            time: '18:15:04',
          },
        ],
      },
      {
        id: 'analysis',
        name: 'Analysis Agent',
        role: 'Delay Risk Scoring & Rule Checks',
        status: 'Warning',
        durationMs: 520,
        toolsCalled: [
          {
            tool: 'query_runway_ice_sensors',
            args: { station: 'JFK-R22R', timeout_ms: 3000 },
            output: 'TIMEOUT 504: Sensor station JFK-R22R failed to respond. Fallback to manual airfield inspection log.',
            status: 'error',
            error: 'HTTP 504 Gateway Timeout from sensor gateway',
            time: '18:15:08',
          },
          {
            tool: 'predict_bts_delay_model',
            args: { flights: ['DL 2410'], condition: 'freezing_rain' },
            output: 'High risk rating (p=0.82); expected de-icing delay +50m [Estimate]',
            status: 'success',
            time: '18:15:11',
          },
        ],
      },
      {
        id: 'resource',
        name: 'Resource Agent',
        role: 'Runway, Gate & Crew Conflict Check',
        status: 'Error',
        durationMs: 410,
        error: 'ERR_CAPACITY_EXHAUSTED: Only 1 de-icing tanker operational; minimum 4 required.',
        toolsCalled: [
          {
            tool: 'reserve_deicing_truck_slots',
            args: { required_trucks: 4, bay: 'PAD-NORTH' },
            output: 'CRITICAL FAILURE: Only 1 tanker available on ramp. Minimum 4 required for scheduled departure bank.',
            status: 'error',
            error: 'ERR_CAPACITY_EXHAUSTED: Ramp inventory depleted',
            time: '18:15:15',
          },
        ],
      },
      {
        id: 'decision',
        name: 'Decision Agent',
        role: 'Plan Synthesis & Recommendation',
        status: 'Blocked',
        durationMs: 90,
        error: 'Plan synthesis blocked due to upstream Resource Agent failure. Human override required.',
        toolsCalled: [
          {
            tool: 'synthesize_mitigation_plan',
            args: { disruption_id: 'WF-1044' },
            output: 'ABORTED: Cannot safely construct automated mitigation plan without required ramp equipment.',
            status: 'error',
            error: 'Workflow halted: Human Duty Officer manual intervention required',
            time: '18:15:18',
          },
        ],
      },
    ],
  },
]

/**
 * Loads workflow details from backend `GET /workflows/{id}` or falls back to PRD demo workflow
 */
export async function loadWorkflowDetails(workflowId = 'WF-1042') {
  try {
    const data = await apiRequest(`/workflows/${workflowId}`)
    if (data && data.agents) {
      return { workflow: data, is_demo: false }
    }
  } catch (err) {
    console.info(`Backend workflow endpoint for ${workflowId} not responding; using PRD demo timeline.`, err.message)
  }

  const demoMatch =
    DEMO_WORKFLOWS.find((w) => w.id === workflowId) || DEMO_WORKFLOWS[0]

  return { workflow: demoMatch, is_demo: true }
}
