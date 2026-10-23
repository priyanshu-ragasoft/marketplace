import { fetchWithGatewayFallback, parseApiError } from './storeAuthService'

function getUserAccessToken() {
  try {
    return localStorage.getItem('access_token') || null
  } catch {
    return null
  }
}

function unwrapRewardPayload(resultJson, response) {
  const statusCode = resultJson?.code || response.status
  const isSuccess =
    resultJson?.success === true ||
    resultJson?.status === true ||
    (response.ok && resultJson?.success !== false && resultJson?.status !== false)

  if (!isSuccess) {
    const err = new Error(parseApiError(resultJson, response.status) || 'Reward request failed.')
    err.status = statusCode
    throw err
  }

  if (resultJson?.data && typeof resultJson.data === 'object' && !Array.isArray(resultJson.data)) {
    return resultJson.data
  }
  return resultJson
}

async function postReward(endpoint, body) {
  const token = getUserAccessToken()
  if (!token) {
    const err = new Error('Sign in to use reward points.')
    err.status = 401
    throw err
  }

  let response
  let resultJson = null

  try {
    response = await fetchWithGatewayFallback(endpoint, {
      method: 'POST',
      headers: {
        Accept: 'application/json, */*',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(body)
    })

    const rawText = await response.text()
    try {
      resultJson = rawText ? JSON.parse(rawText) : {}
    } catch {
      resultJson = { message: rawText, code: response.status }
    }
  } catch (netErr) {
    const err = new Error(netErr.message || 'Unable to reach the reward service.')
    err.status = 503
    throw err
  }

  if (response.status === 401 || resultJson?.code === 401) {
    const err = new Error(parseApiError(resultJson, response.status) || 'Sign in to use reward points.')
    err.status = 401
    throw err
  }

  return unwrapRewardPayload(resultJson, response)
}

/**
 * Today's INR per 1 USD. Used only as the quote input; the cart total is not converted locally.
 */
export async function fetchInrPerUsd() {
  const response = await fetch('https://open.er-api.com/v6/latest/USD')
  if (!response.ok) {
    throw new Error('Could not load today’s USD to INR rate.')
  }
  const data = await response.json()
  const rate = Number(data?.rates?.INR)
  if (!Number.isFinite(rate) || rate <= 0) {
    throw new Error('Could not load today’s USD to INR rate.')
  }
  return rate
}

/**
 * POST /api/v1/store/reward/quote
 * Omit `points` to let the API apply the maximum that fits the balance and the cart.
 */
export function quoteStoreRewards({ cartUsd, cartEth, inrPerUsd, rewardsApplied, points }) {
  const body = {
    cartUsd,
    cartEth,
    inrPerUsd,
    rewardsApplied: Boolean(rewardsApplied)
  }
  if (points !== undefined && points !== null) {
    body.points = points
  }
  return postReward('/store/reward/quote', body)
}

/**
 * POST /api/v1/store/reward/confirm
 * `points` must be the pointsApplied from the quote that was paid.
 */
export function confirmStoreRewards({ checkoutRef, cartUsd, cartEth, inrPerUsd, points }) {
  return postReward('/store/reward/confirm', {
    checkoutRef,
    cartUsd,
    cartEth,
    inrPerUsd,
    rewardsApplied: true,
    points
  })
}
