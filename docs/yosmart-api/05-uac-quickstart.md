# YoSmart API - UAC Quick Start Guide

## Overview
This guide provides step-by-step instructions for working with User Access Credentials (UAC) to access YoSmart devices through the API.

## Your Credentials

Your UAC credentials are:
- **UAID**: `ua_F6E72EAE63AC43FAA6F068C832C7734B`
- **Secret Key**: `sec_v1_jIC+e8dZoCmthweOFlBb4A==`

⚠️ **SECURITY WARNING**: These credentials should be stored securely in environment variables or a secure credential management system. Never commit them to version control.

---

## Step 1: Create User Access Credentials (UAC)

### In YoLink App
1. Open the **YoLink App**
2. Go to **[Account]** menu
3. Click **[Advanced Settings]**
4. Select **[Personal Access Credentials]**
5. Click **[+]** button to create new credentials
6. Store your **UAID** and **Secret Key** securely

### One-time Setup ✓
If you've already created your UAC (which you have), you can skip this step.

---

## Step 2: Obtain Access Token via UAC

### Endpoint
```
POST https://api.yosmart.com/open/yolink/token
```

### Request Format
```bash
curl -X POST \
  -d "grant_type=client_credentials&client_id=${UAID}&client_secret=${Secret Key}" \
  https://api.yosmart.com/open/yolink/token
```

### With Your Credentials
```bash
curl -X POST \
  -d "grant_type=client_credentials&client_id=ua_F6E72EAE63AC43FAA6F068C832C7734B&client_secret=sec_v1_jIC+e8dZoCmthweOFlBb4A==" \
  https://api.yosmart.com/open/yolink/token
```

### Expected Response
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 3600,
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer"
}
```

### Token Details

| Field | Value | Note |
|-------|-------|------|
| access_token | JWT Token | Use in Authorization header |
| expires_in | 3600 (seconds) | Token valid for 1 hour |
| refresh_token | JWT Token | Use to get new access_token |
| token_type | Bearer | Type for Authorization header |

### Token Refresh (Before Expiration)
```bash
curl -X POST \
  -d "grant_type=refresh_token&client_id=ua_F6E72EAE63AC43FAA6F068C832C7734B&refresh_token=${REFRESH_TOKEN}" \
  https://api.yosmart.com/open/yolink/token
```

---

## Step 3: Get Device List Using Access Token

### Endpoint
```
POST https://api.yosmart.com/open/yolink/v2/api
```

### Request Format
```bash
curl --location --request POST 'https://api.yosmart.com/open/yolink/v2/api' \
  --header 'Content-Type: application/json' \
  --header 'Authorization: Bearer ${access_token}' \
  --data-raw '{
    "method": "Home.getDeviceList",
    "time": 1234567890
  }'
```

### Request Parameters
| Field | Value | Type | Required |
|-------|-------|------|----------|
| method | "Home.getDeviceList" | String | Yes |
| time | Current timestamp (ms) | Number | Yes |

### Expected Response
```json
{
  "code": "000000",
  "time": 1734595441905,
  "msgid": 1734595441905,
  "method": "Home.getDeviceList",
  "desc": "Success",
  "data": {
    "devices": [
      {
        "deviceId": "****4c010003****",
        "deviceUDID": "******0448304d67a9fd0b510b******",
        "name": "3604-1",
        "token": "******83F3A783AD7A6BADFE36******",
        "type": "SmartRemoter",
        "parentDeviceId": null,
        "modelName": "YS3604-UC",
        "serviceZone": null
      }
    ]
  }
}
```

### Device Information Breakdown

| Field | Meaning |
|-------|---------|
| deviceId | Unique identifier for the device |
| deviceUDID | Device Unique ID |
| name | User-friendly device name |
| token | Device token for direct control |
| type | Device type (e.g., SmartRemoter) |
| modelName | Device model information |
| parentDeviceId | Parent device (if any) |
| serviceZone | Service zone assignment |

---

## Step 4: Control Devices with Device Token

### Endpoint
```
POST https://api.yosmart.com/open/yolink/v2/api
```

### Generic Device Control Request

```bash
curl --location --request POST 'https://api.yosmart.com/open/yolink/v2/api' \
  --header 'Content-Type: application/json' \
  --header 'Authorization: Bearer ${access_token}' \
  --data-raw '{
    "method": "Hub.getState",
    "time": 1234567890,
    "targetDevice": {
      "deviceId": "****4c160300****",
      "token": "****b642-781e-450f-ba86-df28bdea****"
    },
    "params": {}
  }'
```

### Request Structure

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| method | String | Yes | Device method (e.g., "Hub.getState") |
| time | Number | Yes | Current timestamp in milliseconds |
| targetDevice | Object | Yes | Device identification |
| targetDevice.deviceId | String | Yes | Device ID from Step 3 |
| targetDevice.token | String | Yes | Device token from Step 3 |
| params | Object | No | Method-specific parameters |

### Hub State Response Example
```json
{
  "code": "000000",
  "time": 1572354630744,
  "msgid": 1572354631,
  "method": "Hub.getState",
  "desc": "Success",
  "data": {
    "version": "0316",
    "wifi": {
      "ssid": "YoSmart",
      "enable": true,
      "ip": "192.168.1.164",
      "gateway": "192.168.1.1",
      "mask": "255.255.255.0"
    },
    "eth": {
      "enable": false
    }
  }
}
```

---

## Step 5: Get Home General Info

### Purpose
Retrieve general information about your home, including the Home ID needed for MQTT subscriptions.

### Endpoint
```
POST https://api.yosmart.com/open/yolink/v2/api
```

### Request
```bash
curl --location --request POST 'https://api.yosmart.com/open/yolink/v2/api' \
  --header 'Content-Type: application/json' \
  --header 'Authorization: Bearer ${access_token}' \
  --data-raw '{
    "method": "Home.getGeneralInfo",
    "time": 1234567890
  }'
