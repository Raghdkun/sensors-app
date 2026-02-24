<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Http\JsonResponse;

class YoSmartController extends Controller
{
    private const TOKEN_CACHE_KEY = 'yosmart_access_token';
    private const DEVICES_CACHE_KEY = 'yosmart_devices';
    private const CACHE_TTL = 3600; // 1 hour

    private string $uaid;
    private string $secret;
    private string $tokenUrl = 'https://api.yosmart.com/open/yolink/token';
    private string $apiUrl = 'https://api.yosmart.com/open/yolink/v2/api';

    /**
     * Map of device types to their API method prefix.
     * Each device type in the YoSmart API has its own `{Type}.getState` method.
     * Using the wrong method (e.g. Hub.getState for a THSensor) causes error 000103.
     *
     * @see https://doc.yosmart.com/docs/yolinkapi/
     */
    private const DEVICE_TYPE_MAP = [
        'Hub'                 => 'Hub',
        'CellularHub'         => 'CellularHub',
        'SpeakerHub'          => 'SpeakerHub',
        'THSensor'            => 'THSensor',
        'DoorSensor'          => 'DoorSensor',
        'MotionSensor'        => 'MotionSensor',
        'LeakSensor'          => 'LeakSensor',
        'VibrationSensor'     => 'VibrationSensor',
        'COSmokeSensor'       => 'COSmokeSensor',
        'SmartRemoter'        => 'SmartRemoter',
        'InfraredRemoter'     => 'InfraredRemoter',
        'Outlet'              => 'Outlet',
        'MultiOutlet'         => 'MultiOutlet',
        'Switch'              => 'Switch',
        'Dimmer'              => 'Dimmer',
        'Lock'                => 'Lock',
        'LockV2'              => 'LockV2',
        'GarageDoor'          => 'GarageDoor',
        'Finger'              => 'Finger',
        'Siren'               => 'Siren',
        'Manipulator'         => 'Manipulator',
        'Sprinkler'           => 'Sprinkler',
        'SprinklerV2'         => 'SprinklerV2',
        'Thermostat'          => 'Thermostat',
        'IPCamera'            => 'IPCamera',
        'PowerFailureAlarm'   => 'PowerFailureAlarm',
        'SoilThcSensor'       => 'SoilThcSensor',
        'WaterDepthSensor'    => 'WaterDepthSensor',
        'WaterMeterController'=> 'WaterMeterController',
        'CSDevice'            => 'CSDevice',
    ];

    public function __construct()
    {
        $this->uaid = config('services.yosmart.uaid', '');
        $this->secret = config('services.yosmart.secret', '');
    }

