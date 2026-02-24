# YoSmart API - Introduction

## Overview
YoSmart API is the application programming interface provided by YoSmart Cloud. With the YoSmart API, you can control and access the data of devices produced by YoSmart Inc and other products under YoLink brand.

## Who Can Use the API

### For Business Partners
- Receive **CSID** (Customer Service ID) as authentication credentials
- CSID allows you to access large-scale devices
- You can request access to devices from other individual users
- **Contact**: service@yosmart.com to request a CSID

### For Product Users
- Individual product users can create **UAC** (User Access Credential) directly in the application
- UAC serves as authentication credentials for API access
- You can only access devices under your related account through YoSmart API with UAC

## How the API Works

### Architecture
YoSmart API is accessed via the internet (required). The API supports both HTTP and MQTT protocols.

### Key Characteristics
- **Not RESTful**: Uses JSON RPC format instead
- **Unified Protocol**: Achieves DataPacket unification (BDDP, BUDP) across multiple data transfer protocols
- **Dual Protocol Support**: HTTP and MQTT

### API Access Patterns

#### HTTP Access Flow
1. Client sends request via HTTP
2. API processes the request
3. Server returns response

#### MQTT Access Flow
1. Client connects to MQTT broker
2. Client publishes to request topics
3. Server publishes to response topics

## API Documentation Structure

### Key Variables

| Variable | Value | Description |
|----------|-------|-------------|
| HTTP Host (US) | api.yosmart.com | Main API endpoint for HTTP requests |
| MQTT Host (US) | mqtt.api.yosmart.com | MQTT broker endpoint |
| BDDP | Basic Downlink Data Packet | Data sent from client to server |
| BUDP | Basic Uplink Data Packet | Data sent from server to client |

### Document Sections

| Section | Purpose |
|---------|---------|
| Protocol | Describes how API interfaces are accessed |
| Methods | Describes supported API functions and DataPackets |
| Methods - Account | Device management operations |
| Methods - YoLink Devices | Access YoLink products |
| Methods - YoSmart Devices | Access YoSmart SmartHome products |

## Contact Information

| Contact Type | Email |
|--------------|-------|
| YoSmart Service | service@yosmart.com |
| R&D Team | yaochi@yosmart.com |

## Useful Resources

- [Official Website](http://www.yosmart.com/)
- [Shop](https://shop.yosmart.com/)
- [Device Manual](https://shop.yosmart.com/collections/user-guide)
- [Raedius](http://raedius-v2.yosmart.com/)

---

**Last Updated**: December 4, 2025
**Source**: https://doc.yosmart.com/docs/overall/intro
