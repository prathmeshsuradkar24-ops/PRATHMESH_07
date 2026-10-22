const API_BASE_URL = 'http://127.0.0.1:8000/api'

export async function getFlights() {
  const response = await fetch(`${API_BASE_URL}/flights`)

  if (!response.ok) {
    throw new Error('Unable to load flights.')
  }

  return response.json()
}

export async function analyzeFlight(flight) {
  const response = await fetch(`${API_BASE_URL}/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(flight),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.detail || 'Flight analysis failed.')
  }

  return data
}