    /**
     * Get or refresh access token
     */
    private function getAccessToken(): ?string
    {
        // Check cache first
        $token = Cache::get(self::TOKEN_CACHE_KEY);
        
        if ($token) {
            \Log::debug('Using cached YoSmart token');
            return $token;
        }

        try {
            \Log::info('Fetching new YoSmart access token');
            
            $response = Http::asForm()->post($this->tokenUrl, [
                'grant_type' => 'client_credentials',
                'client_id' => $this->uaid,
                'client_secret' => $this->secret,
            ]);

            if ($response->successful()) {
                $data = $response->json();
                $token = $data['access_token'] ?? null;
                $expiresIn = $data['expires_in'] ?? 3600;

                if ($token) {
                    // Cache token with 5 minute safety margin
                    $ttl = max(300, $expiresIn - 300);
                    Cache::put(
                        self::TOKEN_CACHE_KEY,
                        $token,
                        now()->addSeconds($ttl)
                    );

                    \Log::info('New YoSmart token obtained', [
                        'expires_in' => $expiresIn,
                        'cache_ttl' => $ttl
                    ]);

                    return $token;
                }
            } else {
                \Log::error('YoSmart token response error', [
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);
            }
        } catch (\Exception $e) {
            \Log::error('YoSmart token fetch error: ' . $e->getMessage());
        }

        return null;
    }

    /** Error codes that indicate the access token needs refreshing */
    private const TOKEN_ERROR_CODES = [
        '010103', // Authorization is invalid
        '010104', // Token is expired
    ];

    /**
     * Force-refresh the access token by clearing the cache and fetching a new one.
     */
    private function refreshAccessToken(): ?string
    {
        \Log::info('Force-refreshing YoSmart access token');
        Cache::forget(self::TOKEN_CACHE_KEY);

        return $this->getAccessToken();
    }

    /**
     * Make API call to YoSmart.
     * Automatically retries once with a fresh access token when the API
     * returns a token-invalid or token-expired error.
     */
    public function callApi(
        string $method,
        array $additionalParams = [],
        ?string $url = null,
        bool $isRetry = false
    ): ?array {
        $token = $this->getAccessToken();
        
        if (!$token) {
            \Log::error('Failed to obtain YoSmart access token');
            return null;
        }

        $url = $url ?? $this->apiUrl;
        
        $payload = [
            'method' => $method,
            'time' => intval(microtime(true) * 1000),
        ];

        // Merge additional parameters
        if (!empty($additionalParams)) {
            $payload = array_merge($payload, $additionalParams);
        }

        try {
            \Log::debug('Calling YoSmart API', [
                'method' => $method,
                'url' => $url,
                'isRetry' => $isRetry,
                'payload' => $payload,
            ]);

            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
                'Authorization' => "Bearer {$token}"
            ])->timeout(10)->post($url, $payload);

            if ($response->successful()) {
                $result = $response->json();
                $code = $result['code'] ?? null;
                
                if ($code === '000000') {
                    \Log::debug('YoSmart API call successful', ['method' => $method]);
                    return $result;
                }

                // If the error is a token issue and we haven't retried yet,
                // refresh the access token and retry the call once.
                if (!$isRetry && in_array($code, self::TOKEN_ERROR_CODES, true)) {
                    \Log::warning('YoSmart token error, refreshing and retrying', [
                        'method' => $method,
                        'code' => $code,
                        'desc' => $result['desc'] ?? '',
                    ]);

                    $newToken = $this->refreshAccessToken();
                    if ($newToken) {
                        return $this->callApi($method, $additionalParams, $url, true);
                    }
                }

                \Log::warning('YoSmart API error response', [
                    'method' => $method,
                    'code' => $code,
                    'desc' => $result['desc'] ?? 'No description'
                ]);

                return $result;
            } else {
                \Log::error('YoSmart API HTTP error', [
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);
            }
        } catch (\Exception $e) {
            \Log::error('YoSmart API call error: ' . $e->getMessage(), [
                'method' => $method,
                'exception' => get_class($e)
            ]);
        }

        return null;
    }

