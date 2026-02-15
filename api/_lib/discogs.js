const DISCOGS_API_URL = "https://api.discogs.com";
const RETRYABLE_STATUSES = new Set([429, 503]);
const DEFAULT_RETRIES = 3;
const DEFAULT_DELAY_MS = 300;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getEnvCredentials() {
  const key = process.env.DISCOGS_KEY;
  const secret = process.env.DISCOGS_SECRET;

  if (!key || !secret) {
    const error = new Error("Discogs credentials are not configured.");
    error.status = 500;
    throw error;
  }

  return { key, secret };
}

function getSingleQueryValue(value) {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function toPositiveInteger(value, fallback, min = 1, max = Number.MAX_SAFE_INTEGER) {
  if (typeof value !== "string" || value.trim() === "") {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    return fallback;
  }

  return Math.min(Math.max(parsed, min), max);
}

function readAllowedString(value, allowedValues) {
  const singleValue = getSingleQueryValue(value);
  if (!singleValue || typeof singleValue !== "string") {
    return undefined;
  }

  if (allowedValues.includes(singleValue)) {
    return singleValue;
  }

  return undefined;
}

async function fetchWithRetry(url, init, retries = DEFAULT_RETRIES, delayMs = DEFAULT_DELAY_MS) {
  let lastError;

  for (let attempt = 0; attempt < retries; attempt += 1) {
    try {
      const response = await fetch(url, init);

      if (!RETRYABLE_STATUSES.has(response.status) || attempt === retries - 1) {
        return response;
      }

      await delay(delayMs * (attempt + 1));
    } catch (error) {
      lastError = error;
      if (attempt === retries - 1) {
        throw error;
      }
      await delay(delayMs * (attempt + 1));
    }
  }

  throw lastError || new Error("Discogs request failed after retries.");
}

async function safeReadJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function fetchDiscogsJson(pathname, queryParams) {
  const { key, secret } = getEnvCredentials();
  const params = new URLSearchParams(queryParams);
  params.set("key", key);
  params.set("secret", secret);

  const url = `${DISCOGS_API_URL}${pathname}?${params.toString()}`;
  const response = await fetchWithRetry(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "User-Agent": "digi-discog-radar/1.0",
    },
  });

  const payload = await safeReadJson(response);

  if (!response.ok) {
    const message =
      payload?.message || payload?.error || `Discogs API error: ${response.status} ${response.statusText}`;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return payload;
}

export function sendJson(res, statusCode, payload) {
  res.status(statusCode);
  res.setHeader("Content-Type", "application/json");
  res.json(payload);
}

export function sendError(res, error) {
  const statusCode = typeof error?.status === "number" ? error.status : 500;
  sendJson(res, statusCode, {
    error: error?.message || "Unexpected server error.",
  });
}

export function sendMethodNotAllowed(res, allowedMethods) {
  res.setHeader("Allow", allowedMethods.join(", "));
  sendJson(res, 405, { error: "Method not allowed." });
}

export { getSingleQueryValue, readAllowedString, toPositiveInteger };
