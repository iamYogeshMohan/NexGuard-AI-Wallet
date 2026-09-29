import { NextResponse } from 'next/server';
import os from 'os';

/**
 * GET /api/lan-ip
 * Returns the machine's first non-loopback IPv4 LAN address.
 * Runs server-side, so it always knows the real network IP.
 */
export async function GET() {
  const interfaces = os.networkInterfaces();
  const candidates: string[] = [];

  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name] || []) {
      if (
        net.family === 'IPv4' &&
        !net.internal &&
        net.address !== '127.0.0.1'
      ) {
        candidates.push(net.address);
      }
    }
  }

  // Prefer real Wi-Fi: 10.x.x.x first, then 192.168.x.x, then 172.16-31.x.x
  const lanIp =
    candidates.find((ip) => ip.startsWith('10.')) ||
    candidates.find((ip) => ip.startsWith('192.168.')) ||
    candidates.find((ip) => /^172\.(1[6-9]|2\d|3[01])\./.test(ip)) ||
    candidates[0] ||
    null;

  return NextResponse.json({ lan_ip: lanIp, all: candidates });
}
