'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Camera,
  ArrowLeft,
  Flashlight,
  Image as ImageIcon,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Zap,
  ArrowRight,
  RefreshCw,
  VideoOff,
  Sparkles,
  Info,
  Copy,
  Check,
} from 'lucide-react';
import jsQR from 'jsqr';
import NexGuardMobileLayout from '@/app/mobile/layout';

function CleanScanQRContent() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const directCameraInputRef = useRef<HTMLInputElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraState, setCameraState] = useState<'requesting' | 'active' | 'denied' | 'error' | 'unsupported'>('requesting');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [torchOn, setTorchOn] = useState<boolean>(false);
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isSecureCtx, setIsSecureCtx] = useState<boolean>(true);
  const [showChromeHelp, setShowChromeHelp] = useState<boolean>(false);
  const [copiedFlag, setCopiedFlag] = useState<boolean>(false);

  const animationFrameId = useRef<number | null>(null);

  const mockQrCodes = [
    {
      name: 'Swiggy Online Food',
      upi: 'swiggy@okhdfc',
      category: 'DINING',
      amount: '500',
      description: 'Routine verified merchant payment • Safe ALLOW',
      riskLevel: 'LOW',
      badgeColor: '#059669',
      badgeBg: '#f0fdf4',
    },
    {
      name: 'Global Tech Electronics',
      upi: 'store@icici',
      category: 'ELECTRONICS',
      amount: '38000',
      description: 'High-value purchase • Triggers Step-Up VERIFY',
      riskLevel: 'VERIFY',
      badgeColor: '#d97706',
      badgeBg: '#fffbeb',
    },
    {
      name: 'Cayman Wire Transfer',
      upi: 'offshore@mule',
      category: 'WIRE',
      amount: '85000',
      description: 'Offshore suspicious mule address • BLOCK',
      riskLevel: 'BLOCK',
      badgeColor: '#dc2626',
      badgeBg: '#fff1f2',
    },
  ];

  // Check secure context on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const secure = window.isSecureContext ?? (window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
      setIsSecureCtx(secure);
    }
  }, []);

  // Parse UPI or QR code contents into recipient details
  const processQrText = useCallback((text: string) => {
    if (isProcessing) return;
    setIsProcessing(true);
    setScannedResult(text);

    let recipient = 'Scanned Recipient';
    let upi = '';
    let amount = '';
    let category = 'PEER';

    try {
      if (text.startsWith('upi://pay') || text.startsWith('UPI://PAY')) {
        const url = new URL(text.replace(/^upi:/i, 'http:'));
        upi = url.searchParams.get('pa') || '';
        recipient = url.searchParams.get('pn') || (upi ? upi.split('@')[0] : 'UPI Recipient');
        amount = url.searchParams.get('am') || '';
        category = url.searchParams.get('mc') ? 'MERCHANT' : 'PEER';
      } else if (text.includes('@')) {
        upi = text.trim();
        recipient = text.split('@')[0].toUpperCase();
        if (text.toLowerCase().includes('swiggy') || text.toLowerCase().includes('food')) {
          category = 'DINING';
          amount = '500';
        }
      } else if (text.startsWith('{') && text.endsWith('}')) {
        const parsed = JSON.parse(text);
        recipient = parsed.name || parsed.recipient || 'Merchant';
        upi = parsed.upi || parsed.upi_id || parsed.pa || '';
        amount = parsed.amount || parsed.am || '';
        category = parsed.category || 'MERCHANT';
      } else {
        upi = `${text.replace(/\s+/g, '').toLowerCase()}@okhdfc`;
        recipient = text;
      }
    } catch {
      upi = text;
      recipient = 'Scanned Payee';
    }

    setTimeout(() => {
      const query = new URLSearchParams();
      if (recipient) query.set('recipient', recipient);
      if (upi) query.set('upi', upi);
      if (amount) query.set('amount', amount);
      if (category) query.set('category', category);

      router.push(`/send?${query.toString()}`);
    }, 600);
  }, [isProcessing, router]);

  // Start live WebRTC camera
  const startCamera = useCallback(async () => {
    setCameraState('requesting');
    setErrorMessage('');
    setScannedResult(null);
    setIsProcessing(false);

    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraState('unsupported');
      setErrorMessage(
        'Phone browsers require HTTPS for live video stream over Wi-Fi. Use the Native Camera Scanner button below to snap & scan instantly!'
      );
      return;
    }

    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      setStream(mediaStream);
      setCameraState('active');

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.error('Camera error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraState('denied');
        setErrorMessage('Camera permission was denied. Tap "Open Phone Camera" or allow in browser settings.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraState('error');
        setErrorMessage('No camera found on this device.');
      } else {
        setCameraState('error');
        setErrorMessage(err.message || 'Unable to start camera.');
      }
    }
  }, [facingMode]);

  // Flashlight toggle
  const toggleTorch = async () => {
    if (!stream) return;
    const videoTrack = stream.getVideoTracks()[0];
    if (videoTrack) {
      try {
        const nextTorch = !torchOn;
        await (videoTrack as any).applyConstraints({
          advanced: [{ torch: nextTorch }],
        });
        setTorchOn(nextTorch);
      } catch {
        setTorchOn(!torchOn);
      }
    } else {
      setTorchOn(!torchOn);
    }
  };

  const flipCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Continuous frame scanning loop
  useEffect(() => {
    let isActive = true;

    const scanFrame = () => {
      if (!isActive) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (
        video &&
        video.readyState === video.HAVE_ENOUGH_DATA &&
        canvas &&
        cameraState === 'active' &&
        !isProcessing
      ) {
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 480;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });

          if (code && code.data && code.data.trim()) {
            processQrText(code.data);
            return;
          }
        }
      }

      animationFrameId.current = requestAnimationFrame(scanFrame);
    };

    if (cameraState === 'active' && !isProcessing) {
      animationFrameId.current = requestAnimationFrame(scanFrame);
    }

    return () => {
      isActive = false;
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [cameraState, isProcessing, processQrText]);

  useEffect(() => {
    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [startCamera]);

  // Handle image capture / gallery upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current || document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });

          if (code && code.data) {
            processQrText(code.data);
          } else {
            alert('No valid QR code recognized in the photo. Please frame the QR code clearly and retry.');
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSelectMockQr = (qr: any) => {
    processQrText(`upi://pay?pa=${encodeURIComponent(qr.upi)}&pn=${encodeURIComponent(qr.name)}&am=${qr.amount}&cu=INR`);
  };

  const copyOriginUrl = () => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.origin);
      setCopiedFlag(true);
      setTimeout(() => setCopiedFlag(false), 2500);
    }
  };

  return (
    <div style={{ width: '100%', boxSizing: 'border-box', padding: '16px 16px 24px', display: 'flex', flexDirection: 'column', gap: 16, fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Hidden Processing Canvas */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Hidden Native Camera Direct Capture Input (Works over HTTP without HTTPS!) */}
      <input
        ref={directCameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={handleFileUpload}
      />

      {/* Hidden Gallery File Input */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileUpload}
      />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link
            href="/home"
            style={{
              width: 32, height: 32, borderRadius: 10,
              background: '#fff', border: '1px solid #e2e8f0',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#475569', textDecoration: 'none',
            }}
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Scan to Pay
            </h1>
            <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>
              Live AI-Protected QR Camera Scanner
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            onClick={flipCamera}
            title="Flip Camera"
            style={{
              width: 32, height: 32,
              borderRadius: 10,
              background: '#fff',
              border: '1px solid #e2e8f0',
              color: '#475569',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <RotateCcw size={15} />
          </button>

          <button
            onClick={toggleTorch}
            title="Toggle Flashlight"
            style={{
              padding: '6px 10px',
              borderRadius: 16,
              background: torchOn ? '#fef08a' : '#fff',
              border: `1px solid ${torchOn ? '#facc15' : '#e2e8f0'}`,
              color: torchOn ? '#854d0e' : '#64748b',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Flashlight size={13} />
            <span>{torchOn ? 'Torch On' : 'Torch'}</span>
          </button>
        </div>
      </div>

      {/* Main Viewfinder Box */}
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: 320,
        aspectRatio: '1/1',
        margin: '0 auto',
        background: '#0a0f1d',
        borderRadius: 24,
        overflow: 'hidden',
        border: scannedResult ? '3px solid #10b981' : '2px solid #1e293b',
        boxShadow: scannedResult ? '0 0 25px rgba(16, 185, 129, 0.4)' : '0 8px 30px rgba(15, 23, 42, 0.3)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.3s ease',
      }}>
        {/* Live Camera Video Feed */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: cameraState === 'active' ? 1 : 0,
            transition: 'opacity 0.4s ease',
          }}
        />

        {/* Overlay when Live Camera is Active */}
        {cameraState === 'active' && !scannedResult && (
          <>
            <div style={{
              position: 'absolute',
              left: 20, right: 20, height: 3,
              background: 'linear-gradient(90deg, transparent, #38bdf8 50%, transparent)',
              boxShadow: '0 0 14px #38bdf8, 0 0 4px #fff',
              animation: 'scannerMove 2.0s ease-in-out infinite',
              zIndex: 3,
            }} />

            <div style={{
              position: 'absolute',
              width: '72%',
              height: '72%',
              border: '1px dashed rgba(255, 255, 255, 0.35)',
              borderRadius: 16,
              pointerEvents: 'none',
              zIndex: 2,
            }}>
              <div style={{ position: 'absolute', top: -2, left: -2, width: 22, height: 22, borderTop: '3px solid #38bdf8', borderLeft: '3px solid #38bdf8', borderTopLeftRadius: 10 }} />
              <div style={{ position: 'absolute', top: -2, right: -2, width: 22, height: 22, borderTop: '3px solid #38bdf8', borderRight: '3px solid #38bdf8', borderTopRightRadius: 10 }} />
              <div style={{ position: 'absolute', bottom: -2, left: -2, width: 22, height: 22, borderBottom: '3px solid #38bdf8', borderLeft: '3px solid #38bdf8', borderBottomLeftRadius: 10 }} />
              <div style={{ position: 'absolute', bottom: -2, right: -2, width: 22, height: 22, borderBottom: '3px solid #38bdf8', borderRight: '3px solid #38bdf8', borderBottomRightRadius: 10 }} />
            </div>

            <div style={{
              position: 'absolute',
              top: 12,
              background: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(8px)',
              padding: '4px 10px',
              borderRadius: 20,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              zIndex: 4,
              border: '1px solid rgba(255,255,255,0.15)',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', animation: 'pulse 1.5s infinite' }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: '#f8fafc', letterSpacing: 0.2 }}>
                Active AI Scanner
              </span>
            </div>
          </>
        )}

        {/* QR Recognized Success Banner */}
        {scannedResult && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(6, 78, 59, 0.90)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            padding: 20,
            textAlign: 'center',
          }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10, boxShadow: '0 0 20px rgba(16, 185, 129, 0.6)' }}>
              <CheckCircle2 size={32} color="#fff" />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#fff', margin: '0 0 4px' }}>QR Code Recognized</h3>
            <p style={{ fontSize: 11, color: '#a7f3d0', margin: '0 0 12px' }}>
              Redirecting to Secure Payment...
            </p>
            <div style={{ width: 22, height: 22, border: '2px solid #a7f3d0', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        )}

        {/* Requesting Live Camera */}
        {cameraState === 'requesting' && (
          <div style={{ textAlign: 'center', padding: '0 24px', zIndex: 1 }}>
            <div style={{ width: 36, height: 36, border: '3px solid #38bdf8', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
            <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', margin: '0 0 4px' }}>Connecting Camera...</p>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', margin: 0 }}>
              Allow camera permission if prompted
            </p>
          </div>
        )}

        {/* HTTP / Insecure Context / Unsupported Live Stream State */}
        {(cameraState === 'unsupported' || cameraState === 'denied' || cameraState === 'error') && (
          <div style={{ textAlign: 'center', padding: '0 18px', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 44, height: 44, borderRadius: 22, background: 'rgba(37, 99, 235, 0.2)', border: '1px solid rgba(59, 130, 246, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Camera size={24} color="#60a5fa" />
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 800, color: '#ffffff', margin: '0 0 4px' }}>
                Scan with Phone Camera
              </p>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', margin: 0, lineHeight: 1.3 }}>
                Tap below to open your camera and scan any UPI QR code instantly.
              </p>
            </div>

            {/* Direct Camera Trigger Button */}
            <button
              onClick={() => directCameraInputRef.current?.click()}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 14,
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                border: 'none',
                color: '#fff',
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.5)',
              }}
            >
              <Camera size={15} />
              <span>Open Phone Camera</span>
            </button>
          </div>
        )}

        <style>{`
          @keyframes scannerMove {
            0% { top: 20px; opacity: 0.3; }
            50% { top: calc(100% - 24px); opacity: 1; }
            100% { top: 20px; opacity: 0.3; }
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.4; transform: scale(1.2); }
          }
        `}</style>
      </div>

      {/* Primary Action Buttons on Mobile */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {/* Direct Phone Camera Button */}
        <button
          onClick={() => directCameraInputRef.current?.click()}
          style={{
            padding: '12px 10px',
            borderRadius: 14,
            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
            border: 'none',
            color: '#fff',
            fontSize: 12,
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
          }}
        >
          <Camera size={16} />
          <span>Snap QR Code</span>
        </button>

        {/* Gallery Image Upload Button */}
        <button
          onClick={() => galleryInputRef.current?.click()}
          style={{
            padding: '12px 10px',
            borderRadius: 14,
            background: '#fff',
            border: '1px solid #e2e8f0',
            color: '#334155',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          <ImageIcon size={16} color="#2563eb" />
          <span>Upload Image</span>
        </button>
      </div>

      {/* Live Video Feed over HTTP Tip Accordion */}
      {!isSecureCtx && (
        <div style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: 16,
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Info size={14} color="#2563eb" />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#1e293b' }}>
                Want continuous live video on Chrome?
              </span>
            </div>
            <button
              onClick={() => setShowChromeHelp(!showChromeHelp)}
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: '#2563eb',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              {showChromeHelp ? 'Hide' : 'Show Steps'}
            </button>
          </div>

          {showChromeHelp && (
            <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.4, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <p style={{ margin: 0 }}>
                Android Chrome blocks continuous WebRTC video over local HTTP. To enable live streaming:
              </p>
              <ol style={{ margin: '0 0 0 16px', padding: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
                <li>Open <strong>chrome://flags</strong> in phone Chrome</li>
                <li>Search for <strong>unsafely-treat-insecure-origin-as-secure</strong></li>
                <li>Enter your laptop URL below and set to <strong>Enabled</strong>:</li>
              </ol>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#eff6ff',
                padding: '6px 10px',
                borderRadius: 8,
                border: '1px solid #bfdbfe',
              }}>
                <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#1e40af', fontWeight: 700 }}>
                  {typeof window !== 'undefined' ? window.location.origin : 'http://<IP>:3000'}
                </span>
                <button
                  onClick={copyOriginUrl}
                  style={{
                    border: 'none',
                    background: '#2563eb',
                    color: '#fff',
                    borderRadius: 6,
                    padding: '2px 6px',
                    fontSize: 10,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3,
                  }}
                >
                  {copiedFlag ? <Check size={10} /> : <Copy size={10} />}
                  <span>{copiedFlag ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Demo Test QR Presets */}
      <div style={{
        background: '#fff',
        borderRadius: 20,
        padding: '16px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>
            Tap to Simulate Scanned QR
          </div>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#2563eb', background: '#eff6ff', padding: '2px 8px', borderRadius: 10 }}>
            Demo Presets
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {mockQrCodes.map((qr) => (
            <button
              key={qr.name}
              onClick={() => handleSelectMockQr(qr)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: 14,
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#eff6ff'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#bfdbfe'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#f8fafc'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#e2e8f0'; }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{qr.name}</span>
                  <span style={{
                    fontSize: 9, fontWeight: 800, padding: '1px 6px', borderRadius: 8,
                    background: qr.badgeBg, color: qr.badgeColor,
                  }}>
                    {qr.riskLevel}
                  </span>
                </div>
                <p style={{ fontSize: 10, color: '#64748b', margin: 0 }}>{qr.description}</p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>
                  ₹{Number(qr.amount).toLocaleString('en-IN')}
                </span>
                <ArrowRight size={14} color="#94a3b8" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ScanPage() {
  return (
    <NexGuardMobileLayout>
      <CleanScanQRContent />
    </NexGuardMobileLayout>
  );
}
