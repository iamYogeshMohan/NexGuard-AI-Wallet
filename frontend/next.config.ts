import type { NextConfig } from "next";
import os from "os";

function getLocalDevOrigins(): string[] {
  const origins = ["localhost", "127.0.0.1", "localhost:3000", "127.0.0.1:3000"];
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name] || []) {
      if (net.family === "IPv4") {
        origins.push(net.address);
        origins.push(`${net.address}:3000`);
      }
    }
  }
  return origins;
}

const nextConfig: NextConfig = {
  allowedDevOrigins: getLocalDevOrigins(),
  devIndicators: false,
};

export default nextConfig;
