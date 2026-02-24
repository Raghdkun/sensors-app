# YoSmart API Documentation

Complete API documentation for YoSmart device integration with detailed guides, examples, and best practices.

## 📚 Documentation Index

### Core Documentation
1. **[Introduction](01-introduction.md)** - Overview of YoSmart API capabilities
2. **[Authentication](02-authentication.md)** - CSID and UAC credential types
3. **[Open API V2](03-openapi-v2.md)** - HTTP and MQTT protocol specifications
4. **[Data Packet Format](04-datapacket.md)** - BDDP and BUDP packet structures
5. **[UAC Quick Start Guide](05-uac-quickstart.md)** - Step-by-step guide for your UAC
6. **[Error Codes](06-error-codes.md)** - Complete error code reference with solutions
7. **[Device Production API](07-device-production.md)** - Device manufacturing and provisioning

---

## 🔑 Your Credentials

You have been provided with UAC credentials for accessing the YoSmart API:

```
UAID: ua_F6E72EAE63AC43FAA6F068C832C7734B
Secret Key: sec_v1_jIC+e8dZoCmthweOFlBb4A==
```

⚠️ **SECURITY ALERT**: Store these credentials securely in environment variables. Never commit them to version control.

---

## 🚀 Quick Start

### Option 1: Get Access Token and Retrieve Devices (Fastest)

```bash
# 1. Get access token
curl -X POST "https://api.yosmart.com/open/yolink/token" \
  -d "grant_type=client_credentials&client_id=ua_F6E72EAE63AC43FAA6F068C832C7734B&client_secret=sec_v1_jIC+e8dZoCmthweOFlBb4A=="

# Response will include: access_token, refresh_token, expires_in

# 2. Store the access_token and call API
curl -X POST "https://api.yosmart.com/open/yolink/v2/api" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"method":"Home.getDeviceList","time":'$(date +%s)'}'
```

### Option 2: Full Workflow

Follow the [UAC Quick Start Guide](05-uac-quickstart.md) for a complete 6-step walkthrough:
1. Create UAC (already done ✓)
2. Obtain Access Token
3. Get Device List
4. Control Devices
5. Get Home Info
6. Subscribe to Events (MQTT)

---

## 📡 API Endpoints

### HTTP API
```
POST https://api.yosmart.com/open/yolink/v2/api
POST https://api.yosmart.com/open/production/v2/api
POST https://api.yosmart.com/open/yolink/token
```

### MQTT API
```
Host: mqtt.api.yosmart.com
Port: 8003 (TCP) or 8004 (WebSocket)
```

---

## 📋 Common API Methods

### Account & Home Management

