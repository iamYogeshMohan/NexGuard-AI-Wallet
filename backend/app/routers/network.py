"""
NexGuard Secure Wallet — Network & Device Connectivity Service
Provides local IP detection and mobile device onboarding links for Wi-Fi presentation.
"""

import socket
from fastapi import APIRouter

router = APIRouter(prefix="/api/network", tags=["Network & Mobile Pairing"])


def get_local_ip() -> str:
    """Detect the host machine's primary local LAN IP address."""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        # Does not actually send data over network
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
    except Exception:
        ip = "127.0.0.1"
    finally:
        s.close()
    return ip


@router.get("/info")
def get_network_info():
    local_ip = get_local_ip()
    return {
        "status": "OPERATIONAL",
        "local_ip": local_ip,
        "frontend_port": 3000,
        "backend_port": 8000,
        "mobile_dashboard_url": f"http://{local_ip}:3000/mobile/dashboard",
        "mobile_send_url": f"http://{local_ip}:3000/mobile/send-money",
        "soc_url": f"http://{local_ip}:3000/soc",
        "device_profiles": {
            "phone_a_trusted": {
                "name": "Phone A (Trusted Pixel 8)",
                "url": f"http://{local_ip}:3000/mobile/dashboard?device=DEVICE-001",
                "device_id": "DEVICE-001",
                "role": "LEGITIMATE_CUSTOMER",
            },
            "phone_b_rogue": {
                "name": "Phone B (Rogue Galaxy S24)",
                "url": f"http://{local_ip}:3000/mobile/dashboard?device=DEVICE-002",
                "device_id": "DEVICE-002",
                "role": "ATTACKER_SIMULATION",
            },
            "phone_c_new": {
                "name": "Phone C (New Device)",
                "url": f"http://{local_ip}:3000/mobile/devices",
                "device_id": "DEVICE-003",
                "role": "ONBOARDING",
            },
        },
    }
