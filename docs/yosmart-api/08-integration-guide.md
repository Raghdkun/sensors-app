# YoSmart Dashboard Integration Guide

## Overview
This guide provides step-by-step instructions for integrating YoSmart device management into your sensor-app dashboard.

## Project Structure

```
sensor-app/
├── resources/js/
│   ├── actions/          ← API route handlers
│   ├── components/       ← React components
│   ├── hooks/            ← Custom React hooks
│   ├── pages/            ← Page components
│   └── lib/              ← Utility libraries
├── app/
│   ├── Http/
│   │   ├── Controllers/  ← Backend controllers
│   │   └── Middleware/   ← Middleware
│   ├── Models/           ← Database models
│   └── Actions/          ← Laravel actions
├── docs/yosmart-api/     ← API documentation (THIS FOLDER)
└── .env                  ← Configuration
```

---

## Phase 1: Backend Setup (Laravel)

### Step 1.1: Create Actions for YoSmart API

Create file: `app/Actions/FetchYoSmartDevices.ts`

```typescript
// resources/js/actions/yosmart.ts
import route from 'ziggy-js';

export async function fetchYoSmartDevices() {
  return await fetch(route('yosmart.devices.list'), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }
  }).then(res => res.json());
}

export async function fetchYoSmartHome() {
  return await fetch(route('yosmart.home.info'), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }
  }).then(res => res.json());
}

export async function getDeviceState(deviceId: string, deviceToken: string) {
  return await fetch(route('yosmart.device.state'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      deviceId,
      deviceToken
    })
  }).then(res => res.json());
}

export async function controlDevice(
  deviceId: string,
  deviceToken: string,
  method: string,
  params?: Record<string, any>
) {
  return await fetch(route('yosmart.device.control'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      deviceId,
      deviceToken,
      method,
      params
    })
  }).then(res => res.json());
}
```

### Step 1.2: Create Laravel Controller

Create file: `app/Http/Controllers/YoSmartController.php`

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;

class YoSmartController extends Controller
{
    private const TOKEN_CACHE_KEY = 'yosmart_access_token';
    private const DEVICES_CACHE_KEY = 'yosmart_devices';
    private const CACHE_TTL = 3600; // 1 hour

    private string $uaid = '';
    private string $secret = '';
    private string $tokenUrl = 'https://api.yosmart.com/open/yolink/token';
    private string $apiUrl = 'https://api.yosmart.com/open/yolink/v2/api';

    public function __construct()
    {
        $this->uaid = config('services.yosmart.uaid');
        $this->secret = config('services.yosmart.secret');
    }

    /**
     * Get or refresh access token
     */
    private function getAccessToken(): ?string
    {
        $token = Cache::get(self::TOKEN_CACHE_KEY);
        
        if ($token) {
            return $token;
        }

        try {
            $response = Http::post($this->tokenUrl, [
                'grant_type' => 'client_credentials',
                'client_id' => $this->uaid,
                'client_secret' => $this->secret,
            ]);

            if ($response->successful()) {
                $data = $response->json();
                $token = $data['access_token'];
                $expiresIn = $data['expires_in'] ?? 3600;

                // Cache token with 5 minute safety margin
                Cache::put(
                    self::TOKEN_CACHE_KEY,
                    $token,
                    now()->addSeconds($expiresIn - 300)
                );

                return $token;
            }
        } catch (\Exception $e) {
            \Log::error('YoSmart token fetch error: ' . $e->getMessage());
        }

        return null;
    }

    /**
     * Make API call to YoSmart
     */
    private function callApi(
        string $method,
        array $params = [],
        string $url = null
    ): ?array {
        $token = $this->getAccessToken();
        
        if (!$token) {
            return null;
        }

        $url = $url ?? $this->apiUrl;
        $payload = [
            'method' => $method,
            'time' => intval(microtime(true) * 1000),
            ...$params
        ];

        try {
            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
                'Authorization' => "Bearer {$token}"
            ])->post($url, $payload);

