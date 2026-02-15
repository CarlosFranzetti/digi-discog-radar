const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

export interface DiscogsSearchParams {
  query?: string;
  type?: "release" | "master" | "artist" | "label";
  year?: string;
  genre?: string;
  style?: string;
  label?: string;
  artist?: string;
  format?: string;
  country?: string;
  page?: number;
  per_page?: number;
  sort?: "year" | "title" | "artist";
  sort_order?: "asc" | "desc";
}

export interface DiscogsRelease {
  id: number;
  title: string;
  year?: string | number;
  country?: string;
  format?: string[];
  label?: string[];
  genre?: string[];
  style?: string[];
  thumb?: string;
  cover_image?: string;
  resource_url?: string;
  master_id?: number;
  master_url?: string;
  uri?: string;
  catno?: string;
  barcode?: string[];
  user_data?: {
    in_wantlist?: boolean;
    in_collection?: boolean;
  };
}

export interface DiscogsSearchResult {
  results: DiscogsRelease[];
  pagination: {
    page: number;
    pages: number;
    per_page: number;
    items: number;
    urls: {
      last?: string;
      next?: string;
    };
  };
}

// Helper to add delay between requests
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Retry logic with exponential backoff
async function fetchWithRetry(url: string, retries = 3, delayMs = 1000): Promise<Response> {
  for (let i = 0; i < retries; i += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return response;
      if (response.status === 429 || response.status === 503) {
        // Rate limited or service unavailable, wait and retry
        await delay(delayMs * (i + 1));
        continue;
      }
      return response;
    } catch (error) {
      if (i === retries - 1) throw error;
      await delay(delayMs * (i + 1));
    }
  }
  throw new Error("Max retries exceeded");
}

function buildApiUrl(path: string, params?: URLSearchParams): string {
  const basePath = `${API_BASE_URL}${path}`;
  const query = params?.toString();
  return query ? `${basePath}?${query}` : basePath;
}

async function getJsonOrThrow<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      payload?.error ||
      payload?.message ||
      `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return payload as T;
}

export const discogsService = {
  async search(params: DiscogsSearchParams): Promise<DiscogsSearchResult> {
    const queryParams = new URLSearchParams();

    if (params.query) queryParams.append("q", params.query);
    if (params.type) queryParams.append("type", params.type);
    if (params.year) queryParams.append("year", params.year);
    if (params.genre) queryParams.append("genre", params.genre);
    if (params.style) queryParams.append("style", params.style);
    if (params.label) queryParams.append("label", params.label);
    if (params.artist) queryParams.append("artist", params.artist);
    if (params.format) queryParams.append("format", params.format);
    if (params.country) queryParams.append("country", params.country);
    if (params.sort) queryParams.append("sort", params.sort);
    if (params.sort_order) queryParams.append("sort_order", params.sort_order);

    queryParams.append("page", String(params.page || 1));
    queryParams.append("per_page", String(params.per_page || 25));

    const response = await fetchWithRetry(buildApiUrl("/api/discogs/search", queryParams));
    return getJsonOrThrow<DiscogsSearchResult>(response);
  },

  async getRelease(releaseId: number) {
    const response = await fetchWithRetry(buildApiUrl(`/api/discogs/releases/${releaseId}`));
    return getJsonOrThrow(response);
  },

  async getUserCollection(username: string, page = 1) {
    const queryParams = new URLSearchParams({
      page: String(page),
      per_page: "50",
    });

    const encodedUsername = encodeURIComponent(username);
    const response = await fetchWithRetry(
      buildApiUrl(`/api/discogs/users/${encodedUsername}/collection`, queryParams)
    );

    return getJsonOrThrow(response);
  },

  async searchArtists(query: string): Promise<{ results: Array<{ id: number; title: string; thumb?: string }> }> {
    const queryParams = new URLSearchParams();
    queryParams.append("q", query);
    queryParams.append("per_page", "5");

    const response = await fetchWithRetry(buildApiUrl("/api/discogs/artists/search", queryParams));
    return getJsonOrThrow(response);
  },
};
