@echo off
echo ========================================================
echo   NexGuard Secure Wallet - Windows Firewall Configurator
echo ========================================================
echo Adding inbound firewall rules for Port 3000 (Next.js) and Port 8000 (FastAPI)...

netsh advfirewall firewall delete rule name="NexGuard Frontend 3000" >nul 2>&1
netsh advfirewall firewall delete rule name="NexGuard Backend 8000" >nul 2>&1

netsh advfirewall firewall add rule name="NexGuard Frontend 3000" dir=in action=allow protocol=TCP localport=3000 profile=any
netsh advfirewall firewall add rule name="NexGuard Backend 8000" dir=in action=allow protocol=TCP localport=8000 profile=any

echo Setting Wi-Fi network profile to Private...
powershell -Command "Get-NetConnectionProfile -InterfaceAlias 'Wi-Fi' | Set-NetConnectionProfile -NetworkCategory Private" >nul 2>&1

echo.
echo [SUCCESS] Firewall rules configured! Mobile devices can now connect.
echo Local IP: 
powershell -Command "(Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias 'Wi-Fi').IPAddress"
echo.
pause
