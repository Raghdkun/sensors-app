# YoSmart API - Device Production API

## Overview
The Device Production API provides methods that allow authorized customers to request and manage key data required for device production processes on the YoSmart platform. This API is designed for manufacturers and authorized partners to optimize workflows, reduce manual effort, and ensure efficient tracking throughout the manufacturing lifecycle.

---

## Protocol

### Endpoint
```
POST /open/production/v2/api
```

### Full URL
```
https://api.yosmart.com/open/production/v2/api
```

### Request Headers

| Header | Value | Required | Description |
|--------|-------|----------|-------------|
| Content-Type | application/json | Yes | Request/response must be JSON formatted |
| Authorization | Bearer ${access_token} | Yes | Access token (from Manage.createAccessToken for CSID) |

### Access Token
⚠️ **IMPORTANT**:
- For CSID access, obtain token via `Manage.createAccessToken` method
- The `scope` of the access_token **must include** `production/*`

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| method | String | Yes | API method to call (see Methods section) |
| params | Object | No | Parameters for the specific method |

### Response Body

| Field | Type | Description |
|-------|------|-------------|
| code | String | "000000" = success, others = failure |
| data | Object | Data returned from the API method |

---

## Methods

### 2.1 Request DeviceIds

#### Purpose
Request a specified number of device IDs from YoSmart. Each Device ID should be unique and will be used for device identification.

⚠️ **CAUTION**: Sufficient Device Licenses Required

#### Endpoint Method
```
requestDeviceId
```

#### Request Example
```json
{
  "method": "requestDeviceId",
  "params": {
    "size": 10
  }
}
```

#### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| method | String | Yes | "requestDeviceId" |
| params.size | Number | Yes | Number of device IDs to request |

#### Response Format
```json
{
  "code": "000000",
  "data": {
    "deviceIdList": [
      "device_id_1",
      "device_id_2",
      "device_id_3",
      "..."
    ]
  }
}
```

#### Response Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| code | String | "000000" indicates success |
| data.deviceIdList | Array<String> | List of requested device IDs |

#### cURL Example
```bash
curl -X POST https://api.yosmart.com/open/production/v2/api \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${access_token}" \
  -d '{
    "method": "requestDeviceId",
    "params": {
      "size": 10
    }
  }'
```

---

### 2.2 Activate DeviceID

#### Purpose
Associates a DeviceID with a specific physical device and activates it in the system. A DeviceID becomes fully operational only after being associated with a specific device through this method.

⚠️ **CAUTION**: Device ID must be activated before use

#### Endpoint Method
```
activateDeviceId
```

#### Request Example
```json
{
  "method": "activateDeviceId",
  "params": {
    "deviceId": "device_id_here",
    "chipId": "chip_unique_id",
    "appEui": "application_eui"
  }
}
```

#### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| method | String | Yes | "activateDeviceId" |
| params.deviceId | String | No | Target DeviceID; if omitted, system auto-allocates available ID |
| params.chipId | String | Yes | Unique ChipID of the physical device |
| params.appEui | String | Yes | Application EUI of the device |

#### Response Format
```json
{
  "code": "000000",
  "data": {
    "deviceId": "activated_device_id"
  }
}
```

#### Response Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| code | String | "000000" indicates success |
| data.deviceId | String | The DeviceID that was successfully activated |

#### Activation Scenarios

**Scenario 1: Auto-allocate DeviceID**
```json
{
  "method": "activateDeviceId",
  "params": {
    "chipId": "abc123def456",
    "appEui": "70B3D57ED00001C0"
  }
}
```
→ System automatically selects available DeviceID

**Scenario 2: Specify DeviceID**
```json
{
  "method": "activateDeviceId",
  "params": {
    "deviceId": "device_id_123",
    "chipId": "abc123def456",
    "appEui": "70B3D57ED00001C0"
  }
}
```
→ Activates specified DeviceID

#### cURL Example
```bash
curl -X POST https://api.yosmart.com/open/production/v2/api \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${access_token}" \
  -d '{
    "method": "activateDeviceId",
    "params": {
      "chipId": "abc123def456",
      "appEui": "70B3D57ED00001C0"
    }
  }'
```

---

### 2.3 Request SN Codes

#### Purpose
Retrieve serial number codes that comply with YoSmart specifications. These SNs are used for device identification and tracking.

#### Endpoint Method
```
requestSN
```

#### Request Example
```json
{
  "method": "requestSN",
  "params": {
    "size": 100
  }
}
```

#### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| method | String | Yes | "requestSN" |
| params.size | Number | Yes | Quantity of SN codes to generate |

#### Response Format
```json
{
  "code": "000000",
  "data": {
    "snList": [
      "SN0001",
      "SN0002",
      "SN0003",
      "..."
    ]
  }
}
```

#### Response Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| code | String | "000000" indicates success |
| data.snList | Array<String> | Array of generated serial number codes |

#### SN Code Format
- Serial numbers comply with YoSmart specifications
- Unique within your production environment
- Used for device identification and tracking
- Can be printed on device labels

#### cURL Example
```bash
curl -X POST https://api.yosmart.com/open/production/v2/api \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${access_token}" \
  -d '{
    "method": "requestSN",
    "params": {
      "size": 100
    }
  }'
```

---

### 2.4 Bind SN Code to Device

#### Purpose
Bind a serial number code to a specific DeviceID. This links the physical device (identified by SN) to its DeviceID in the system.

⚠️ **CAUTION**: The deviceId of target device **must be activated** (see 2.2)

#### Endpoint Method
```
bindSN
```

#### Request Example
```json
{
  "method": "bindSN",
  "params": {
    "deviceId": "device_id_123",
    "sn": "SN0001"
  }
}
```

#### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| method | String | Yes | "bindSN" |
| params.deviceId | String | Yes | Device's DeviceId (must be activated) |
| params.sn | String | No | SN code; if empty, system auto-generates |

#### Response Format
```json
{
  "code": "000000",
  "data": {
    "sn": "successfully_bound_sn"
  }
}
```

#### Response Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| code | String | "000000" indicates success |
| data.sn | String | Successfully bound SN code |

#### Binding Scenarios

**Scenario 1: Bind existing SN**
```json
{
  "method": "bindSN",
  "params": {
    "deviceId": "device_id_123",
    "sn": "SN0001"
  }
}
```
→ Binds specified SN to device

**Scenario 2: Auto-generate SN**
```json
{
  "method": "bindSN",
  "params": {
    "deviceId": "device_id_123",
    "sn": ""
  }
}
```
→ System automatically generates and binds SN

#### cURL Example
```bash
curl -X POST https://api.yosmart.com/open/production/v2/api \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${access_token}" \
  -d '{
    "method": "bindSN",
    "params": {
      "deviceId": "device_id_123",
      "sn": "SN0001"
    }
  }'
```

---

## Complete Production Workflow

### Step 1: Request Device IDs
```bash
# Get 10 device IDs for production batch
curl -X POST https://api.yosmart.com/open/production/v2/api \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${access_token}" \
  -d '{
    "method": "requestDeviceId",
    "params": {"size": 10}
  }'
```

### Step 2: Activate Each Device ID
```bash
# For each physical device, activate its ID
for device in devices_list; do
  curl -X POST https://api.yosmart.com/open/production/v2/api \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${access_token}" \
    -d '{
      "method": "activateDeviceId",
      "params": {
        "chipId": "'${device.chipId}'",
        "appEui": "'${device.appEui}'"
      }
    }'
done
```

### Step 3: Request Serial Numbers
```bash
# Get SNs for all devices
curl -X POST https://api.yosmart.com/open/production/v2/api \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${access_token}" \
  -d '{
    "method": "requestSN",
    "params": {"size": 10}
  }'
```

### Step 4: Bind SNs to Devices
```bash
# Bind each SN to corresponding device ID
for i in {1..10}; do
  curl -X POST https://api.yosmart.com/open/production/v2/api \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${access_token}" \
    -d '{
      "method": "bindSN",
      "params": {
        "deviceId": "'${deviceIds[$i]}'",
        "sn": "'${snList[$i]}'"
      }
    }'
done
```

---

## Production Workflow Diagram

```
1. Request DeviceIds
   └─> Get list of DeviceIDs
       
2. Activate DeviceID (for each physical device)
   └─> Link ChipId & AppEui to DeviceID
   
3. Request SN Codes
   └─> Get serial numbers for devices
   
4. Bind SN to Device
   └─> Link SN to activated DeviceID
   
Result: Physical device ready for market
   ├─ Unique DeviceID
   ├─ Unique Serial Number (SN)
   └─ Registered in YoSmart system
```

---

## Node.js Implementation Example

```javascript
class YoSmartProductionAPI {
  constructor(accessToken) {
    this.accessToken = accessToken;
    this.baseUrl = 'https://api.yosmart.com/open/production/v2/api';
  }

  async request(method, params) {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.accessToken}`
      },
      body: JSON.stringify({ method, params })
    });
    
    return await response.json();
  }

  async requestDeviceIds(size) {
    return await this.request('requestDeviceId', { size });
  }

  async activateDeviceId(chipId, appEui, deviceId = null) {
    const params = { chipId, appEui };
    if (deviceId) params.deviceId = deviceId;
    return await this.request('activateDeviceId', params);
  }

  async requestSNs(size) {
    return await this.request('requestSN', { size });
  }

  async bindSN(deviceId, sn = '') {
    return await this.request('bindSN', { deviceId, sn });
  }
}

// Usage
const api = new YoSmartProductionAPI(accessToken);

// 1. Request 10 device IDs
const deviceIds = await api.requestDeviceIds(10);
console.log('Device IDs:', deviceIds.data.deviceIdList);

// 2. Activate first device
const activated = await api.activateDeviceId(
  'chip_unique_id',
  '70B3D57ED00001C0'
);
console.log('Activated Device ID:', activated.data.deviceId);

// 3. Request SNs
const sns = await api.requestSNs(10);
console.log('Serial Numbers:', sns.data.snList);

// 4. Bind SN to device
const bound = await api.bindSN(
  activated.data.deviceId,
  sns.data.snList[0]
);
console.log('Bound SN:', bound.data.sn);
```

---

## Best Practices

### Batch Processing
- Request device IDs in reasonable batches
- Process activation asynchronously
- Implement batch binding with error handling

### Error Handling
```javascript
async function safeActivate(chipId, appEui) {
  try {
    const result = await api.activateDeviceId(chipId, appEui);
    if (result.code !== '000000') {
      throw new Error(`Activation failed: ${result.desc}`);
    }
    return result.data.deviceId;
  } catch (error) {
    console.error('Activation error:', error);
    // Implement retry logic
  }
}
```

### Database Tracking
```javascript
// Store mapping
const deviceMapping = {
  deviceId: 'activated_id',
  chipId: 'chip_unique_id',
  appEui: 'app_eui',
  sn: 'serial_number',
  status: 'activated', // or 'bound', 'shipped'
  createdAt: new Date()
};
```

### Audit Trail
- Log all production API calls
- Track device ID generation
- Record SN bindings
- Monitor activation completions

---

## Related Documentation

- [Open API V2](03-openapi-v2.md)
- [Error Codes](06-error-codes.md)
- [Authentication](02-authentication.md)

---

**Last Updated**: June 9, 2025
**Source**: https://doc.yosmart.com/docs/other/device_production
