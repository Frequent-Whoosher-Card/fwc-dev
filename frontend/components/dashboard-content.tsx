'use client';
import { useState } from 'react';

export default function DashboardContent() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Superset embedded dashboard - Public role dengan permalink
  const embedUrl = 'https://superset.fwc-kcic.me/superset/dashboard/p/R6jGe42bamV/?standalone=3&show_filters=0';

  return (
    <>
      {loading && (
        <div className="w-full h-[calc(100vh-64px)] flex items-center justify-center absolute top-0 left-0 bg-white z-10">
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-700">Loading dashboard...</div>
            <div className="text-sm text-gray-500 mt-2">Please wait</div>
          </div>
        </div>
      )}
      
      {error && (
        <div className="w-full h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md">
            <div className="text-red-600 text-lg font-semibold mb-4">⚠️ Unable to Load Dashboard</div>
            <p className="text-gray-600 mb-6">Failed to load Superset dashboard</p>
            <button
              onClick={() => window.location.reload()}
              className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      <iframe
        src={embedUrl}
        className="w-full h-[calc(100vh-64px)]"
        style={{ border: 'none' }}
        title="Superset Dashboard"
        onLoad={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setError(true);
        }}
      />
    </>
  );
}