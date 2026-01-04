# Mobile App sebagai Scanner - Implementasi Detail

Dokumentasi lengkap untuk implementasi mobile app sebagai scanner yang mengirim hasil scan ke laptop.

## 📱 Overview

Mobile app akan berfungsi sebagai scanner QR code/barcode, kemudian mengirim hasil scan ke laptop melalui beberapa metode komunikasi.

## 🎯 Opsi Implementasi

### **Opsi 1: PWA (Progressive Web App)** ⭐ RECOMMENDED
- ✅ Tidak perlu app store
- ✅ Install langsung dari browser
- ✅ Bisa pakai kamera mobile
- ✅ Update otomatis

### **Opsi 2: React Native App**
- ✅ Native performance
- ✅ Bisa publish ke Play Store/App Store
- ⚠️ Perlu build & publish

### **Opsi 3: Web App Mobile (Simple)**
- ✅ Paling mudah
- ✅ Tidak perlu install
- ⚠️ Harus buka browser setiap kali

---

## 🚀 Opsi 1: PWA (Progressive Web App) - DETAIL LANGKAH

### **Step 1: Setup PWA di Frontend**

#### 1.1 Install Dependencies
```bash
cd frontend
npm install html5-qrcode workbox-webpack-plugin
# atau
pnpm add html5-qrcode workbox-webpack-plugin
```

#### 1.2 Buat Manifest File
Buat file `public/manifest.json`:
```json
{
  "name": "FWC Scanner",
  "short_name": "FWC Scan",
  "description": "Mobile scanner untuk redeem kartu FWC",
  "start_url": "/scanner",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#000000",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "permissions": [
    "camera"
  ]
}
```

#### 1.3 Update Layout untuk PWA
Update `app/layout.tsx`:
```typescript
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black" />
        <meta name="apple-mobile-web-app-title" content="FWC Scanner" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

### **Step 2: Buat Mobile Scanner Page**

#### 2.1 Buat Halaman Scanner
Buat file `app/scanner/page.tsx`:
```typescript
'use client';

import { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export default function ScannerPage() {
  const [serialNumber, setSerialNumber] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const qrBoxId = 'qr-reader';

  // Start scanner
  const startScanner = async () => {
    try {
      const scanner = new Html5Qrcode(qrBoxId);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' }, // Back camera
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          // QR code detected
          handleScanSuccess(decodedText);
        },
        (errorMessage) => {
          // Error handling (usually just means no QR code detected yet)
        }
      );

      setIsScanning(true);
      setError(null);
    } catch (err: any) {
      console.error('Error starting scanner:', err);
      setError('Gagal mengaktifkan kamera. Pastikan izin kamera sudah diberikan.');
    }
  };

  // Stop scanner
  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
        scannerRef.current = null;
        setIsScanning(false);
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
  };

  // Handle scan success
  const handleScanSuccess = async (decodedText: string) => {
    setSerialNumber(decodedText);
    setScanResult(decodedText);
    
    // Stop scanner after successful scan
    await stopScanner();

    // Send to laptop (via API)
    await sendToLaptop(decodedText);
  };

  // Send scanned serial number to laptop
  const sendToLaptop = async (serialNumber: string) => {
    try {
      // Method 1: Via API endpoint (laptop polling)
      const response = await fetch('/api/scanner/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serialNumber,
          timestamp: new Date().toISOString(),
          deviceId: getDeviceId(),
        }),
      });

      if (response.ok) {
        alert(`✅ Nomor seri ${serialNumber} berhasil dikirim ke laptop!`);
        setScanResult(null);
        setSerialNumber('');
      } else {
        throw new Error('Gagal mengirim ke laptop');
      }
    } catch (err) {
      console.error('Error sending to laptop:', err);
      alert('❌ Gagal mengirim ke laptop. Coba lagi.');
    }
  };

  // Get device ID (for tracking)
  const getDeviceId = () => {
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = `mobile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('deviceId', deviceId);
    }
    return deviceId;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        stopScanner();
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-4 text-center">
          FWC Scanner
        </h1>

        {/* Manual Input (Fallback) */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Nomor Seri (Manual)
          </label>
          <input
            type="text"
            value={serialNumber}
            onChange={(e) => setSerialNumber(e.target.value)}
            placeholder="Masukkan nomor seri"
            className="w-full px-4 py-2 border rounded-lg"
          />
          <button
            onClick={() => sendToLaptop(serialNumber)}
            disabled={!serialNumber}
            className="mt-2 w-full bg-blue-500 text-white py-2 rounded-lg disabled:bg-gray-300"
          >
            Kirim ke Laptop
          </button>
        </div>

        {/* Scanner Section */}
        <div className="mb-4">
          {!isScanning ? (
            <button
              onClick={startScanner}
              className="w-full bg-green-500 text-white py-3 rounded-lg font-semibold"
            >
              📷 Mulai Scan QR Code
            </button>
          ) : (
            <>
              <div
                id={qrBoxId}
                className="w-full mb-4 rounded-lg overflow-hidden"
                style={{ height: '300px' }}
              />
              <button
                onClick={stopScanner}
                className="w-full bg-red-500 text-white py-3 rounded-lg font-semibold"
              >
                ⏹️ Stop Scan
              </button>
            </>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Scan Result */}
        {scanResult && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            ✅ Terdeteksi: {scanResult}
          </div>
        )}

        {/* Instructions */}
        <div className="mt-6 text-sm text-gray-600">
          <h3 className="font-semibold mb-2">Cara Pakai:</h3>
          <ol className="list-decimal list-inside space-y-1">
            <li>Klik "Mulai Scan QR Code"</li>
            <li>Izinkan akses kamera</li>
            <li>Arahkan kamera ke QR code di kartu</li>
            <li>Nomor seri akan otomatis terkirim ke laptop</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
```

### **Step 3: Buat API Endpoint untuk Receive Scan**

#### 3.1 Buat API Route
Buat file `app/api/scanner/send/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';

// In-memory storage (untuk demo, bisa ganti dengan Redis/database)
const pendingScans = new Map<string, {
  serialNumber: string;
  timestamp: string;
  deviceId: string;
}>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { serialNumber, timestamp, deviceId } = body;

    if (!serialNumber) {
      return NextResponse.json(
        { error: 'Serial number is required' },
        { status: 400 }
      );
    }

    // Store scan result
    const scanId = `scan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    pendingScans.set(scanId, {
      serialNumber,
      timestamp,
      deviceId,
    });

    // Auto-delete after 5 minutes
    setTimeout(() => {
      pendingScans.delete(scanId);
    }, 5 * 60 * 1000);

    return NextResponse.json({
      success: true,
      scanId,
      message: 'Serial number received',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }
}

// GET endpoint untuk laptop polling
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const deviceId = searchParams.get('deviceId');

  // Get latest scan for this device
  const scans = Array.from(pendingScans.entries())
    .filter(([_, scan]) => !deviceId || scan.deviceId === deviceId)
    .sort(([_, a], [__, b]) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

  if (scans.length === 0) {
    return NextResponse.json({
      success: true,
      hasScan: false,
    });
  }

  const [scanId, scanData] = scans[0];
  
  // Delete after retrieved
  pendingScans.delete(scanId);

  return NextResponse.json({
    success: true,
    hasScan: true,
    data: scanData,
  });
}
```

### **Step 4: Update Laptop Redeem Page untuk Receive Scan**

#### 4.1 Update Redeem Page dengan Polling
Update `app/dashboard/petugas/redeem/page.tsx`:
```typescript
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RedeemPage() {
  const [serialNumber, setSerialNumber] = useState('');
  const [cardInfo, setCardInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const router = useRouter();

  // Get device ID
  useEffect(() => {
    let id = localStorage.getItem('laptopDeviceId');
    if (!id) {
      id = `laptop-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('laptopDeviceId', id);
    }
    setDeviceId(id);
  }, []);

  // Polling untuk receive scan dari mobile
  useEffect(() => {
    if (!deviceId) return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/scanner/send?deviceId=${deviceId}`);
        const data = await response.json();

        if (data.success && data.hasScan && data.data) {
          // Receive scan dari mobile
          const receivedSerial = data.data.serialNumber;
          setSerialNumber(receivedSerial);
          
          // Auto validate
          await validateCard(receivedSerial);
        }
      } catch (error) {
        console.error('Error polling scan:', error);
      }
    }, 1000); // Poll setiap 1 detik

    return () => clearInterval(pollInterval);
  }, [deviceId]);

  // Validate card
  const validateCard = async (serial: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/cards/validate/${serial}`);
      const data = await response.json();

      if (data.success) {
        setCardInfo(data.data.card);
      } else {
        alert(`Error: ${data.error.message}`);
      }
    } catch (error) {
      alert('Error validasi kartu');
    } finally {
      setLoading(false);
    }
  };

  // Handle redeem
  const handleRedeem = async () => {
    // ... existing redeem logic
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Redeem Kartu</h2>
        <p className="text-xs text-gray-500">
          Scan QR code dari mobile app atau input manual
        </p>
      </div>

      {/* Device ID untuk pairing */}
      {deviceId && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm">
            <strong>Device ID:</strong> {deviceId}
          </p>
          <p className="text-xs text-gray-600 mt-1">
            Gunakan ID ini untuk pairing dengan mobile scanner
          </p>
        </div>
      )}

      {/* Input Field */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Nomor Seri
        </label>
        <input
          type="text"
          value={serialNumber}
          onChange={(e) => setSerialNumber(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              validateCard(serialNumber);
            }
          }}
          placeholder="Scan dari mobile atau input manual"
          className="w-full px-4 py-2 border rounded-lg"
          autoFocus
        />
        <p className="text-xs text-gray-500 mt-1">
          💡 Scan QR code dari mobile app akan otomatis ter-input di sini
        </p>
      </div>

      {/* Card Info */}
      {cardInfo && (
        <div className="bg-white border rounded-lg p-4">
          <h3 className="font-semibold mb-2">Info Kartu</h3>
          <p>Serial: {cardInfo.serialNumber}</p>
          <p>Member: {cardInfo.member?.name}</p>
          <p>Sisa Kuota: {cardInfo.quotaTicket} / {cardInfo.totalQuota}</p>
          <button
            onClick={handleRedeem}
            className="mt-4 bg-green-500 text-white px-4 py-2 rounded-lg"
          >
            Konfirmasi Redeem
          </button>
        </div>
      )}

      {loading && <p>Memvalidasi...</p>}
    </div>
  );
}
```

---

## 🔄 Opsi 2: WebSocket (Real-time) - Alternatif Lebih Cepat

Jika ingin komunikasi real-time tanpa polling, gunakan WebSocket:

### **Step 1: Setup WebSocket Server (Backend)**

Buat file `backend/src/modules/scanner/websocket.ts`:
```typescript
import { Server } from 'socket.io';

export function setupScannerWebSocket(server: any) {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Mobile app sends scan result
    socket.on('scan-result', (data: { serialNumber: string; deviceId: string }) => {
      // Broadcast to all laptop clients
      io.emit('new-scan', {
        serialNumber: data.serialNumber,
        deviceId: data.deviceId,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
}
```

### **Step 2: Mobile App Connect ke WebSocket**

Update `app/scanner/page.tsx`:
```typescript
import { useEffect } from 'react';
import { io } from 'socket.io-client';

// In component
useEffect(() => {
  const socket = io('http://localhost:3001'); // Backend URL

  socket.on('connect', () => {
    console.log('Connected to WebSocket');
  });

  // Send scan result
  const sendScanResult = (serialNumber: string) => {
    socket.emit('scan-result', {
      serialNumber,
      deviceId: getDeviceId(),
    });
  };

  // Update handleScanSuccess
  const handleScanSuccess = async (decodedText: string) => {
    sendScanResult(decodedText);
    // ... rest of logic
  };

  return () => {
    socket.disconnect();
  };
}, []);
```

### **Step 3: Laptop Listen ke WebSocket**

Update `app/dashboard/petugas/redeem/page.tsx`:
```typescript
useEffect(() => {
  const socket = io('http://localhost:3001');

  socket.on('new-scan', (data: { serialNumber: string }) => {
    setSerialNumber(data.serialNumber);
    validateCard(data.serialNumber);
  });

  return () => {
    socket.disconnect();
  };
}, []);
```

---

## 📱 Opsi 3: QR Code Pairing (Advanced)

Untuk pairing mobile dengan laptop spesifik:

### **Step 1: Generate Pairing QR Code di Laptop**

```typescript
// Di laptop redeem page
const generatePairingQR = () => {
  const pairingData = {
    deviceId: deviceId,
    sessionId: `session-${Date.now()}`,
    timestamp: new Date().toISOString(),
  };

  // Generate QR code dari pairing data
  const qrData = JSON.stringify(pairingData);
  // Use QR code library to display
};
```

### **Step 2: Mobile Scan Pairing QR**

```typescript
// Di mobile scanner
const handlePairingScan = (decodedText: string) => {
  const pairingData = JSON.parse(decodedText);
  localStorage.setItem('pairedDeviceId', pairingData.deviceId);
  localStorage.setItem('sessionId', pairingData.sessionId);
};
```

---

## 🎯 Ringkasan Implementasi

### **Metode 1: API Polling (Paling Simple)**
1. ✅ Mobile scan → POST ke `/api/scanner/send`
2. ✅ Laptop polling → GET `/api/scanner/send?deviceId=xxx`
3. ✅ Simple, tidak perlu WebSocket

### **Metode 2: WebSocket (Real-time)**
1. ✅ Mobile scan → emit `scan-result`
2. ✅ Laptop listen → on `new-scan`
3. ✅ Real-time, lebih cepat

### **Metode 3: QR Code Pairing**
1. ✅ Laptop generate pairing QR
2. ✅ Mobile scan pairing QR
3. ✅ Mobile hanya kirim ke laptop yang sudah paired

---

## 📝 Checklist Implementasi

- [ ] Install dependencies (`html5-qrcode`)
- [ ] Buat manifest.json untuk PWA
- [ ] Buat halaman scanner mobile (`/scanner`)
- [ ] Buat API endpoint receive scan
- [ ] Update laptop redeem page dengan polling/WebSocket
- [ ] Test scan dari mobile
- [ ] Test receive di laptop
- [ ] Handle error cases
- [ ] Add loading states
- [ ] Add success/error notifications

---

## 🚀 Deploy & Install PWA

### **Cara Install PWA di Mobile:**

1. Buka browser mobile (Chrome/Safari)
2. Navigate ke: `https://your-domain.com/scanner`
3. Browser akan tampilkan prompt "Add to Home Screen"
4. Klik "Add" → PWA terinstall
5. Buka dari home screen seperti native app

### **Cara Pakai:**

1. Petugas buka PWA di mobile
2. Scan QR code di kartu
3. Nomor seri otomatis terkirim ke laptop
4. Laptop auto-validate dan tampilkan info kartu
5. Petugas klik konfirmasi redeem di laptop

---

## 🔒 Security Considerations

1. **Device ID Validation**: Validasi device ID untuk mencegah unauthorized access
2. **Session Management**: Gunakan session untuk pairing mobile-laptop
3. **Rate Limiting**: Limit jumlah scan per device
4. **HTTPS**: Wajib HTTPS untuk PWA dan camera access
5. **Token Authentication**: Mobile app harus login dulu sebelum bisa scan

---

## 📚 Resources

- [Html5Qrcode Documentation](https://github.com/mebjas/html5-qrcode)
- [PWA Guide](https://web.dev/progressive-web-apps/)
- [Socket.io Documentation](https://socket.io/docs/v4/)














