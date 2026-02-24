# YoSmart API - Visual Documentation Guide

## 🌳 Documentation Tree

```
docs/yosmart-api/
│
├── 📑 QUICK START GUIDES (START HERE)
│   ├── README.md ⭐⭐⭐
│   │   └─ Main index, quick reference, API overview
│   ├── IMPLEMENTATION_CHECKLIST.md ⭐⭐⭐
│   │   └─ Step-by-step guide with timeline
│   └── SUMMARY.md ⭐⭐
│       └─ Complete overview of all documentation
│
├── 📚 CORE DOCUMENTATION
│   ├── 01-introduction.md
│   │   └─ API capabilities and architecture
│   ├── 02-authentication.md
│   │   └─ CSID vs UAC credential types
│   ├── 03-openapi-v2.md
│   │   └─ HTTP and MQTT protocols
│   └── 04-datapacket.md
│       └─ BDDP and BUDP packet structure
│
├── 🔥 YOUR IMPLEMENTATION
│   ├── 05-uac-quickstart.md ⭐⭐⭐
│   │   └─ 6-step workflow (YOUR CREDENTIALS)
│   └── 08-integration-guide.md ⭐⭐⭐
│       └─ Complete code examples for dashboard
│
├── 🛠 REFERENCE
│   ├── 06-error-codes.md
│   │   └─ 40+ error codes with solutions
│   └── 07-device-production.md
│       └─ Manufacturing/provisioning API
│
└── 💻 CODE & CONFIG
    ├── yosmart_client.py
    │   └─ Production-ready Python client
    ├── yosmart-client.ts
    │   └─ Production-ready TypeScript client
    └── .env.example
        └─ Configuration template
```

---

## 📖 Reading Guide by Goal

### Goal: "Understand the API" (30 minutes)
```
README.md (5 min)
    ↓
01-introduction.md (5 min)
    ↓
02-authentication.md (5 min)
    ↓
03-openapi-v2.md (10 min)
    ↓
04-datapacket.md (5 min)
```

### Goal: "Build Dashboard Display" (3 hours) ⭐ MOST COMMON
```
README.md (5 min)
    ↓
05-uac-quickstart.md (15 min)
    ↓
08-integration-guide.md - Phase 1 (20 min)
    ↓
08-integration-guide.md - Phase 2 (20 min)
    ↓
Copy code examples (30 min)
    ↓
Implement in your app (1 hour)
    ↓
Test (30 min)
```

### Goal: "Handle Errors" (1 hour)
```
06-error-codes.md quick scan (10 min)
    ↓
06-error-codes.md - Error Handling (20 min)
    ↓
06-error-codes.md - Common Scenarios (30 min)
```

### Goal: "Real-time Updates" (4 hours)
```
03-openapi-v2.md - MQTT section (20 min)
    ↓
05-uac-quickstart.md - Step 6 (15 min)
    ↓
Choose MQTT library (10 min)
    ↓
Implement (2+ hours)
    ↓
Test (1 hour)
```

### Goal: "Device Manufacturing" (2 hours)
```
07-device-production.md - Overview (10 min)
    ↓
07-device-production.md - Each method (30 min)
    ↓
Copy/adapt code examples (30 min)
    ↓
Test in production env (30 min)
```

---

## 🎯 Your Starting Point

### What You Need RIGHT NOW:

1. **Open**: [README.md](README.md)
2. **Read**: "Quick Start Paths" section
3. **Choose**: Your implementation path
4. **Follow**: The checklist

### Your Credentials (Already Configured):
```
UAID:   ua_F6E72EAE63AC43FAA6F068C832C7734B
Secret: sec_v1_jIC+e8dZoCmthweOFlBb4A==
```

### Most Important Files:
- ⭐⭐⭐ [README.md](README.md) - Start here
- ⭐⭐⭐ [IMPLEMENTATION_CHECKLIST.md](IMPLEMENTATION_CHECKLIST.md) - Following this
- ⭐⭐⭐ [05-uac-quickstart.md](05-uac-quickstart.md) - Your workflow
- ⭐⭐⭐ [08-integration-guide.md](08-integration-guide.md) - Implementation guide

---

## 📊 Documentation Coverage

### API Methods Documented
- ✅ Home.getDeviceList
- ✅ Home.getGeneralInfo
- ✅ Hub.getState
- ✅ Device.* (control methods)
- ✅ requestDeviceId
- ✅ activateDeviceId
- ✅ requestSN
- ✅ bindSN
- ✅ And 40+ more...

### Error Codes Documented
- ✅ 40+ unique error codes
- ✅ Cause explanation for each
- ✅ Solution for each
- ✅ Grouped by category

### Code Examples Provided
- ✅ cURL examples
- ✅ Python examples
- ✅ JavaScript/TypeScript examples
- ✅ Laravel PHP examples
- ✅ React component examples

### Topics Covered
- ✅ Authentication (both CSID and UAC)
- ✅ Token management
- ✅ HTTP API calls
- ✅ MQTT real-time updates
- ✅ Error handling & recovery
- ✅ Device manufacturing/provisioning
- ✅ Data packet formats
- ✅ Security best practices
- ✅ Performance optimization

---

## 🚀 Implementation Timeline

### Quick Path (Choose One)

#### 🟢 FASTEST: 2-3 hours
Device list in dashboard
```
Requirements: Laravel + React
Result: Dashboard showing devices
```

#### 🟡 INTERMEDIATE: 3-4 hours
Device controls in dashboard
```
Requirements: Everything above + device control
Result: Full device management UI
```

#### 🔵 ADVANCED: 4-5 hours
Real-time device updates
```
Requirements: Everything above + MQTT library
Result: Live dashboard with instant updates
```