            return $response->json();
        } catch (\Exception $e) {
            \Log::error('YoSmart API call error: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Get all devices
     */
    public function listDevices()
    {
        try {
            $result = $this->callApi('Home.getDeviceList');

            if ($result && $result['code'] === '000000') {
                $devices = $result['data']['devices'] ?? [];
                Cache::put(self::DEVICES_CACHE_KEY, $devices, self::CACHE_TTL);
                
                return response()->json([
                    'success' => true,
                    'devices' => $devices
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'error' => $result['desc'] ?? 'Unknown error'
                ], 400);
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get home info
     */
    public function homeInfo()
    {
        try {
            $result = $this->callApi('Home.getGeneralInfo');

            if ($result && $result['code'] === '000000') {
                return response()->json([
                    'success' => true,
                    'home' => $result['data']
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'error' => $result['desc'] ?? 'Unknown error'
                ], 400);
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get device state
     */
    public function deviceState(Request $request)
    {
        $validated = $request->validate([
            'deviceId' => 'required|string',
            'deviceToken' => 'required|string'
        ]);

        try {
            $result = $this->callApi('Hub.getState', [
                'targetDevice' => [
                    'deviceId' => $validated['deviceId'],
                    'token' => $validated['deviceToken']
                ]
            ]);

            if ($result && $result['code'] === '000000') {
                return response()->json([
                    'success' => true,
                    'state' => $result['data']
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'error' => $result['desc'] ?? 'Unknown error'
                ], 400);
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Control device
     */
    public function controlDevice(Request $request)
    {
        $validated = $request->validate([
            'deviceId' => 'required|string',
            'deviceToken' => 'required|string',
            'method' => 'required|string',
            'params' => 'nullable|array'
        ]);

        try {
            $payload = [
                'targetDevice' => [
                    'deviceId' => $validated['deviceId'],
                    'token' => $validated['deviceToken']
                ]
            ];

            if (!empty($validated['params'])) {
                $payload = array_merge($payload, $validated['params']);
            }

            $result = $this->callApi($validated['method'], $payload);

            if ($result && $result['code'] === '000000') {
                return response()->json([
                    'success' => true,
                    'data' => $result['data']
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'error' => $result['desc'] ?? 'Unknown error'
                ], 400);
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
```

### Step 1.3: Configure Routes

Add to `routes/web.php`:

```php
Route::middleware(['auth'])->group(function () {
    // YoSmart API routes
    Route::get('/api/yosmart/devices', [YoSmartController::class, 'listDevices'])->name('yosmart.devices.list');
    Route::get('/api/yosmart/home', [YoSmartController::class, 'homeInfo'])->name('yosmart.home.info');
    Route::post('/api/yosmart/device/state', [YoSmartController::class, 'deviceState'])->name('yosmart.device.state');
    Route::post('/api/yosmart/device/control', [YoSmartController::class, 'controlDevice'])->name('yosmart.device.control');
});
```

### Step 1.4: Configure Environment

Add to `.env`:

```env
YOSMART_UAID=ua_F6E72EAE63AC43FAA6F068C832C7734B
YOSMART_SECRET=sec_v1_jIC+e8dZoCmthweOFlBb4A==
```

Add to `config/services.php`:

```php
'yosmart' => [
    'uaid' => env('YOSMART_UAID'),
    'secret' => env('YOSMART_SECRET'),
],
```

---

## Phase 2: Frontend Setup (React/TypeScript)

### Step 2.1: Create Hook for Device Management

Create file: `resources/js/hooks/useYoSmartDevices.ts`

```typescript
import { useState, useEffect, useCallback } from 'react';
import { fetchYoSmartDevices, fetchYoSmartHome, getDeviceState, controlDevice } from '@/actions/yosmart';

interface Device {
  deviceId: string;
  name: string;
  type: string;
  token: string;
  [key: string]: any;
}

interface HomeInfo {
  id: string;
  [key: string]: any;
}

export function useYoSmartDevices() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [home, setHome] = useState<HomeInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch devices
  const loadDevices = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetchYoSmartDevices();
      
      if (response.success) {
        setDevices(response.devices);
        setError(null);
      } else {
        setError(response.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch home info
  const loadHome = useCallback(async () => {
    try {
      const response = await fetchYoSmartHome();
      
      if (response.success) {
        setHome(response.home);
      } else {
        setError(response.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, []);

  // Get device state
  const getState = useCallback(async (deviceId: string, deviceToken: string) => {
    try {
      const response = await getDeviceState(deviceId, deviceToken);
      
      if (response.success) {
        return response.state;
      } else {
        throw new Error(response.error);
      }
    } catch (err) {
      console.error('Failed to get device state:', err);
      return null;
    }
  }, []);

  // Control device
  const control = useCallback(async (
    deviceId: string,
    deviceToken: string,
    method: string,
    params?: Record<string, any>
  ) => {
    try {
      const response = await controlDevice(deviceId, deviceToken, method, params);
      
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.error);
      }
    } catch (err) {
      console.error('Failed to control device:', err);
      return null;
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadDevices();
    loadHome();
  }, [loadDevices, loadHome]);

  return {
    devices,
    home,
    loading,
    error,
    refresh: loadDevices,
    getState,
    control
  };
}
```

### Step 2.2: Create Device List Component

Create file: `resources/js/components/YoSmartDeviceList.tsx`

```typescript
import React from 'react';
import { useYoSmartDevices } from '@/hooks/useYoSmartDevices';

export function YoSmartDeviceList() {
  const { devices, loading, error, refresh } = useYoSmartDevices();

  if (loading) {
    return <div className="p-4">Loading devices...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">Error: {error}</div>;
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">YoSmart Devices</h2>
        <button
          onClick={() => refresh()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Refresh
        </button>
      </div>

      {devices.length === 0 ? (
        <p className="text-gray-500">No devices found</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {devices.map(device => (
            <DeviceCard key={device.deviceId} device={device} />
          ))}
        </div>
      )}
    </div>
  );
}

function DeviceCard({ device }: { device: any }) {
  const { getState } = useYoSmartDevices();
  const [state, setState] = React.useState<any>(null);
  const [loadingState, setLoadingState] = React.useState(false);

  const handleRefreshState = async () => {
    setLoadingState(true);
    const newState = await getState(device.deviceId, device.token);
    setState(newState);
    setLoadingState(false);
  };

  return (
    <div className="border rounded-lg p-4 shadow">
      <div className="mb-2">
        <h3 className="text-lg font-semibold">{device.name}</h3>
        <p className="text-gray-600 text-sm">{device.type}</p>
        <p className="text-gray-500 text-xs">{device.modelName}</p>
      </div>

      <div className="mb-4">
        <button
          onClick={handleRefreshState}
          disabled={loadingState}
          className="px-3 py-1 bg-gray-200 rounded text-sm hover:bg-gray-300 disabled:opacity-50"
        >
          {loadingState ? 'Loading...' : 'Get State'}
        </button>
      </div>

      {state && (
        <div className="bg-gray-50 p-2 rounded text-xs">
          <pre>{JSON.stringify(state, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
```

### Step 2.3: Add to Dashboard Page

```typescript
// resources/js/pages/Dashboard.tsx
import { YoSmartDeviceList } from '@/components/YoSmartDeviceList';

export default function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      <YoSmartDeviceList />
    </div>
  );
}
```

---

## Phase 3: Testing

### Manual Testing

1. **Test Backend Routes**
   ```bash
   # Authenticate first
   curl http://localhost:8000/api/yosmart/devices
   ```

2. **Test in Browser**
   - Navigate to `/dashboard`
   - Should see device list
   - Try "Refresh" and "Get State" buttons

3. **Test Device Control**
   ```bash
   curl -X POST http://localhost:8000/api/yosmart/device/control \
     -H "Content-Type: application/json" \
     -d '{
       "deviceId": "YOUR_DEVICE_ID",
       "deviceToken": "YOUR_DEVICE_TOKEN",
       "method": "Switch.setSwitch",
       "params": {"targetDevice": ..., "params": {"switch": "on"}}
     }'
   ```

---

## Phase 4: Production Considerations

### Security
- ✓ Store credentials in environment variables
- ✓ Use HTTPS only in production
- ✓ Implement rate limiting
- ✓ Add request validation
- ✓ Log API errors for debugging

### Performance
- ✓ Cache device list (30 seconds)
- ✓ Cache access tokens (with safety margin)
- ✓ Implement pagination for large device lists
- ✓ Add request timeouts

### Monitoring
- ✓ Log all API calls and responses
- ✓ Monitor token refresh failures
- ✓ Alert on device connectivity issues
- ✓ Track API error rates

---

## Troubleshooting

### "Unauthorized" Errors
- Check UAID and Secret Key in `.env`
- Verify credentials are not expired
- Check Bearer token format

### "Device Not Found"
- Verify device exists in YoLink app
- Check device is online
- Verify deviceId and token are correct

### "Rate Limited"
- Implement exponential backoff
- Check request frequency
- Review API rate limits

### "Token Expired"
- Ensure cache invalidation works
- Check token refresh logic
- Verify expires_in value

---

## Related Documentation
- [UAC Quick Start](05-uac-quickstart.md)
- [Error Codes](06-error-codes.md)
- [Data Packet Format](04-datapacket.md)

---

**Last Updated**: February 23, 2026
