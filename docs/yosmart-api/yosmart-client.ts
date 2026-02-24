/**
 * YoSmart API Client Library (TypeScript/JavaScript)
 * 
 * A TypeScript client for interacting with YoSmart devices via the Open API V2.
 * Handles authentication, token management, and API requests.
 */

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

interface ApiResponse<T = any> {
  code: string;
  time: number;
  msgid?: number;
  method?: string;
  desc: string;
  data?: T;
}

interface Device {
  deviceId: string;
  deviceUDID: string;
  name: string;
  token: string;
  type: string;
  modelName: string;
  parentDeviceId: string | null;
  serviceZone: string | null;
}

interface HomeInfo {
  id: string;
}

interface DeviceState {
  [key: string]: any;
}

export class YoSmartAPIClient {
  private static readonly TOKEN_URL = 'https://api.yosmart.com/open/yolink/token';
  private static readonly API_URL = 'https://api.yosmart.com/open/yolink/v2/api';
  private static readonly PRODUCTION_URL = 'https://api.yosmart.com/open/production/v2/api';

  private uaid: string;
  private secretKey: string;
  private autoRefresh: boolean;

  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiresAt: Date | null = null;

  private homeId: string | null = null;
  private devices: Device[] = [];

  constructor(uaid: string, secretKey: string, autoRefresh: boolean = true) {
    this.uaid = uaid;
    this.secretKey = secretKey;
    this.autoRefresh = autoRefresh;
  }

  /**
   * Authenticate and get access token
   */
  async authenticate(): Promise<boolean> {
    try {
      const params = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.uaid,
        client_secret: this.secretKey
      });

      const response = await fetch(YoSmartAPIClient.TOKEN_URL, {
        method: 'POST',
        body: params.toString()
      });

      if (!response.ok) {
        console.error(`Authentication failed: ${response.status}`);
        return false;
      }

      const data: TokenResponse = await response.json();
      this.accessToken = data.access_token;
      this.refreshToken = data.refresh_token;
      this.tokenExpiresAt = new Date(Date.now() + (data.expires_in * 1000));

