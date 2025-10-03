const DISCOGS_API_URL = 'https://api.discogs.com';
const DISCOGS_KEY = 'TCKkHBBZVAFGQiWswBiG';
const DISCOGS_SECRET = 'uZywLaQCmTNPKPNATAcFduIyxAlltHba';

export interface DiscogsSearchParams {
  query?: string;
  type?: 'release' | 'master' | 'artist' | 'label';
  year?: string;
  genre?: string;
  style?: string;
  label?: string;
  artist?: string;
  format?: string;
  country?: string;
  page?: number;
  per_page?: number;
  sort?: 'year' | 'title' | 'artist';
  sort_order?: 'asc' | 'desc';
}

export interface DiscogsRelease {
  id: number;
  title: string;
  year?: string;
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

export const discogsService = {
  async search(params: DiscogsSearchParams): Promise<DiscogsSearchResult> {
    const queryParams = new URLSearchParams();
    
    if (params.query) queryParams.append('q', params.query);
    if (params.type) queryParams.append('type', params.type);
    if (params.year) queryParams.append('year', params.year);
    if (params.genre) queryParams.append('genre', params.genre);
    if (params.style) queryParams.append('style', params.style);
    if (params.label) queryParams.append('label', params.label);
    if (params.artist) queryParams.append('artist', params.artist);
    if (params.format) queryParams.append('format', params.format);
    if (params.country) queryParams.append('country', params.country);
    if (params.sort) queryParams.append('sort', params.sort);
    if (params.sort_order) queryParams.append('sort_order', params.sort_order);
    
    queryParams.append('page', String(params.page || 1));
    queryParams.append('per_page', String(params.per_page || 25));
    queryParams.append('key', DISCOGS_KEY);
    queryParams.append('secret', DISCOGS_SECRET);

    const response = await fetch(`${DISCOGS_API_URL}/database/search?${queryParams}`);
    
    if (!response.ok) {
      throw new Error(`Discogs API error: ${response.statusText}`);
    }

    return response.json();
  },

  async getRelease(releaseId: number) {
    const response = await fetch(
      `${DISCOGS_API_URL}/releases/${releaseId}?key=${DISCOGS_KEY}&secret=${DISCOGS_SECRET}`
    );
    
    if (!response.ok) {
      throw new Error(`Discogs API error: ${response.statusText}`);
    }

    return response.json();
  },

  async getUserCollection(username: string, page = 1) {
    const response = await fetch(
      `${DISCOGS_API_URL}/users/${username}/collection/folders/0/releases?page=${page}&per_page=50&key=${DISCOGS_KEY}&secret=${DISCOGS_SECRET}`
    );
    
    if (!response.ok) {
      throw new Error(`Discogs API error: ${response.statusText}`);
    }

    return response.json();
  },
};