    /**
     * Get all devices
     */
    public function listDevices(): JsonResponse
    {
        try {
            $result = $this->callApi('Home.getDeviceList');

            if ($result && ($result['code'] ?? null) === '000000') {
                $devices = $result['data']['devices'] ?? [];
                
                // Cache devices list
                Cache::put(self::DEVICES_CACHE_KEY, $devices, self::CACHE_TTL);
                
                return response()->json([
                    'success' => true,
                    'devices' => $devices,
                    'count' => count($devices)
                ]);
            } else {
                $errorDesc = $result['desc'] ?? 'Unknown error occurred';
                $errorCode = $result['code'] ?? 'unknown';
                
                return response()->json([
                    'success' => false,
                    'error' => $errorDesc,
                    'code' => $errorCode
                ], 400);
            }
        } catch (\Exception $e) {
            \Log::error('List devices error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get home info
     */
    public function homeInfo(): JsonResponse
    {
        try {
            $result = $this->callApi('Home.getGeneralInfo');

            if ($result && ($result['code'] ?? null) === '000000') {
                return response()->json([
                    'success' => true,
                    'home' => $result['data'] ?? null
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'error' => $result['desc'] ?? 'Unknown error'
                ], 400);
            }
        } catch (\Exception $e) {
            \Log::error('Home info error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Resolve the correct API method for getting a device's state.
     *
     * Each YoSmart device type has its own `{Type}.getState` endpoint.
     * Using the wrong type (e.g. Hub.getState for a THSensor) returns
     * error 000103 "Token is invalid" because the Hub rejects the token.
     *
     * @see https://doc.yosmart.com/docs/yolinkapi/
     */
    private function resolveGetStateMethod(string $deviceType): string
    {
        // Direct match
        if (isset(self::DEVICE_TYPE_MAP[$deviceType])) {
            return self::DEVICE_TYPE_MAP[$deviceType] . '.getState';
        }

        // Try case-insensitive match
        foreach (self::DEVICE_TYPE_MAP as $key => $prefix) {
            if (strcasecmp($key, $deviceType) === 0) {
                return $prefix . '.getState';
            }
        }

        // Fallback: use the raw device type from the API (best effort)
        \Log::warning("Unknown device type '{$deviceType}', using as-is for getState");
        return $deviceType . '.getState';
    }

    /**
     * Get device state using the device-type-specific getState method.
     *
     * According to the YoSmart API, each device type has its own method:
     *   - Hub.getState        → for Hub devices
     *   - THSensor.getState   → for temperature/humidity sensors
     *   - DoorSensor.getState → for door sensors
     *   - etc.
     *
     * The `deviceType` field from Home.getDeviceList tells us which method to use.
     */
    public function deviceState(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'deviceId' => 'required|string|max:100',
            'deviceToken' => 'required|string|max:200',
            'deviceType' => 'required|string|max:50'
        ]);

        $deviceType = $validated['deviceType'];
        $method = $this->resolveGetStateMethod($deviceType);

        try {
            \Log::debug("Getting device state", [
                'deviceId' => $validated['deviceId'],
                'deviceType' => $deviceType,
                'method' => $method,
            ]);

            $result = $this->callApi($method, [
                'targetDevice' => $validated['deviceId'],
                'token' => $validated['deviceToken'],
            ]);

            if ($result && ($result['code'] ?? null) === '000000') {
                return response()->json([
                    'success' => true,
                    'state' => $result['data'] ?? null,
                    'deviceType' => $deviceType,
                    'method' => $method,
                ]);
            } else {
                $errorCode = $result['code'] ?? 'unknown';
                $errorDesc = $result['desc'] ?? 'Unknown error';
                
                \Log::warning('YoSmart device state error', [
                    'deviceType' => $deviceType,
                    'method' => $method,
                    'code' => $errorCode,
                    'desc' => $errorDesc
                ]);
                
                return response()->json([
                    'success' => false,
                    'error' => $errorDesc,
                    'code' => $errorCode,
                    'hint' => $this->getErrorHint($errorCode)
                ], 400);
            }
        } catch (\Exception $e) {
            \Log::error('Device state error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get the state of ALL devices in a single request.
     * Iterates the saved device list and calls the appropriate
     * {DeviceType}.getState for each one.
     */
    public function allDeviceStates(): JsonResponse
    {
        try {
            // First get fresh device list
            $listResult = $this->callApi('Home.getDeviceList');

            if (!$listResult || ($listResult['code'] ?? null) !== '000000') {
                return response()->json([
                    'success' => false,
                    'error' => $listResult['desc'] ?? 'Failed to fetch device list',
                ], 400);
            }

            $devices = $listResult['data']['devices'] ?? [];
            Cache::put(self::DEVICES_CACHE_KEY, $devices, self::CACHE_TTL);

            $states = [];
            foreach ($devices as $device) {
                $deviceId   = $device['deviceId'];
                $deviceType = $device['type'] ?? 'unknown';
                $token      = $device['token'] ?? null;

                if (!$token) {
                    $states[] = [
                        'deviceId'   => $deviceId,
                        'deviceType' => $deviceType,
                        'name'       => $device['name'] ?? '',
                        'success'    => false,
                        'error'      => 'No token available',
                    ];
                    continue;
                }

                $method = $this->resolveGetStateMethod($deviceType);

                $result = $this->callApi($method, [
                    'targetDevice' => $deviceId,
                    'token'        => $token,
                ]);

                if ($result && ($result['code'] ?? null) === '000000') {
                    $states[] = [
                        'deviceId'   => $deviceId,
                        'deviceType' => $deviceType,
                        'name'       => $device['name'] ?? '',
                        'modelName'  => $device['modelName'] ?? '',
                        'success'    => true,
                        'state'      => $result['data'] ?? null,
                        'method'     => $method,
                    ];
                } else {
                    $states[] = [
                        'deviceId'   => $deviceId,
                        'deviceType' => $deviceType,
                        'name'       => $device['name'] ?? '',
                        'modelName'  => $device['modelName'] ?? '',
                        'success'    => false,
                        'error'      => $result['desc'] ?? 'Unknown error',
                        'code'       => $result['code'] ?? 'unknown',
                        'method'     => $method,
                    ];
                }
            }

            return response()->json([
                'success' => true,
                'devices' => $states,
                'count'   => count($states),
                'successCount' => count(array_filter($states, fn($s) => $s['success'])),
            ]);
        } catch (\Exception $e) {
            \Log::error('All device states error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Provide helpful error hints based on YoSmart error code
     */
    private function getErrorHint(string $errorCode): string
    {
        $hints = [
            '000101' => 'Cannot connect to Hub. Ensure the Hub is powered on and connected to the network.',
            '000102' => 'Hub cannot respond to this command. The Hub may be busy or the command is unsupported.',
            '000103' => 'Token is invalid. This can happen if the device list is stale (try refreshing), or the wrong API method is being used for this device type.',
            '000104' => 'Hub token is invalid. Try refreshing the device list to get updated tokens.',
            '000201' => 'Cannot connect to the device. Check that the device is powered on and in range of the Hub.',
            '000202' => 'Device cannot respond to this command. The device may not support this operation.',
            '010104' => 'Access token expired. The app will automatically refresh it on the next request.',
            '010203' => 'Method is not supported for this device type. The device type mapping may need updating.',
            '020101' => 'Device does not exist. Refresh the device list to verify.',
        ];

        return $hints[$errorCode] ?? "Error code {$errorCode}. See YoSmart API error codes documentation.";
    }

    /**
     * Control device
     */
    public function controlDevice(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'deviceId' => 'required|string|max:100',
            'deviceToken' => 'required|string|max:200',
            'method' => 'required|string|max:100',
            'params' => 'nullable|array'
        ]);

        try {
            $payload = [
                'targetDevice' => $validated['deviceId'],
                'token' => $validated['deviceToken'],
            ];

            // Add params if provided
            if (!empty($validated['params'])) {
                $payload['params'] = $validated['params'];
            }

            $result = $this->callApi($validated['method'], $payload);

            if ($result && ($result['code'] ?? null) === '000000') {
                return response()->json([
                    'success' => true,
                    'data' => $result['data'] ?? null
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'error' => $result['desc'] ?? 'Unknown error',
                    'code' => $result['code'] ?? 'unknown'
                ], 400);
            }
        } catch (\Exception $e) {
            \Log::error('Control device error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Health check - verify API connectivity
     */
    public function health(): JsonResponse
    {
        try {
            $result = $this->callApi('Home.getGeneralInfo');
            
            $healthy = $result && ($result['code'] ?? null) === '000000';

            return response()->json([
                'status' => $healthy ? 'ok' : 'error',
                'yosmart_api' => $healthy ? 'connected' : 'disconnected',
                'credentials_configured' => !empty($this->uaid) && !empty($this->secret)
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'yosmart_api' => 'disconnected',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