```

### Response
```json
{
  "code": "000000",
  "time": 1640596777941,
  "msgid": 1640596777941,
  "method": "Home.getGeneralInfo",
  "desc": "Success",
  "data": {
    "id": "****340cba25****"
  }
}
```

### Important Note
The **Home ID** (`data.id`) is required to:
- Subscribe to MQTT topics for device events
- Manage devices in your home
- Access home-level features

---

## Step 6: Subscribe to Device Events via MQTT

### Purpose
Receive real-time events from your devices through MQTT (StatusChange, Alert, Report).

### MQTT Connection Details

| Parameter | Value |
|-----------|-------|
| Host | mqtt.api.yosmart.com |
| Port | 8003 (TCP) or 8004 (WebSocket) |
| Username | ${access_token} |
| Password | (empty) |
| Client ID | Any unique UUID |

### Topic Structure
```
yl-home/${Home ID}/+/report
```

### Example Connection (Node.js)
```javascript
const mqtt = require('mqtt');

const homeid = '****340cba25****';
const accessToken = 'your_access_token_here';

const client = mqtt.connect('mqtt://mqtt.api.yosmart.com:8003', {
  username: accessToken,
  password: '',
  clientId: 'unique-uuid-here'
});

client.on('connect', () => {
  console.log('Connected to MQTT');
  // Subscribe to device reports
  client.subscribe(`yl-home/${homeid}/+/report`, (err) => {
    if (err) console.error(err);
  });
});

client.on('message', (topic, message) => {
  console.log('Event:', topic);
  console.log('Data:', JSON.parse(message.toString()));
});
```

### Connection Limits

⚠️ ***Important***:
- **Maximum concurrent connections**: 5
- **Maximum new connections in 5 minutes**: 10

### Available Topics

| Topic | Direction | Purpose |
|-------|-----------|---------|
| `yl-home/${Home ID}/+/report` | Subscribe | Device events (StatusChange, Alert, Report) |
| `yl-home/${Home ID}/**/request` | Publish | Send BDDP requests to devices |
| `yl-home/${Home ID}/+/response` | Subscribe | Receive BUDP responses |

---

## Complete Workflow Example

### 1. Get Access Token
```bash
# Store token from response
ACCESS_TOKEN=$(curl -X POST \
  -d "grant_type=client_credentials&client_id=ua_F6E72EAE63AC43FAA6F068C832C7734B&client_secret=sec_v1_jIC+e8dZoCmthweOFlBb4A==" \
  https://api.yosmart.com/open/yolink/token | jq -r '.access_token')
```

### 2. Get Home ID
```bash
HOME_ID=$(curl -X POST 'https://api.yosmart.com/open/yolink/v2/api' \
  -H 'Authorization: Bearer '$ACCESS_TOKEN \
  -d '{"method":"Home.getGeneralInfo","time":'$(date +%s)'}' \
  | jq -r '.data.id')

echo "Home ID: $HOME_ID"
```

### 3. Get Device List
```bash
curl -X POST 'https://api.yosmart.com/open/yolink/v2/api' \
  -H 'Authorization: Bearer '$ACCESS_TOKEN \
  -d '{"method":"Home.getDeviceList","time":'$(date +%s)'}' \
  | jq '.'
```

### 4. Control a Device
```bash
DEVICE_ID="****4c160300****"
DEVICE_TOKEN="****b642-781e-450f-ba86-df28bdea****"

curl -X POST 'https://api.yosmart.com/open/yolink/v2/api' \
  -H 'Authorization: Bearer '$ACCESS_TOKEN \
  -d '{
    "method":"Hub.getState",
    "time":'$(date +%s)',
    "targetDevice":{"deviceId":"'$DEVICE_ID'","token":"'$DEVICE_TOKEN'"},
    "params":{}
  }' | jq '.'
```

---

## Troubleshooting

### Token Expired
- **Error Code**: 010104
- **Solution**: Use refresh_token to get new access_token
- **Recommended**: Refresh before expiration

### Invalid Authorization
- **Error Code**: 010103
- **Solution**: 
  - Verify UAID and Secret Key are correct
  - Check access_token is valid
  - Ensure Bearer prefix in header

### Device Not Found
- **Error Code**: 020101
- **Solution**:
  - Verify device exists in Home.getDeviceList
  - Check deviceId is correct
  - Verify device is accessible to your account

### Connection Limit Reached
- **Error**: Cannot establish new MQTT connection
- **Solution**:
  - Close existing idle connections
  - Implement reconnection with backoff
  - Monitor concurrent connection count

---

## Security Best Practices

1. **Store Credentials Securely**
   - Use environment variables
   - Never commit to version control
   - Use .env files with .gitignore

2. **Token Management**
   - Refresh before expiration
   - Store refresh_token securely
   - Implement token rotation

3. **API Calls**
   - Use HTTPS only
   - Validate responses
   - Implement error handling

4. **MQTT Connection**
   - Use TCP port 8003 (encrypted traffic recommended)
   - Implement reconnection logic
   - Monitor connection status

---

## Related Documentation

- [Open API V2 Details](03-openapi-v2.md)
- [Data Packet Format](04-datapacket.md)
- [Error Codes](06-error-codes.md)
- [Device Production API](07-device-production.md)

---

**Last Updated**: November 27, 2025
**Source**: https://doc.yosmart.com/docs/overall/qsg_uac