| Method | Purpose | See Also |
|--------|---------|----------|
| `Home.getDeviceList` | Get all devices in home | [UAC Guide - Step 3](05-uac-quickstart.md#step-3-get-device-list-using-access-token) |
| `Home.getGeneralInfo` | Get home ID and info | [UAC Guide - Step 5](05-uac-quickstart.md#step-5-get-home-general-info) |
| `Hub.getState` | Get hub connection state | [Data Packet Examples](04-datapacket.md#hub-state-response) |

### Device Production (Manufacturing)

| Method | Purpose | See Also |
|--------|---------|----------|
| `requestDeviceId` | Request device IDs | [Device Production - 2.1](07-device-production.md#21-request-deviceids) |
| `activateDeviceId` | Activate a device ID | [Device Production - 2.2](07-device-production.md#22-activate-deviceid) |
| `requestSN` | Request serial numbers | [Device Production - 2.3](07-device-production.md#23-request-sn-codes) |
| `bindSN` | Bind SN to device | [Device Production - 2.4](07-device-production.md#24-bind-sn-code-to-device) |

---

## 🔒 Security Best Practices

✅ **DO**:
- Store credentials in environment variables
- Refresh tokens before expiration
- Use HTTPS for all API calls
- Implement proper error handling
- Log API interactions for debugging

❌ **DON'T**:
- Commit credentials to git
- Expose tokens in logs/frontend
- Store secrets in plain text
- Share credentials with third parties
- Use hardcoded credentials

See [Open API V2 - Best Practices](03-openapi-v2.md#api-best-practices) for details.

---

## 🛠️ Implementation Guide

### Phase 1: Token Management
1. Get access token using your UAID and Secret Key
2. Implement token refresh logic
3. Store tokens securely

**Duration**: ~30 minutes  
**See**: [UAC Guide - Step 2](05-uac-quickstart.md#step-2-obtain-access-token-via-uac)

### Phase 2: Device Discovery
1. Retrieve home ID
2. Get device list
3. Store device information locally

**Duration**: ~1 hour  
**See**: [UAC Guide - Steps 3-5](05-uac-quickstart.md#step-3-get-device-list-using-access-token)

### Phase 3: Dashboard Integration
1. Display device list in dashboard
2. Show device status and properties
3. Implement device control commands

**Duration**: ~2-3 hours  
**See**: [Data Packet Format](04-datapacket.md)

### Phase 4: Real-time Events (Optional)
1. Connect to MQTT broker
2. Subscribe to device event topics
3. Update dashboard with real-time data

**Duration**: ~2 hours  
**See**: [UAC Guide - Step 6](05-uac-quickstart.md#step-6-subscribe-to-device-events-via-mqtt)

---

## 📚 Documentation by Use Case

### "I want to display devices in my dashboard"
→ Read: [UAC Quick Start - Steps 2-3](05-uac-quickstart.md#step-2-obtain-access-token-via-uac)

### "I need to understand API errors"
→ Read: [Error Codes](06-error-codes.md) & [Error Handling Guidelines](06-error-codes.md#error-handling-guidelines)

### "I need to control a specific device"
→ Read: [UAC Quick Start - Step 4](05-uac-quickstart.md#step-4-control-devices-with-device-token)

### "I want real-time device updates"
→ Read: [Open API V2 - MQTT](03-openapi-v2.md#mqtt-api-v2) & [UAC Quick Start - Step 6](05-uac-quickstart.md#step-6-subscribe-to-device-events-via-mqtt)

### "I'm implementing device manufacturing"
→ Read: [Device Production API](07-device-production.md)

### "I need to understand the data format"
→ Read: [Data Packet Format](04-datapacket.md)

---

## 🔄 API Response Codes

### Success
- **000000**: Operation successful

### Common Errors
- **010104**: Token expired → Refresh token
- **010103**: Authorization invalid → Check bearer token
- **020101**: Device not found → Verify device exists
- **010301**: Rate limited → Retry with backoff

See [Error Codes](06-error-codes.md) for complete reference.

---

## 💻 Code Examples

### JavaScript/Node.js

```javascript
// Get access token
const response = await fetch('https://api.yosmart.com/open/yolink/token', {
  method: 'POST',
  body: `grant_type=client_credentials&client_id=${UAID}&client_secret=${SECRET}`
});
const { access_token, expires_in } = await response.json();

// Get device list
const deviceResponse = await fetch('https://api.yosmart.com/open/yolink/v2/api', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${access_token}`
  },
  body: JSON.stringify({
    method: 'Home.getDeviceList',
    time: Date.now()
  })
});

const result = await deviceResponse.json();
if (result.code === '000000') {
  console.log('Devices:', result.data.devices);
} else {
  console.error('Error:', result.desc);
}
```

### Python

```python
import requests
import json
from datetime import datetime

UAID = 'ua_F6E72EAE63AC43FAA6F068C832C7734B'
SECRET = 'sec_v1_jIC+e8dZoCmthweOFlBb4A=='

# Get access token
token_url = 'https://api.yosmart.com/open/yolink/token'
token_data = {
    'grant_type': 'client_credentials',
    'client_id': UAID,
    'client_secret': SECRET
}
token_response = requests.post(token_url, data=token_data)
access_token = token_response.json()['access_token']

# Get device list
api_url = 'https://api.yosmart.com/open/yolink/v2/api'
headers = {
    'Content-Type': 'application/json',
    'Authorization': f'Bearer {access_token}'
}
payload = {
    'method': 'Home.getDeviceList',
    'time': int(datetime.now().timestamp() * 1000)
}
response = requests.post(api_url, headers=headers, json=payload)
result = response.json()

if result['code'] == '000000':
    print(f"Found {len(result['data']['devices'])} devices")
else:
    print(f"Error: {result['desc']}")
```

### cURL

```bash
# Get token
TOKEN=$(curl -s -X POST 'https://api.yosmart.com/open/yolink/token' \
  -d 'grant_type=client_credentials&client_id=ua_F6E72EAE63AC43FAA6F068C832C7734B&client_secret=sec_v1_jIC+e8dZoCmthweOFlBb4A==' \
  | jq -r '.access_token')

# Get devices
curl -X POST 'https://api.yosmart.com/open/yolink/v2/api' \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"method":"Home.getDeviceList","time":'$(date +%s)'}'
```

---

## 🐛 Troubleshooting

### Issue: "Token is expired"
**Error Code**: 010104
**Solution**: 
1. Check token `expires_in` value
2. Refresh token before expiration
3. See [UAC Guide - Step 2](05-uac-quickstart.md#token-refresh-before-expiration)

### Issue: "Authorization is invalid"
**Error Code**: 010103
**Solution**:
1. Verify UAID and Secret Key are correct
2. Check Bearer prefix in Authorization header
3. Ensure token is still valid (not expired)

### Issue: "Device not found"
**Error Code**: 020101
**Solution**:
1. Verify device exists via `Home.getDeviceList`
2. Check device is not offline
3. Confirm device ID is correct

### Issue: "Rate limit reached"
**Error Code**: 010301
**Solution**:
1. Implement exponential backoff
2. Check per-connection limits (5 concurrent MQTT connections max)
3. See [Error Handling Guidelines](06-error-codes.md#2-temporary-errors)

### Issue: "Cannot connect to device"
**Error Code**: 000201
**Solution**:
1. Check device power and connectivity
2. Verify device is online in YoLink App
3. Retry request with backoff

---

## 📞 Support & Resources

### YoSmart Support Channels
- **General Support**: service@yosmart.com
- **Technical/R&D**: yaochi@yosmart.com
- **Production Issues**: Post with error code 999999 link

### Resources
- [Official Website](http://www.yosmart.com/)
- [Product Shop](https://shop.yosmart.com/)
- [Device Manuals](https://shop.yosmart.com/collections/user-guide)
- [YoLink YouTube Channel](https://www.youtube.com/c/YoLinkbyYoSmart)

---

## 📝 Document Map

```
docs/yosmart-api/
├── README.md (this file)
├── 01-introduction.md (API overview)
├── 02-authentication.md (CSID vs UAC)
├── 03-openapi-v2.md (Protocol details)
├── 04-datapacket.md (BDDP/BUDP format)
├── 05-uac-quickstart.md (Your quick start)
├── 06-error-codes.md (Error reference)
└── 07-device-production.md (Manufacturing API)
```

---

## 🎯 Next Steps

1. **Read**: [UAC Quick Start Guide](05-uac-quickstart.md) - 10 minutes
2. **Test**: Get access token and retrieve device list - 5 minutes
3. **Implement**: Dashboard device display - 1-2 hours
4. **Integrate**: Real-time updates via MQTT (optional) - 2 hours

---

## 📊 API Limits & Constraints

| Constraint | Value | Details |
|-----------|-------|---------|
| Token TTL | 1 hour | Refresh before expiration |
| MQTT Connections | 5 concurrent | Per UAC |
| MQTT New Conns | 10 per 5 minutes | Rate limit |
| Rate Limit | 010301 error | Implement backoff |

---

## 🔄 Recent Updates

- **February 23, 2026**: Complete documentation created
- **Last Docs Update**: December 4, 2025 (Source docs)
- **API Version**: Open API V2 (Current)

---

**Document Version**: 1.0  
**Last Updated**: February 23, 2026  
**Maintained By**: Development Team
