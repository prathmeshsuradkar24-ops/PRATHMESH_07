/**
 * Shared API Client for Airport Operations Coordination Engine (FE-1)
 * Standardizes API communication, timeouts, error parsing, and base URL resolution.
 */

const DEFAULT_API_BASE_URL = 'http://127.0.0.1:8000/api'

export const API_BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) ||
  DEFAULT_API_BASE_URL

/**
 * Standard HTTP request wrapper with timeout and standard error formatting
 */
export async function apiRequest(endpoint, options = {}, timeoutMs = 6000) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    })
    clearTimeout(timeoutId)

    const contentType = response.headers.get('content-type') || ''
    const data = contentType.includes('application/json')
      ? await response.json()
      : await response.text()

    if (!response.ok) {
      const errorMsg =
        (typeof data === 'object' && (data.message || data.detail || data.error)) ||
        `HTTP Error ${response.status}: ${response.statusText}`

      const error = new Error(errorMsg)
      error.status = response.status
      error.details = data
      throw error
    }

    return data
  } catch (err) {
    clearTimeout(timeoutId)
    if (err.name === 'AbortError') {
      throw new Error(`API connection timed out after ${timeoutMs}ms`, { cause: err })
    }
    throw err
  }
}
