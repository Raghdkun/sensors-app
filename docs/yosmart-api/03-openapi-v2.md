# YoSmart API - Open API V2

## Overview
Open API V2 is the latest API version from YoSmart. It supports both **HTTP** and **MQTT** protocols for accessing YoSmart devices.

⚠️ **IMPORTANT**: Open API V2 currently supports **UAC** (User Access Credential) only. CSID support may be added in future versions.

---

## HTTP API V2

### Endpoint
```
POST /open/yolink/v2/api
```

### Base URL
```
https://api.yosmart.com/open/yolink/v2/api
```

### Request Headers

| Header | Value | Required | Description |
|--------|-------|----------|-------------|
| Content-Type | application/json | Yes | JSON formatted request |
| Authorization | Bearer ${access_token} | Yes | Access token for authentication |

### Request Body
- Must be JSON format of [BDDP (Basic Downlink Data Packet)](04-datapacket.md#bddp)
- Contains the API method and parameters

### Response Body
- JSON format of [BUDP (Basic Uplink Data Packet)](04-datapacket.md#budp)
- Contains response code, data, and metadata

### Example HTTP Request

```bash
curl --location --request POST 'https://api.yosmart.com/open/yolink/v2/api' \
  --header 'Content-Type: application/json' \
  --header 'Authorization: Bearer ${access_token}' \
  --data-raw '{
    "method": "Home.getDeviceList",
    "time": 1234567890
  }'
```

### Example Response

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

---

## MQTT API V2

### Connection Details

| Setting | Value | Description |
|---------|-------|-------------|
| Protocol | TCP or WebSocket | Both supported |
| Host | mqtt.api.yosmart.com | MQTT broker |
| Port (TCP) | 8003 | Standard MQTT port |
| Port (WebSocket) | 8004 | WebSocket port |

### Authentication

| Parameter | Value | Description |
|-----------|-------|-------------|
| Username | ${access_token} | Access token of UAC |
| Password | None | Leave empty |
| Client ID | General Unique UUID | Unique identifier for connection |

### Connection Limits

⚠️ **UAC Limitations**:
- **Maximum concurrent connections**: 5
- **Maximum new connections in 5 minutes**: 10

### Topic Structure

Base topic: `yl-home/${Home ID}/**`

#### Topic Permissions
- **Publish**: `yl-home/${Home ID}/**/request`
- **Subscribe**: `yl-home/${Home ID}/+/report` and `yl-home/${Home ID}/+/response`

#### Available Topics

| Topic | Direction | Purpose |
|-------|-----------|---------|
| `yl-home/${Home ID}/+/report` | Subscribe | Device events (StatusChange, Alert, Report) |
| `yl-home/${Home ID}/**/request` | Publish | Send BDDP requests |
| `yl-home/${Home ID}/+/response` | Subscribe | Receive BUDP responses |

#### How to Get Home ID
Use the `Home.getGeneralInfo` method to retrieve your Home ID:

```json
{
  "method": "Home.getGeneralInfo",
  "time": 1234567890
}
```

---

## OAuth 2.0 Token Management

### Token Endpoint
```
${SVR_URL}/open/yolink/token
```

### Full Token URL
```
https://api.yosmart.com/open/yolink/token
```

### Getting Access Token via UAC

Use client credentials grant flow:

```bash
curl -X POST -d "grant_type=client_credentials&client_id=${UAID}&client_secret=${Secret Key of UAC}" \
  https://api.yosmart.com/open/yolink/token
```

#### Request Parameters

| Parameter | Value | Description |
|-----------|-------|-------------|
| grant_type | client_credentials | OAuth 2.0 grant type |
| client_id | ${UAID} | Your UAC ID |
| client_secret | ${Secret Key of UAC} | Your UAC Secret Key |

#### Response

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 3600,
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer"
}
```

### Refreshing Access Token

When access token expires, use refresh token to get a new one:

```bash
curl -X POST -d "grant_type=refresh_token&client_id=${UAID}&refresh_token=${Refresh Token}" \
  https://api.yosmart.com/open/yolink/token
```

#### Request Parameters

| Parameter | Value | Description |
|-----------|-------|-------------|
| grant_type | refresh_token | OAuth 2.0 grant type |
| client_id | ${UAID} | Your UAC ID |
| refresh_token | ${Refresh Token} | Refresh token from previous response |

### Token Management Best Practices

✅ **RECOMMENDED**:
1. **Check expiration** before calling API with access_token
2. **Use refresh_token** to get new access_token in preference to re-authenticating
3. **Store refresh_token** securely
4. **Implement token refresh logic** before expiration
5. **Monitor token expiration** (expires_in field)

⚠️ **WARNING**:
- Never expose access tokens in logs or frontend
- Use HTTPS for all token requests
- Store tokens securely (environment variables, secure storage)

---

## API Best Practices

### Request Best Practices
1. Always include timestamp in requests
2. Use HTTPS for HTTP requests
3. Handle errors gracefully
4. Implement retry logic with exponential backoff

### Token Management Tips
1. Refresh tokens before expiration
2. Cache tokens temporarily (with safety margin)
3. Always check expires_in response
4. Implement automatic token refresh

### Connection Management
- Close MQTT connections properly
- Monitor connection status
- Implement reconnection logic
- Respect connection limits

---

## Related Documentation

- [UAC Quick Start Guide](05-uac-quickstart.md)
- [Data Packet Format](04-datapacket.md)
- [Error Codes](06-error-codes.md)
- [Device Production API](07-device-production.md)

---

**Last Updated**: November 27, 2025
**Source**: https://doc.yosmart.com/docs/protocol/openAPIV2
