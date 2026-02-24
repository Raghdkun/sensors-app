"""
YoSmart API Client Library

A Python client for interacting with YoSmart devices via the Open API V2.
Handles authentication, token management, and API requests.
"""

import requests
import json
import os
from datetime import datetime, timedelta
from typing import Dict, Optional, List, Any
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class YoSmartAPIClient:
    """Client for YoSmart Open API V2"""
    
    # Configuration
    TOKEN_URL = "https://api.yosmart.com/open/yolink/token"
    API_URL = "https://api.yosmart.com/open/yolink/v2/api"
    PRODUCTION_URL = "https://api.yosmart.com/open/production/v2/api"
    
    def __init__(self, uaid: str, secret_key: str, auto_refresh: bool = True):
        """
        Initialize YoSmart API Client
        
        Args:
            uaid: User Access ID (UAID)
            secret_key: Secret key for UAC
            auto_refresh: Automatically refresh token before expiration
        """
        self.uaid = uaid
        self.secret_key = secret_key
        self.auto_refresh = auto_refresh
        
        self.access_token: Optional[str] = None
        self.refresh_token: Optional[str] = None
        self.token_expires_at: Optional[datetime] = None
        
        self.home_id: Optional[str] = None
        self.devices: List[Dict[str, Any]] = []
    
    def authenticate(self) -> bool:
        """
        Authenticate and get access token
        
        Returns:
            bool: True if authentication successful
        """
        try:
            response = requests.post(
                self.TOKEN_URL,
                data={
                    'grant_type': 'client_credentials',
                    'client_id': self.uaid,
                    'client_secret': self.secret_key
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                self.access_token = data.get('access_token')
                self.refresh_token = data.get('refresh_token')
                expires_in = data.get('expires_in', 3600)
                self.token_expires_at = datetime.now() + timedelta(seconds=expires_in)
                
                logger.info(f"Authentication successful. Token expires at {self.token_expires_at}")
                return True
            else:
                logger.error(f"Authentication failed: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"Authentication error: {str(e)}")
            return False
    
    def refresh_access_token(self) -> bool:
        """
        Refresh access token using refresh token
        
        Returns:
            bool: True if refresh successful
        """
        if not self.refresh_token:
            logger.warning("No refresh token available. Re-authenticating.")
            return self.authenticate()
        
        try:
            response = requests.post(
                self.TOKEN_URL,
                data={
                    'grant_type': 'refresh_token',
                    'client_id': self.uaid,
                    'refresh_token': self.refresh_token
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                self.access_token = data.get('access_token')
                expires_in = data.get('expires_in', 3600)
                self.token_expires_at = datetime.now() + timedelta(seconds=expires_in)
                
                logger.info(f"Token refreshed. New expiration: {self.token_expires_at}")
                return True
            else:
                logger.error(f"Token refresh failed: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"Token refresh error: {str(e)}")
            return False
    
    def _ensure_valid_token(self) -> bool:
        """
        Ensure token is valid, refresh if needed
        
        Returns:
            bool: True if token is valid
        """
        if not self.access_token:
            return self.authenticate()
        
        # Check if token expires in next 5 minutes
        if self.auto_refresh and self.token_expires_at:
            if datetime.now() > self.token_expires_at - timedelta(minutes=5):
                logger.info("Token expiring soon, refreshing...")
                return self.refresh_access_token()
        
        return True
    
    def _call_api(self, method: str, params: Optional[Dict] = None, 
                  url: Optional[str] = None) -> Dict[str, Any]:
        """
        Call YoSmart API
        
        Args:
            method: API method name
            params: Method parameters
            url: API endpoint URL (defaults to main API)
            
        Returns:
            dict: API response
        """
        if not self._ensure_valid_token():
            return {"code": "999999", "desc": "Failed to obtain valid token"}
        
        if url is None:
            url = self.API_URL
        
        payload = {
            'method': method,
            'time': int(datetime.now().timestamp() * 1000)
        }
        
        if params:
            payload['params'] = params
        
        try:
            headers = {
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {self.access_token}'
            }
            
            response = requests.post(url, json=payload, headers=headers, timeout=10)
            
            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"API call failed: {response.status_code}")
                return {
                    "code": str(response.status_code),
                    "desc": f"HTTP {response.status_code} error"
                }
                
        except Exception as e:
            logger.error(f"API call error: {str(e)}")
            return {"code": "999999", "desc": str(e)}
    
    def get_home_info(self) -> Optional[Dict[str, Any]]:
        """
        Get home general information
        
        Returns:
            dict: Home info or None if failed
        """
        result = self._call_api('Home.getGeneralInfo')
        
        if result.get('code') == '000000':
            self.home_id = result.get('data', {}).get('id')
            logger.info(f"Home ID: {self.home_id}")
            return result.get('data')
        else:
            logger.error(f"Failed to get home info: {result.get('desc')}")
            return None
    
    def get_devices(self) -> List[Dict[str, Any]]:
        """
        Get list of all devices in home
        
        Returns:
            list: List of devices
        """
        result = self._call_api('Home.getDeviceList')
        
        if result.get('code') == '000000':
            self.devices = result.get('data', {}).get('devices', [])
            logger.info(f"Found {len(self.devices)} devices")
            return self.devices
        else:
            logger.error(f"Failed to get devices: {result.get('desc')}")
            return []
    
    def get_device_state(self, device_id: str, device_token: str) -> Optional[Dict[str, Any]]:
        """
        Get state of a specific device
        
        Args:
            device_id: Device ID
            device_token: Device token
            
        Returns:
            dict: Device state or None if failed
        """
        params = {
            'targetDevice': {
                'deviceId': device_id,
                'token': device_token
            },
            'params': {}
        }
        
        result = self._call_api('Hub.getState', {
            'targetDevice': {
                'deviceId': device_id,
                'token': device_token
            }
        })
        
        if result.get('code') == '000000':
            return result.get('data')
        else:
            logger.error(f"Failed to get device state: {result.get('desc')}")
            return None
    
    def control_device(self, device_id: str, device_token: str, 
                      method: str, params: Optional[Dict] = None) -> Dict[str, Any]:
        """
        Control a device
        
        Args:
            device_id: Device ID
            device_token: Device token
            method: Control method (e.g., "Switch.setSwitch")
            params: Method parameters
            
        Returns:
            dict: API response
        """
        control_params = {
            'targetDevice': {
                'deviceId': device_id,
                'token': device_token
            }
        }
        
        if params:
            control_params.update(params)
        
        return self._call_api(method, control_params)
    
    # Device Production API Methods
    
    def request_device_ids(self, size: int) -> List[str]:
        """
        Request device IDs for production
        
        Args:
            size: Number of device IDs to request
            
        Returns:
            list: List of device IDs
        """
        result = self._call_api(
            'requestDeviceId',
            {'size': size},
            url=self.PRODUCTION_URL
        )
        
        if result.get('code') == '000000':
            return result.get('data', {}).get('deviceIdList', [])
        else:
            logger.error(f"Failed to request device IDs: {result.get('desc')}")
            return []
    
    def activate_device_id(self, chip_id: str, app_eui: str, 
                          device_id: Optional[str] = None) -> Optional[str]:
        """
        Activate a device ID
        
        Args:
            chip_id: Chip unique ID
            app_eui: Application EUI
            device_id: Device ID (optional, auto-allocated if not provided)
            
        Returns:
            str: Activated device ID or None if failed
        """
        params = {
            'chipId': chip_id,
            'appEui': app_eui
        }
        
        if device_id:
            params['deviceId'] = device_id
        
        result = self._call_api(
            'activateDeviceId',
            params,
            url=self.PRODUCTION_URL
        )
        
        if result.get('code') == '000000':
            return result.get('data', {}).get('deviceId')
        else:
            logger.error(f"Failed to activate device: {result.get('desc')}")
            return None
    
    def request_serial_numbers(self, size: int) -> List[str]:
        """
        Request serial numbers
        
        Args:
            size: Number of serial numbers to request
            
        Returns:
            list: List of serial numbers
        """
        result = self._call_api(
            'requestSN',
            {'size': size},
            url=self.PRODUCTION_URL
        )
        
        if result.get('code') == '000000':
            return result.get('data', {}).get('snList', [])
        else:
            logger.error(f"Failed to request SNs: {result.get('desc')}")
            return []
    
    def bind_serial_number(self, device_id: str, sn: Optional[str] = None) -> Optional[str]:
        """
        Bind serial number to device
        
        Args:
            device_id: Device ID
            sn: Serial number (optional, auto-generated if not provided)
            
        Returns:
            str: Bound serial number or None if failed
        """
        params = {'deviceId': device_id}
        
        if sn:
            params['sn'] = sn
        
        result = self._call_api(
            'bindSN',
            params,
            url=self.PRODUCTION_URL
        )
        
        if result.get('code') == '000000':
            return result.get('data', {}).get('sn')
        else:
            logger.error(f"Failed to bind SN: {result.get('desc')}")
            return None
    
    def get_status(self) -> Dict[str, Any]:
        """
        Get current client status
        
        Returns:
            dict: Status information
        """
        return {
            'authenticated': self.access_token is not None,
            'token_valid': self.token_expires_at and datetime.now() < self.token_expires_at,
            'token_expires_at': self.token_expires_at.isoformat() if self.token_expires_at else None,
            'home_id': self.home_id,
            'device_count': len(self.devices)
        }


# Convenience functions for quick usage

def create_client(uaid: Optional[str] = None, secret_key: Optional[str] = None) -> YoSmartAPIClient:
    """
    Create YoSmart API client using environment variables or provided credentials
    
    Environment variables:
        YOSMART_UAID: User Access ID
        YOSMART_SECRET: Secret key
    
    Args:
        uaid: Override environment UAID
        secret_key: Override environment secret
        
    Returns:
        YoSmartAPIClient: Initialized client
    """
    uaid = uaid or os.getenv('YOSMART_UAID')
    secret_key = secret_key or os.getenv('YOSMART_SECRET')
    
    if not uaid or not secret_key:
        raise ValueError("UAID and secret_key must be provided or set as environment variables")
    
    return YoSmartAPIClient(uaid, secret_key)


# Example usage
if __name__ == "__main__":
    # Initialize client
    client = YoSmartAPIClient(
        uaid="ua_F6E72EAE63AC43FAA6F068C832C7734B",
        secret_key="sec_v1_jIC+e8dZoCmthweOFlBb4A=="
    )
    
    # Authenticate
    if client.authenticate():
        print("✓ Authenticated")
        
        # Get home info
        home = client.get_home_info()
        print(f"✓ Home ID: {client.home_id}")
        
        # Get devices
        devices = client.get_devices()
        print(f"✓ Found {len(devices)} devices")
        
        # Print devices
        for device in devices:
            print(f"  - {device['name']} ({device['type']})")
    else:
        print("✗ Authentication failed")