      console.log(`✓ Authentication successful. Token expires at ${this.tokenExpiresAt}`);
      return true;
    } catch (error) {
      console.error(`Authentication error: ${error}`);
      return false;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) {
      console.warn('No refresh token available. Re-authenticating.');
      return this.authenticate();
    }

    try {
      const params = new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: this.uaid,
        refresh_token: this.refreshToken
      });

      const response = await fetch(YoSmartAPIClient.TOKEN_URL, {
        method: 'POST',
        body: params.toString()
      });

      if (!response.ok) {
        console.error(`Token refresh failed: ${response.status}`);
        return false;
      }

      const data: TokenResponse = await response.json();
      this.accessToken = data.access_token;
      this.tokenExpiresAt = new Date(Date.now() + (data.expires_in * 1000));

      console.log(`✓ Token refreshed. New expiration: ${this.tokenExpiresAt}`);
      return true;
    } catch (error) {
      console.error(`Token refresh error: ${error}`);
      return false;
    }
  }

  /**
   * Ensure token is valid, refresh if needed
   */
  private async ensureValidToken(): Promise<boolean> {
    if (!this.accessToken) {
      return this.authenticate();
    }

    // Check if token expires in next 5 minutes
    if (this.autoRefresh && this.tokenExpiresAt) {
      const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
      if (this.tokenExpiresAt < fiveMinutesFromNow) {
        console.log('Token expiring soon, refreshing...');
        return this.refreshAccessToken();
      }
    }

    return true;
  }

  /**
   * Call YoSmart API
   */
  private async callApi<T>(
    method: string,
    params?: Record<string, any>,
    url: string = YoSmartAPIClient.API_URL
  ): Promise<ApiResponse<T>> {
    if (!(await this.ensureValidToken())) {
      return {
        code: '999999',
        time: Date.now(),
        desc: 'Failed to obtain valid token'
      };
    }

    const payload = {
      method,
      time: Date.now(),
      ...(params && { ...params })
    };

    try {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.accessToken}`
      };

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        console.error(`API call failed: ${response.status}`);
        return {
          code: response.status.toString(),
          time: Date.now(),
          desc: `HTTP ${response.status} error`
        };
      }

      return await response.json();
    } catch (error) {
      console.error(`API call error: ${error}`);
      return {
        code: '999999',
        time: Date.now(),
        desc: String(error)
      };
    }
  }

  /**
   * Get home general information
   */
  async getHomeInfo(): Promise<HomeInfo | null> {
    const result = await this.callApi<HomeInfo>('Home.getGeneralInfo');

    if (result.code === '000000' && result.data) {
      this.homeId = result.data.id;
      console.log(`✓ Home ID: ${this.homeId}`);
      return result.data;
    } else {
      console.error(`Failed to get home info: ${result.desc}`);
      return null;
    }
  }

  /**
   * Get list of all devices in home
   */
  async getDevices(): Promise<Device[]> {
    const result = await this.callApi<{ devices: Device[] }>('Home.getDeviceList');

    if (result.code === '000000' && result.data) {
      this.devices = result.data.devices;
      console.log(`✓ Found ${this.devices.length} devices`);
      return this.devices;
    } else {
      console.error(`Failed to get devices: ${result.desc}`);
      return [];
    }
  }

  /**
   * Get state of a specific device
   */
  async getDeviceState(deviceId: string, deviceToken: string): Promise<DeviceState | null> {
    const result = await this.callApi<DeviceState>('Hub.getState', {
      targetDevice: {
        deviceId,
        token: deviceToken
      }
    });

    if (result.code === '000000') {
      return result.data || null;
    } else {
      console.error(`Failed to get device state: ${result.desc}`);
      return null;
    }
  }

  /**
   * Control a device
   */
  async controlDevice(
    deviceId: string,
    deviceToken: string,
    method: string,
    params?: Record<string, any>
  ): Promise<ApiResponse> {
    const payload: Record<string, any> = {
      targetDevice: {
        deviceId,
        token: deviceToken
      }
    };

    if (params) {
      Object.assign(payload, params);
    }

    return this.callApi(method, payload);
  }

  // ===== Device Production API Methods =====

  /**
   * Request device IDs for production
   */
  async requestDeviceIds(size: number): Promise<string[]> {
    const result = await this.callApi<{ deviceIdList: string[] }>(
      'requestDeviceId',
      { params: { size } },
      YoSmartAPIClient.PRODUCTION_URL
    );

    if (result.code === '000000' && result.data) {
      return result.data.deviceIdList;
    } else {
      console.error(`Failed to request device IDs: ${result.desc}`);
      return [];
    }
  }

  /**
   * Activate a device ID
   */
  async activateDeviceId(
    chipId: string,
    appEui: string,
    deviceId?: string
  ): Promise<string | null> {
    const params: any = {
      params: {
        chipId,
        appEui
      }
    };

    if (deviceId) {
      params.params.deviceId = deviceId;
    }

    const result = await this.callApi<{ deviceId: string }>(
      'activateDeviceId',
      params,
      YoSmartAPIClient.PRODUCTION_URL
    );

    if (result.code === '000000' && result.data) {
      return result.data.deviceId;
    } else {
      console.error(`Failed to activate device: ${result.desc}`);
      return null;
    }
  }

  /**
   * Request serial numbers
   */
  async requestSerialNumbers(size: number): Promise<string[]> {
    const result = await this.callApi<{ snList: string[] }>(
      'requestSN',
      { params: { size } },
      YoSmartAPIClient.PRODUCTION_URL
    );

    if (result.code === '000000' && result.data) {
      return result.data.snList;
    } else {
      console.error(`Failed to request SNs: ${result.desc}`);
      return [];
    }
  }

  /**
   * Bind serial number to device
   */
  async bindSerialNumber(deviceId: string, sn?: string): Promise<string | null> {
    const params: any = {
      params: {
        deviceId
      }
    };

    if (sn) {
      params.params.sn = sn;
    }

    const result = await this.callApi<{ sn: string }>(
      'bindSN',
      params,
      YoSmartAPIClient.PRODUCTION_URL
    );

    if (result.code === '000000' && result.data) {
      return result.data.sn;
    } else {
      console.error(`Failed to bind SN: ${result.desc}`);
      return null;
    }
  }

  /**
   * Get current client status
   */
  getStatus() {
    return {
      authenticated: this.accessToken !== null,
      tokenValid: this.tokenExpiresAt ? new Date() < this.tokenExpiresAt : false,
      tokenExpiresAt: this.tokenExpiresAt?.toISOString() || null,
      homeId: this.homeId,
      deviceCount: this.devices.length
    };
  }

  /**
   * Get cached devices
   */
  getCachedDevices(): Device[] {
    return this.devices;
  }

  /**
   * Get cached home ID
   */
  getHomeId(): string | null {
    return this.homeId;
  }
}

/**
 * Create YoSmart API client using environment variables or provided credentials
 */
export function createClient(
  uaid?: string,
  secretKey?: string
): YoSmartAPIClient {
  const finalUaid = uaid || process.env.YOSMART_UAID;
  const finalSecret = secretKey || process.env.YOSMART_SECRET;

  if (!finalUaid || !finalSecret) {
    throw new Error('UAID and secretKey must be provided or set as environment variables');
  }

  return new YoSmartAPIClient(finalUaid, finalSecret);
}

// Example usage
(async () => {
  try {
    // Initialize client
    const client = new YoSmartAPIClient(
      'ua_F6E72EAE63AC43FAA6F068C832C7734B',
      'sec_v1_jIC+e8dZoCmthweOFlBb4A=='
    );

    // Authenticate
    if (await client.authenticate()) {
      console.log('✓ Authenticated');

      // Get home info
      await client.getHomeInfo();

      // Get devices
      const devices = await client.getDevices();
      console.log(`✓ Found ${devices.length} devices`);

      // Print devices
      devices.forEach(device => {
        console.log(`  - ${device.name} (${device.type})`);
      });

      // Print status
      console.log('\nClient Status:', client.getStatus());
    } else {
      console.log('✗ Authentication failed');
    }
  } catch (error) {
    console.error('Error:', error);
  }
})();
