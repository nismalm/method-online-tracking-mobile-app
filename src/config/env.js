// TESTING: using ngrok tunnel - swap back to Railway URL before final release
export const API_BASE_URL = 'https://verdie-unreprimanding-hayden.ngrok-free.dev/api/v1';
// export const API_BASE_URL = 'https://method-backend.up.railway.app/api/v1';

export const PUBLIC_BASE_URL = API_BASE_URL.replace(/\/api\/v1\/?$/, '');
export const CLIENT_INTAKE_URL = `${PUBLIC_BASE_URL}/client-onboard`;

export const REQUEST_TIMEOUT_MS = 20000;
export const PROFILE_POLL_INTERVAL_MS = 60000;
