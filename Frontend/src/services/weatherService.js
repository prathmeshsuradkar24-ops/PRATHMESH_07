/**
 * Weather Service for Airport Operations Coordination Engine
 * Integrates with Open-Meteo API for real-time weather monitoring across US Hub Airports.
 * Implements fallback caching and synthetic data flagging per PRD A3 & A7.
 */

// Demo US Hub Airports per PRD Section A3
export const DEFAULT_AIRPORTS = [
  {
    id: 'ord',
    name: "Chicago O'Hare International",
    shortName: 'ORD',
    latitude: 41.9742,
    longitude: -87.9073,
    isPrimaryHub: true,
  },
  {
    id: 'atl',
    name: 'Hartsfield-Jackson Atlanta',
    shortName: 'ATL',
    latitude: 33.6407,
    longitude: -84.4277,
  },
  {
    id: 'dfw',
    name: 'Dallas/Fort Worth International',
    shortName: 'DFW',
    latitude: 32.8998,
    longitude: -97.0403,
  },
  {
    id: 'den',
    name: 'Denver International',
    shortName: 'DEN',
    latitude: 39.8561,
    longitude: -104.6737,
  },
  {
    id: 'jfk',
    name: 'John F. Kennedy International',
    shortName: 'JFK',
    latitude: 40.6413,
    longitude: -73.7781,
  },
  {
    id: 'lax',
    name: 'Los Angeles International',
    shortName: 'LAX',
    latitude: 33.9416,
    longitude: -118.4085,
  },
]

// WMO Weather Interpretation Codes (WW)
export function getWeatherDescription(code) {
  if (code === 0) return 'Clear Sky'
  if ([1, 2, 3].includes(code)) return 'Partly Cloudy'
  if ([45, 48].includes(code)) return 'Fog / Low Visibility'
  if ([51, 53, 55, 56, 57].includes(code)) return 'Drizzle'
  if ([61, 63, 65, 66, 67].includes(code)) return 'Rain'
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'Snow'
  if ([80, 81, 82].includes(code)) return 'Heavy Rain Showers'
  if ([95, 96, 99].includes(code)) return 'Severe Thunderstorm'
  return 'Overcast'
}

export function getWeatherIcon(code) {
  if (code === 0) return '☀️'
  if ([1, 2, 3].includes(code)) return '⛅'
  if ([45, 48].includes(code)) return '🌫️'
  if ([51, 53, 55, 56, 57].includes(code)) return '🌦️'
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return '🌧️'
  if ([71, 73, 75, 77, 85, 86].includes(code)) return '❄️'
  if ([95, 96, 99].includes(code)) return '⛈️'
  return '☁️'
}

/**
 * Calculates operational severity from weather code and wind speed
 */
export function getSeverity(code, windSpeed) {
  if ([95, 96, 99].includes(code) || windSpeed >= 50) return 'High'
  if ([45, 48, 65, 67, 82, 86].includes(code) || windSpeed >= 30) return 'Medium'
  if (
    [51, 53, 55, 56, 57, 61, 63, 66, 71, 73, 75, 77, 80, 81, 85].includes(code) ||
    windSpeed >= 20
  ) {
    return 'Low'
  }
  return null
}

/**
 * Creates operational alerts for airports with non-nominal weather conditions
 */
export function createWeatherAlerts(weatherList) {
  const alerts = []

  weatherList.forEach((airportWeather) => {
    const { code, windSpeed, shortName, name, id, source } = airportWeather
    const severity = getSeverity(code, windSpeed)
    if (!severity) return

    const condition = getWeatherDescription(code)
    let message = `${condition} detected at ${name} (${shortName}). Wind: ${windSpeed} km/h.`
    let operationalImpact = 'Monitor turnaround and ground operations.'

    if ([95, 96, 99].includes(code)) {
      message = `Severe thunderstorm and squall line warning at ${shortName}. Lightning and turbulence hazard.`
      operationalImpact = 'Hold departure releases on active runways; expect ramp stoppage and gate holds.'
    } else if (windSpeed >= 45) {
      message = `High crosswind gusts (${windSpeed} km/h) exceeding nominal limits at ${shortName}.`
      operationalImpact = 'Runway slot separation increase required; potential missed approaches.'
    } else if ([45, 48].includes(code)) {
      message = `Dense fog and restricted surface visibility at ${shortName}.`
      operationalImpact = 'CAT II/III low visibility procedures active. Approach spacing extended.'
    }

    alerts.push({
      id: `alert-${id}-${Date.now().toString(36)}`,
      airportId: id,
      airportCode: shortName,
      airportName: name,
      severity,
      title: `${severity} Priority Weather Disruption`,
      message,
      operationalImpact,
      condition,
      windSpeed,
      source: source || 'Live Weather',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    })
  })

  return alerts
}

