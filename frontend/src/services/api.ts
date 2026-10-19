const API_BASE = '/api';

export class ApiError extends Error {
  status: number;
  data: any;
  constructor(status: number, message: string, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('fleet_access_token');
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });
  } catch (err: any) {
    throw new ApiError(0, 'Network error. Cannot reach central API.', err);
  }

  // Handle Token expiration / auto refresh
  if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
    const refreshToken = localStorage.getItem('fleet_refresh_token');
    if (refreshToken) {
      try {
        const refreshResp = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken })
        });
        if (refreshResp.ok) {
          const data = await refreshResp.json();
          localStorage.setItem('fleet_access_token', data.access_token);
          localStorage.setItem('fleet_refresh_token', data.refresh_token);
          headers.set('Authorization', `Bearer ${data.access_token}`);

          // Retry initial request
          const retryResp = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers
          });
          if (!retryResp.ok) {
            const errData = await retryResp.json().catch(() => ({}));
            throw new ApiError(retryResp.status, errData.detail || 'Request failed after refresh', errData);
          }
          return await retryResp.json();
        } else {
          localStorage.removeItem('fleet_access_token');
          localStorage.removeItem('fleet_refresh_token');
          window.location.reload();
        }
      } catch (e) {
        localStorage.removeItem('fleet_access_token');
        localStorage.removeItem('fleet_refresh_token');
        window.location.reload();
      }
    }
  }

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new ApiError(
      response.status,
      errData.detail || `Request failed with HTTP ${response.status}`,
      errData
    );
  }

  if (response.status === 204) {
    return {} as T;
  }

  return await response.json();
}
