export const WEB_PORT = Number(process.env.BROWSER_WEB_PORT ?? "3100");
export const BACKEND_PORT = Number(process.env.BROWSER_BACKEND_PORT ?? "3101");

export const WEB_BASE_URL = `http://127.0.0.1:${WEB_PORT}`;
export const BACKEND_BASE_URL = `http://127.0.0.1:${BACKEND_PORT}`;

export const AUTH_SECRET = "browser-test-auth-secret-must-be-at-least-32-characters";
export const FAMILY_UUID = "11111111-1111-1111-1111-111111111111";
export const USER_UUID = "22222222-2222-2222-2222-222222222222";
