# YoSmart API - Error Codes

## Overview
This document contains all error codes returned by the YoSmart API. Each error code indicates a specific issue that needs to be addressed.

### Response Format
When an error occurs, the API returns:
```json
{
  "code": "ERROR_CODE",
  "time": 1234567890,
  "msgid": 1234567890,
  "method": "MethodCalled",
  "desc": "Error Description",
  "data": null
}
```

### Code Format
- **Success**: `000000`
- **Errors**: Format varies, e.g., `000101`, `010104`, `020101`

---

## Connection Errors

| Code | Error | Description | Solution |
|------|-------|-------------|----------|
| 000101 | Can't connect to Hub | Unable to establish connection with the Hub device | Check Hub network connectivity and power |
| 000102 | The hub cannot respond to this command | Hub received command but cannot execute | Verify command is supported by Hub model |
| 000103 | Token is invalid | Access token is invalid or malformed | Obtain new access token or refresh existing one |
| 000104 | Hub token is invalid | Device token for Hub is invalid | Get fresh device token via Home.getDeviceList |
| 000201 | Cannot connect to the device | Unable to establish connection with the device | Check device network connectivity and power |
| 000202 | The device cannot respond to this command | Device received command but cannot execute | Verify command is supported by device type |
| 000203 | Cannot connect to the device | Device connection failed | Check device status and network |

---

## URI/Configuration Errors

| Code | Error | Description | Solution |
|------|-------|-------------|----------|
| 000105 | redirect_uri can't be null | OAuth redirect URI is missing | Include redirect_uri in OAuth request |
| 000106 | client_id is invalid | OAuth client_id is invalid | Verify UAID (client_id) is correct |

---

## Service Errors

| Code | Error | Description | Solution |
|------|-------|-------------|----------|
| 010000 | Service is not available, try again later | API service is temporarily unavailable | Retry request after a short delay |
| 010001 | Internal connection is not available, try again later | Internal service connection issue | Retry with exponential backoff |

---

## Authentication & Validation Errors

| Code | Error | Description | Solution |
|------|-------|-------------|----------|
| 010101 | Invalid request: CSID is invalid | CSID provided is not valid | Verify CSID value and contact support if needed |
| 010102 | Invalid request: SecKey is invalid | Secret key does not match CSID/UAID | Verify Secret Key is correct |
| 010103 | Invalid request: Authorization is invalid | Authorization header is missing or malformed | Include proper Bearer token in header |
| 010104 | Invalid request: The token is expired | Access token has expired | Refresh token using refresh_token |

---

## Data Packet Validation Errors

| Code | Error | Description | Solution |
|------|-------|-------------|----------|
| 010200 | Invalid data packet: params is not valid | Method parameters are invalid | Check params format and allowed values |
| 010201 | Invalid data packet: time can not be null | Timestamp is missing from request | Include current timestamp in milliseconds |
| 010202 | Invalid data packet: method can not be null | Method name is missing | Include method field in request |
| 010203 | Invalid data packet: method is not supported | Method is not recognized | Verify method name is correct |
| 010204 | Invalid data packet | General packet format error | Check JSON structure and field types |

---

## Permission & Rate Limiting Errors

| Code | Error | Description | Solution |
|------|-------|-------------|----------|
| 010300 | This interface is restricted to access | User does not have permission to access this method | Check account permissions and credentials |
| 010301 | Access denied due to limits reached, Please retry later | Rate limit or quota exceeded | Implement exponential backoff and retry |

---

## Device State Errors

| Code | Error | Description | Solution |
|------|-------|-------------|----------|
| 020100 | The device is already bound by another user | Device is already associated with different account | Contact YoSmart support or unbind from other account |
| 020101 | The device does not exist | Device ID not found in system | Verify device exists via Home.getDeviceList |
| 020102 | Device mask error | Device identification error | Verify deviceId and token are correct |
| 020103 | The device is not supported | Device type not supported by API | Check supported device types in documentation |
| 020104 | Device is busy, try again later | Device is processing another command | Implement retry with backoff |
| 020105 | Unable to retrieve device | Device information cannot be fetched | Check device connectivity and status |

---

## Search & Data Errors

| Code | Error | Description | Solution |
|------|-------|-------------|----------|
| 020201 | No devices were searched | No devices match search criteria | Verify search parameters or device existence |
| 030101 | No Data found | Requested data does not exist | Verify request parameters and IDs |

---

## Unknown/Critical Errors

