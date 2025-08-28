"use client";

import { useState } from "react";
import { detectUserIP } from "@/utils/hybrid-ip-detector";

export default function IPDetectionTest() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testIPDetection = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log("Starting IP detection test...");
      const ipResult = await detectUserIP();
      console.log("IP detection completed:", ipResult);
      setResult(ipResult);
    } catch (err) {
      console.error("IP detection test failed:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const testDirectAPI = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log("Testing direct API calls...");
      
      // Test detect-ip endpoint
      const detectResponse = await fetch("/api/detect-ip");
      const detectData = await detectResponse.json();
      console.log("Detect-IP response:", detectData);
      
      // Test geolocation endpoint
      const geoResponse = await fetch("/api/geolocation");
      const geoData = await geoResponse.json();
      console.log("Geolocation response:", geoData);
      
      setResult({
        detectIP: detectData,
        geolocation: geoData,
      });
    } catch (err) {
      console.error("Direct API test failed:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">IP Detection Test Page</h1>
      
      <div className="space-y-4 mb-6">
        <button
          onClick={testIPDetection}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
        >
          {loading ? "Testing..." : "Test Hybrid IP Detection"}
        </button>
        
        <button
          onClick={testDirectAPI}
          disabled={loading}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 ml-4"
        >
          {loading ? "Testing..." : "Test Direct API Calls"}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <div className="bg-gray-100 border border-gray-400 rounded p-4">
          <h2 className="text-xl font-semibold mb-4">Test Results:</h2>
          <pre className="bg-white p-4 rounded overflow-auto text-sm">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      <div className="mt-8 bg-yellow-100 border border-yellow-400 rounded p-4">
        <h3 className="font-semibold mb-2">Debug Information:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>Check browser console for detailed logs</li>
          <li>Ensure environment variables are set for NeutrinoAPI</li>
          <li>Check network tab for API calls</li>
          <li>Verify server is running on localhost:3001</li>
        </ul>
      </div>
    </div>
  );
} 