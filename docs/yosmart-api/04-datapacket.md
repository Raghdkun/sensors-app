# YoSmart API - Data Packet Format

## Overview
YoSmart API uses two fundamental data packet formats to ensure unified communication across HTTP and MQTT protocols.

---

## BDDP (Basic Downlink Data Packet)

### Purpose
**BDDP** is the data packet sent from the **client to the server** (downlink direction).

### Structure

#### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| method | String | API method name to call (e.g., "Home.getDeviceList") |
| time | Number | Unix timestamp in milliseconds |

#### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| params | Object | Parameters required for the API method |
| targetDevice | Object | Target device information (contains deviceId and token) |

### Example BDDP Requests

#### Get Device List
```json
{
  "method": "Home.getDeviceList",
  "time": 1234567890
}
```

#### Control Device with Parameters
```json
{
  "method": "Hub.getState",
  "time": 1234567890,
  "targetDevice": {
    "deviceId": "****4c160300****",
    "token": "****b642-781e-450f-ba86-df28bdea****"
  },
  "params": {}
}
```

#### Device Operation with Parameters
```json
{
  "method": "DeviceType.methodName",
  "time": 1234567890,
  "targetDevice": {
    "deviceId": "device_id_here",
    "token": "device_token_here"
  },
  "params": {
    "key1": "value1",
    "key2": "value2"
  }
}
```

---

## BUDP (Basic Uplink Data Packet)

### Purpose
**BUDP** is the data packet sent from the **server to the client** (uplink direction).

### Structure

#### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| code | String | Result code ("000000" = success, others = failure) |
| time | Number | Unix timestamp in milliseconds |

#### Standard Fields

| Field | Type | Description |
|-------|------|-------------|
| msgid | Number | Message ID matching the request |
| method | String | API method that was called |
| desc | String | Description of the result |

#### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| data | Object | Response data from the API method |

### Success Response Format
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
        "name": "Device Name",
        "token": "device_token_here",
        "type": "DeviceType",
        "modelName": "ModelName"
      }
    ]
  }
}
```

### Error Response Format
```json
{
  "code": "010104",
  "time": 1234567890,
  "msgid": 1234567890,
  "method": "Home.getDeviceList",
  "desc": "Error Description",
  "data": null
}
```

---

## Code Reference

### Success Code
| Code | Meaning |
|------|---------|
| 000000 | Successful operation |

### Common Error Codes

| Code | Meaning |
|------|---------|
| 000101 | Can't connect to Hub |
| 000102 | The hub cannot respond to this command |
| 000103 | Token is invalid |
| 000104 | Hub token is invalid |
| 010101 | Invalid request: CSID is invalid |
| 010102 | Invalid request: SecKey is invalid |
| 010103 | Invalid request: Authorization is invalid |
| 010104 | Invalid request: The token is expired |
| 010200 | Invalid data packet: params is not valid |
| 010201 | Invalid data packet: time cannot be null |
| 010202 | Invalid data packet: method cannot be null |
| 010203 | Invalid data packet: method is not supported |
| 020101 | The device does not exist |

See [Error Codes](06-error-codes.md) for complete list.

---

## Common Response Data Structures

### Device List Response
```json
{
  "devices": [
    {
      "deviceId": "device_id",
      "deviceUDID": "unique_udid",
      "name": "Device Name",
      "token": "device_token",
      "type": "DeviceType",
      "modelName": "Model",
      "parentDeviceId": null,
      "serviceZone": null
    }
  ]
}
```

### Hub State Response
```json
{
  "version": "0316",
  "wifi": {
    "ssid": "Network Name",
    "enable": true,
    "ip": "192.168.1.164",
    "gateway": "192.168.1.1",
    "mask": "255.255.255.0"
  },
  "eth": {
    "enable": false
  }
}
```

### Home General Info Response
```json
{
  "id": "****340cba25****"
}
```

---

## Working with Data Packets

### Constructing BDDP

```javascript
const bddp = {
  method: "Home.getDeviceList",
  time: Date.now()
};
```

### Parsing BUDP

```javascript
const budp = JSON.parse(response);

if (budp.code === "000000") {
  // Success - use budp.data
  console.log(budp.data);
} else {
  // Error - check budp.code
  console.error(`Error: ${budp.code} - ${budp.desc}`);
}
```

### Validation Checklist

Before sending BDDP, verify:
- ✓ `method` field is not null
- ✓ `time` field is not null and is current
- ✓ `method` value is supported
- ✓ `params` (if included) are valid for the method
- ✓ JSON format is valid

---

## Related Documentation

- [Open API V2](03-openapi-v2.md)
- [Error Codes](06-error-codes.md)
- [UAC Quick Start](05-uac-quickstart.md)

---

**Last Updated**: December 4, 2025
**Source**: YoSmart API Documentation
