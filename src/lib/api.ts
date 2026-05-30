import { getConfig, isConfigValid } from './config';

/**
 * Handles API calls to the Google Apps Script Web App.
 * Uses text/plain payload formatting for POST requests to bypass CORS preflight complications.
 */
export async function apiRequest<T = any>(
  action: string,
  method: 'GET' | 'POST' = 'GET',
  data: Record<string, any> = {}
): Promise<T> {
  if (!isConfigValid()) {
    throw new Error("Google Apps Script Web App URL is not configured. Please complete setup first.");
  }

  const config = getConfig();
  const url = new URL(config.GAS_WEB_APP_URL);
  
  // Retrieve session token from localStorage
  const sessionToken = localStorage.getItem('bhh_session_token') || '';

  if (method === 'GET') {
    url.searchParams.append('action', action);
    if (sessionToken) {
      url.searchParams.append('session_token', sessionToken);
    }
    Object.keys(data).forEach(key => {
      if (data[key] !== undefined && data[key] !== null) {
        url.searchParams.append(key, String(data[key]));
      }
    });

    const response = await fetch(url.toString(), {
      method: 'GET',
      mode: 'cors',
      credentials: 'omit',
    });

    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    if (result.error) {
      if (result.status === 401) {
        handleUnauthorized();
      }
      throw new Error(result.message || 'API request failed');
    }
    return result as T;
  } else {
    // POST request
    const payload = {
      action,
      session_token: sessionToken,
      ...data,
    };

    // Use text/plain to prevent CORS preflight OPTIONS request
    const response = await fetch(url.toString(), {
      method: 'POST',
      mode: 'cors',
      credentials: 'omit',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    if (result.error) {
      if (result.status === 401) {
        handleUnauthorized();
      }
      throw new Error(result.message || 'API write failed');
    }
    return result as T;
  }
}

function handleUnauthorized() {
  localStorage.removeItem('bhh_session_token');
  localStorage.removeItem('bhh_user');
  // Only redirect if not already on the login or share screen
  if (!window.location.hash.includes('/login') && !window.location.hash.includes('/share')) {
    window.location.hash = '/login';
  }
}
