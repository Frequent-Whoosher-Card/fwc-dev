import axios from 'axios';
import crypto from 'crypto';

const SUPERSET_URL = process.env.SUPERSET_URL!;
const SERVICE_USERNAME = process.env.SUPERSET_SERVICE_USERNAME!;
const SERVICE_PASSWORD = process.env.SUPERSET_SERVICE_PASSWORD!;
const GUEST_TOKEN_JWT_SECRET = process.env.GUEST_TOKEN_JWT_SECRET!;

let cachedAdminToken: { token: string; expiry: number } | null = null;

async function getAdminToken(): Promise<string> {
  const now = Date.now() / 1000;
  if (cachedAdminToken && cachedAdminToken.expiry > now + 60) {
    return cachedAdminToken.token;
  }

  try {
    const response = await axios.post(`${SUPERSET_URL}/api/v1/security/login`, {
      username: SERVICE_USERNAME,
      password: SERVICE_PASSWORD,
      provider: 'db',
      refresh: false,
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const loginData = response.data;
    const token = loginData.access_token;

    const decoded = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    cachedAdminToken = { token, expiry: decoded.exp };

    return token;
  } catch (err: any) {
    console.error('[Superset] Failed to get admin token:', err.message);
    throw err;
  }
}

export class SupersetService {
  static async getAdminToken(): Promise<string> {
    return getAdminToken();
  }

  static async createGuestToken(dashboardId: string) {
    let adminToken: string;
    try {
      adminToken = await getAdminToken();
    } catch (err) {
      return Promise.reject(new Error('Failed to get admin token'));
    }

    const now = Math.floor(Date.now() / 1000);
    const exp_seconds = 9 * 60 * 60;
    
    const token_payload = {
      user: {
        username: "guest",
        first_name: "Guest",
        last_name: "Viewer",
      },
      resources: [{ type: "dashboard", id: dashboardId }],
      rls_rules: [],
      iat: now,
      exp: now + exp_seconds,
      aud: "superset",
      type: "guest",
    };

    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const payload_encoded = Buffer.from(JSON.stringify(token_payload)).toString('base64url');
    const signature = crypto
      .createHmac('sha256', GUEST_TOKEN_JWT_SECRET)
      .update(`${header}.${payload_encoded}`)
      .digest('base64url');
    
    return `${header}.${payload_encoded}.${signature}`;
  }
}