---

## ✅ What's Documented

### ✅ Authentication
| Type | Documented | Where |
|------|-----------|-------|
| CSID | Yes | 02-authentication.md |
| UAC | Yes | 05-uac-quickstart.md |
| Token Refresh | Yes | 03-openapi-v2.md |
| Token Caching | Yes | 08-integration-guide.md |

### ✅ Device Operations
| Operation | Documented | Where |
|-----------|-----------|-------|
| List devices | Yes | 05-uac-quickstart.md |
| Get device state | Yes | 05-uac-quickstart.md |
| Control device | Yes | 08-integration-guide.md |
| Subscribe to events | Yes | 05-uac-quickstart.md |

### ✅ Data Handling
| Data | Documented | Where |
|------|-----------|-------|
| BDDP format | Yes | 04-datapacket.md |
| BUDP format | Yes | 04-datapacket.md |
| Error responses | Yes | 06-error-codes.md |
| Device info | Yes | 04-datapacket.md |

### ✅ Implementation
| Task | Documented | Where |
|------|-----------|-------|
| Backend setup | Yes | 08-integration-guide.md |
| Frontend setup | Yes | 08-integration-guide.md |
| Error handling | Yes | 06-error-codes.md |
| Real-time updates | Yes | 03-openapi-v2.md |
| Production deploy | Yes | 08-integration-guide.md |

---

## 📱 Device Operations Summary

```
GET DEVICES
├─ Home.getDeviceList
└─ Returns: [Device, Device, ...]

GET DEVICE STATE
├─ Hub.getState
└─ Returns: {wifi, eth, version, ...}

CONTROL DEVICE
├─ Switch.setSwitch
├─ Lock.setAssistant
├─ Dimmer.setColor
└─ Return: {code, data}

SUBSCRIBE TO EVENTS (MQTT)
├─ Topic: yl-home/{homeId}/+/report
└─ Events: StatusChange, Alert, Report
```

---

## 🔑 Key API Endpoints

```
┌─ AUTHENTICATION
│  └─ POST https://api.yosmart.com/open/yolink/token
│
├─ HTTP API V2
│  └─ POST https://api.yosmart.com/open/yolink/v2/api
│
├─ PRODUCTION API
│  └─ POST https://api.yosmart.com/open/production/v2/api
│
└─ MQTT API V2
   ├─ Host: mqtt.api.yosmart.com
   ├─ Port: 8003 (TCP) or 8004 (WebSocket)
   └─ Topics: yl-home/{homeId}/{device}/*
```

---

## 🛡 Security Checklist

From [08-integration-guide.md](08-integration-guide.md):

- [ ] Credentials in .env (not in code)
- [ ] .env in .gitignore
- [ ] HTTPS for all API calls
- [ ] Tokens cached on server
- [ ] Input validation on all user input
- [ ] Error messages don't leak data
- [ ] API calls logged for audit
- [ ] Proper error handling
- [ ] Rate limiting implemented
- [ ] Dependencies updated

---

## 🎓 Learning Resources

### In This Documentation
- **API Concepts**: 01-introduction.md, 03-openapi-v2.md
- **Authentication**: 02-authentication.md, 05-uac-quickstart.md
- **Troubleshooting**: 06-error-codes.md
- **Implementation**: 08-integration-guide.md
- **Manufacturing**: 07-device-production.md

### External Resources
- [Official YoSmart Docs](https://doc.yosmart.com/)
- [Device Manuals](https://shop.yosmart.com/collections/user-guide)
- [YoSmart Website](http://www.yosmart.com/)

---

## 🔄 Implementation Workflow

```
1. Setup (15 min)
   └─ Copy credentials to .env
   
2. Understand (30 min)
   └─ Read 05-uac-quickstart.md
   
3. Backend (1-2 hours)
   └─ Create Laravel controller
   └─ Add routes
   └─ Test with curl
   
4. Frontend (1-2 hours)
   └─ Create React components
   └─ Create custom hooks
   └─ Connect to backend
   └─ Test in browser
   
5. Error Handling (30 min)
   └─ Add try-catch blocks
   └─ Display errors
   └─ Test error scenarios
   
6. Testing (1 hour)
   └─ Unit tests
   └─ Integration tests
   └─ Real device testing
   
7. Production (1 hour)
   └─ Security review
   └─ Performance optimization
   └─ Deploy

TOTAL TIME: 5-7 hours
```

---

## 📞 Need Help?

### Find Your Answer
1. **For API questions**: README.md → 03-openapi-v2.md
2. **For errors**: 06-error-codes.md
3. **For implementation**: 08-integration-guide.md
4. **For authentication**: 05-uac-quickstart.md
5. **For device control**: 04-datapacket.md

### Contact Support
- **General**: service@yosmart.com
- **Technical**: yaochi@yosmart.com

### Report Issues
- Error code 999999? Report to: yaochi@yosmart.com

---

## ✨ Pro Tips

1. **Read README first** (5 min) - Saves hours
2. **Test with curl** before frontend coding
3. **Implement caching** for tokens and devices
4. **Error handling first** - Saves debugging time
5. **Use the checklists** - Don't skip steps
6. **Security matters** - Credentials are precious
7. **Log everything** - Helps with production bugs
8. **Read error docs** - Most issues are documented

---

## 🎉 You're Ready!

Everything you need is here. Pick your path and get started!

**Next Step**: Open [README.md](README.md)

---

**Last Updated**: February 23, 2026  
**Status**: ✅ Complete and ready to use  
**Credentials**: ✅ Configured  
**Support**: ✅ Full documentation included
