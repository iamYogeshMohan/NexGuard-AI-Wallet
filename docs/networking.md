# 🌐 Multi-Device Networking & LAN Setup — NexGuard Secure Wallet

NexGuard is designed for live demonstration across physical mobile phones and laptops connected to the same Local Area Network (Wi-Fi).

---

## 1. Network Topology

```
                  Local Wi-Fi Router / Mobile Hotspot
                                │
          ┌─────────────────────┼─────────────────────┐
          │                     │                     │
          ▼                     ▼                     ▼
     HOST LAPTOP             PHONE A               PHONE B
  (Backend & SOC)       (Trusted Pixel 8)       (Rogue Device)
   192.168.1.100          192.168.1.104          192.168.1.110
   Port 8000 & 3000       Mobile Client          Mobile Client
```

---

## 2. Setting Up Multi-Device LAN Access

### Step 1: Find Host Laptop IP Address
On the host laptop (Windows):
1. Open PowerShell or Command Prompt.
2. Run:
   ```powershell
   ipconfig
   ```
3. Locate **Wireless LAN adapter Wi-Fi** $\rightarrow$ **IPv4 Address** (e.g. `192.168.1.100`).

### Step 2: Configure Environment
In your `.env` file (or set before launch):
```env
NEXT_PUBLIC_API_URL=http://192.168.1.100:8000
NEXT_PUBLIC_WS_URL=ws://192.168.1.100:8000/ws/soc
```

*(Note: The frontend client automatically falls back to `window.location.hostname:8000`, so opening `http://192.168.1.100:3000` on your phone automatically connects to `http://192.168.1.100:8000` without manual changes!)*

### Step 3: Windows Firewall Permission
Ensure Windows Firewall allows inbound connections on ports `8000` and `3000`:
```powershell
netsh advfirewall firewall add rule name="NexGuard Backend 8000" dir=in action=allow protocol=TCP localport=8000
netsh advfirewall firewall add rule name="NexGuard Frontend 3000" dir=in action=allow protocol=TCP localport=3000
```

### Step 4: Open on Phones
Connect your phone to the same Wi-Fi network and navigate to:
- **Phone A:** `http://192.168.1.100:3000/mobile/dashboard`
- **Bank SOC (Laptop):** `http://localhost:3000/soc`
