# YoSmart API - Authentication Credentials

## Overview
YoSmart API supports two types of authentication credentials depending on your use case.

## CSID (Customer Service ID)

### What is CSID?
- CSID is issued by YoSmart to business partners for mass access of YoSmart devices
- Designed for enterprise and bulk operations
- Provides broader access capabilities

### CSID Components

| Component | Description |
|-----------|-------------|
| CSID | ID of the customer |
| CSSecKey | Secret key of CSID |

### Getting CSID
- Only available for business partners
- **Contact**: service@yosmart.com to request CSID

---

## UAC (User Access Credential)

### What is UAC?
- **Access credentials** of YoLink Account
- **Created and controlled by users** directly in their application
- Grants third-party applications permission to access user's account and devices
- **Currently supported** for Open API V2

### UAC Components

| Component | Description |
|-----------|-------------|
| UAID | ID of UAC (User Access ID) |
| Secret Key | Secret key of UAC |

### Creating UAC

1. **Open YoLink App**
2. **Navigate to**: Account → Advanced Settings → Personal Access Credentials
3. **Click**: [+] button to create new UAC
4. **Store Securely**: 
   - Keep UAID and Secret Key safe
   - Do not share with third parties
   - Do not store in public storage

### Important Security Notes

⚠️ **WARNING**: The UAC is your security key. Do not:
- Share it with third-party applications
- Store it in public storage
- Commit to version control
- Expose in client-side code

✅ **BEST PRACTICES**:
- Store credentials in environment variables
- Use secure credential management systems
- Rotate credentials regularly
- Revoke unused credentials

---

## Example Credentials Format

### CSID Format
```
CSID: example_csid_12345
CSSecKey: example_secret_key_abcdef
```

### UAC Format
```
UAID: ua_F6E72EAE63AC43FAA6F068C832C7734B
Secret Key: sec_v1_jIC+e8dZoCmthweOFlBb4A==
```

---

## Credential Comparison

| Feature | CSID | UAC |
|---------|------|-----|
| **Issued By** | YoSmart | User (in-app) |
| **Purpose** | Business Partners | Individual Users |
| **Scale** | Mass/Enterprise | Personal |
| **Access Rights** | Can request from others | Own devices only |
| **Creation** | Contact YoSmart | In-app process |

---

## Next Steps

- For CSID users: Contact service@yosmart.com
- For UAC users: Proceed to [Open API V2 Documentation](03-openapi-v2.md)

---

**Last Updated**: December 4, 2025
**Source**: https://doc.yosmart.com/docs/protocol/authentication