const CACHE_KEY = 'airport_ops_weather_cache'
const CACHE_TTL_MS = 10 * 60 * 1000 // 10 minutes

/**
 * Fetches batch weather from Open-Meteo API with caching and synthetic fallback.
 */
export async function fetchAirportsWeather(airports = DEFAULT_AIRPORTS) {
  if (!airports || airports.length === 0) return { weather: [], alerts: [], source: 'Synthetic' }

  const latitudes = airports.map((a) => a.latitude).join(',')
  const longitudes = airports.map((a) => a.longitude).join(',')

  const endpoint =
    `https://api.open-meteo.com/v1/forecast?latitude=${latitudes}&longitude=${longitudes}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m` +
    `&wind_speed_unit=kmh&timezone=auto`

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000)

    const response = await fetch(endpoint, { signal: controller.signal })
    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`Open-Meteo returned status ${response.status}`)
    }

    const data = await response.json()
    const results = Array.isArray(data) ? data : [data]

    const weatherCards = airports.map((airport, index) => {
      const current = results[index]?.current || {}
      const code = current.weather_code ?? 0
      const windSpeed = Math.round(current.wind_speed_10m ?? 12)

      return {
        ...airport,
        temperature: Math.round(current.temperature_2m ?? 20),
        feelsLike: Math.round(current.apparent_temperature ?? 20),
        humidity: current.relative_humidity_2m ?? 50,
        windSpeed,
        code,
        condition: getWeatherDescription(code),
        icon: getWeatherIcon(code),
        source: 'Live (Open-Meteo)',
      }
    })

    const alerts = createWeatherAlerts(weatherCards)

    // Save to cache
    try {
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
          timestamp: Date.now(),
          weather: weatherCards,
          alerts,
        })
      )
    } catch {
      // LocalStorage errors ignored safely
    }

    return { weather: weatherCards, alerts, source: 'Live (Open-Meteo)' }
  } catch (err) {
    // Attempt cache recovery
    try {
      const cached = localStorage.getItem(CACHE_KEY)
      if (cached) {
        const parsed = JSON.parse(cached)
        const age = Date.now() - (parsed.timestamp || 0)
        if (age < CACHE_TTL_MS * 3) {
          const cachedWeather = parsed.weather.map((item) => ({
            ...item,
            source: 'Cached',
          }))
          const cachedAlerts = (parsed.alerts || []).map((alert) => ({
            ...alert,
            source: 'Cached',
          }))
          return { weather: cachedWeather, alerts: cachedAlerts, source: 'Cached' }
        }
      }
    } catch {
      // ignore
    }

    // Synthetic Fallback Dataset (simulating PRD storm at ORD)
    const syntheticWeather = airports.map((airport) => {
      const isOrd = airport.shortName === 'ORD'
      const code = isOrd ? 95 : airport.shortName === 'DEN' ? 45 : 1
      const windSpeed = isOrd ? 52 : 16

      return {
        ...airport,
        temperature: isOrd ? 14 : 22,
        feelsLike: isOrd ? 10 : 22,
        humidity: isOrd ? 88 : 55,
        windSpeed,
        code,
        condition: getWeatherDescription(code),
        icon: getWeatherIcon(code),
        source: 'Synthetic Fallback',
      }
    })

    const syntheticAlerts = createWeatherAlerts(syntheticWeather)

    return {
      weather: syntheticWeather,
      alerts: syntheticAlerts,
      source: 'Synthetic Fallback',
      error: `Network offline or API limit reached: ${err.message}. Showing calibrated fallback data.`,
    }
  }
}