| Code | Error | Description | Solution |
|------|-------|-------------|----------|
| 999999 | UnKnown error, please report it | Unexpected system error | Report to: yaochi@yosmart.com with details |

---

## Error Handling Guidelines

### 1. Authentication Errors (010101-010104)

**Action**: Refresh credentials or obtain new token
```javascript
if (error.code === '010104') {
  // Token expired - refresh
  const newToken = await refreshAccessToken(refreshToken);
  retryRequest(newToken);
} else if (['010101', '010102', '010103'].includes(error.code)) {
  // Credential error - need user intervention
  throw new Error('Please verify your credentials');
}
```

### 2. Temporary Errors (010000, 010001, 010301, 020104)

**Action**: Implement exponential backoff retry
```javascript
async function retryWithBackoff(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (['010000', '010001', '010301', '020104'].includes(error.code)) {
        const delay = Math.pow(2, i) * 1000; // Exponential backoff
        await sleep(delay);
      } else {
        throw error; // Don't retry non-temporary errors
      }
    }
  }
}
```

### 3. Validation Errors (010200-010204)

**Action**: Check request format
```javascript
if (error.code.startsWith('010200') || error.code.startsWith('010201')) {
  // Validate request structure
  console.error('Invalid request:', error.desc);
  // Log request for debugging
  validateRequestFormat(request);
}
```

### 4. Device Errors (020101-020105)

**Action**: Verify device information
```javascript
if (error.code === '020101') {
  // Device not found
  const devices = await getDeviceList();
  const device = devices.find(d => d.id === searchedId);
  if (!device) {
    console.error('Device no longer exists');
  }
}
```

### 5. Unknown Errors (999999)

**Action**: Report and fallback
```javascript
if (error.code === '999999') {
  reportError(error);
  // Contact support
  notifyUser('An unexpected error occurred. Please contact support.');
}
```

---

## Common Error Scenarios

### Unable to Get Device List

**Possible Codes**: 010104, 010103, 000101

**Investigation Steps**:
1. ✓ Verify access_token is valid and not expired
2. ✓ Check network connectivity
3. ✓ Verify UAID and Secret Key
4. ✓ Ensure account has devices

### Device Not Responding

**Possible Codes**: 000201, 000202, 020104

**Investigation Steps**:
1. ✓ Check device power and connectivity
2. ✓ Verify device is online in YoLink App
3. ✓ Try again after a delay
4. ✓ Check if device supports the command

### Token Expired

**Possible Codes**: 010104

**Solution**:
```javascript
if (response.code === '010104') {
  const newToken = await refreshAccessToken(refreshToken);
  retryRequest(newToken);
}
```

### Permission Denied

**Possible Codes**: 010300, 020100

**Investigation Steps**:
1. ✓ Verify account permissions
2. ✓ Check if using correct credentials
3. ✓ Ensure device is associated with account
4. ✓ Contact support if needed

---

## Error Code Grouping

### By Severity

#### Critical (Requires Action)
- 010101, 010102: Invalid credentials
- 020100: Device already bound
- Authentication errors

#### Temporary (Retry)
- 010000, 010001: Service unavailable
- 010301: Rate limited
- 020104: Device busy

#### User Input (Validate)
- 010200-010204: Invalid request format
- 020101: Device not found

---

## Monitoring & Logging

### Recommended Logging
```javascript
function logError(error, context) {
  console.error({
    code: error.code,
    description: error.desc,
    method: error.method,
    context: context,
    timestamp: new Date().toISOString()
  });
}
```

### Alert Conditions
- High frequency of 010000 codes → Service issue
- Increasing 010104 frequency → Token refresh issue
- 999999 errors → Contact support immediately

---

## Best Practices

1. **Always check error code**
   - Parse response code before processing data
   - Handle errors gracefully

2. **Implement proper error handling**
   - Retry logic for temporary errors
   - User-friendly error messages

3. **Log errors for debugging**
   - Include timestamp, method, and parameters
   - Track error frequency

4. **Notify users appropriately**
   - Hide internal error codes from users
   - Provide actionable error messages

5. **Monitor error rates**
   - Alert on unusual error patterns
   - Track error code distribution

---

## Related Documentation

- [Data Packet Format](04-datapacket.md)
- [Open API V2](03-openapi-v2.md)
- [UAC Quick Start](05-uac-quickstart.md)

---

**Last Updated**: February 12, 2025
**Source**: https://doc.yosmart.com/docs/protocol/Code
