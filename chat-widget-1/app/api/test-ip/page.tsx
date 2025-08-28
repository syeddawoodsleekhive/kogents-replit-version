"use client";

import { useState } from "react";

export default function TestIPPage() {
  const [results, setResults] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const testAll = async () => {
    setLoading(true);
    const testResults: any = {};

    try {
      // Test 0: Check environment variables
      console.log("=== Testing Environment Variables ===");
      const envResponse = await fetch("/api/check-env");
      const envData = await envResponse.json();
      testResults.environment = envData;
      console.log("Environment check result:", envData);

      // Test 1: Direct detect-ip endpoint
      console.log("=== Testing /api/detect-ip ===");
      const detectResponse = await fetch("/api/detect-ip");
      const detectData = await detectResponse.json();
      testResults.detectIP = detectData;
      console.log("Detect-IP result:", detectData);

      // Test 2: Direct geolocation endpoint
      console.log("=== Testing /api/geolocation ===");
      const geoResponse = await fetch("/api/geolocation");
      const geoData = await geoResponse.json();
      testResults.geolocation = geoData;
      console.log("Geolocation result:", geoData);

      // Test 3: External IP services directly
      console.log("=== Testing external IP services ===");
      const externalIPs = await testExternalServices();
      testResults.externalServices = externalIPs;

      // Test 4: Test with specific IP (if we got one)
      if (detectData.ip || geoData.ip) {
        const testIP = detectData.ip || geoData.ip;
        console.log("=== Testing geolocation with IP:", testIP, "===");
        const postResponse = await fetch("/api/geolocation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ip: testIP }),
        });
        const postData = await postResponse.json();
        testResults.postGeolocation = postData;
        console.log("POST geolocation result:", postData);
      }

    } catch (error) {
      console.error("Test failed:", error);
      testResults.error = error instanceof Error ? error.message : "Unknown error";
    } finally {
      setLoading(false);
      setResults(testResults);
    }
  };

  const testExternalServices = async () => {
    const services = [
      { name: "ipify.org", url: "https://api.ipify.org?format=json" },
      { name: "myip.com", url: "https://api.myip.com" },
      { name: "ipapi.co", url: "https://ipapi.co/json" },
    ];

    const results: any = {};
    
    for (const service of services) {
      try {
        const response = await fetch(service.url);
        if (response.ok) {
          const data = await response.json();
          results[service.name] = { success: true, data };
        } else {
          results[service.name] = { success: false, status: response.status };
        }
      } catch (error) {
        results[service.name] = { success: false, error: error instanceof Error ? error.message : "Unknown error" };
      }
    }

    return results;
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">IP Detection Debug Page</h1>
      
      <div className="mb-6">
        <button
          onClick={testAll}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg disabled:opacity-50 text-lg"
        >
          {loading ? "Testing..." : "Run All Tests"}
        </button>
      </div>

      {Object.keys(results).length > 0 && (
        <div className="space-y-6">
          {results.error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              <strong>Error:</strong> {results.error}
            </div>
          )}

          {results.environment && (
            <div className="bg-gray-100 border border-gray-400 rounded p-4">
              <h2 className="text-xl font-semibold mb-3">Environment Variables</h2>
              <pre className="bg-white p-3 rounded overflow-auto text-sm">
                {JSON.stringify(results.environment, null, 2)}
              </pre>
            </div>
          )}

          {results.detectIP && (
            <div className="bg-gray-100 border border-gray-400 rounded p-4">
              <h2 className="text-xl font-semibold mb-3">1. Detect-IP Endpoint</h2>
              <div className="bg-white p-3 rounded mb-2">
                <strong>IP:</strong> {results.detectIP.ip || "None"}
              </div>
              <div className="bg-white p-3 rounded mb-2">
                <strong>Source:</strong> {results.detectIP.source || "Unknown"}
              </div>
              <pre className="bg-white p-3 rounded overflow-auto text-sm">
                {JSON.stringify(results.detectIP, null, 2)}
              </pre>
            </div>
          )}

          {results.geolocation && (
            <div className="bg-gray-100 border border-gray-400 rounded p-4">
              <h2 className="text-xl font-semibold mb-3">2. Geolocation Endpoint</h2>
              <div className="bg-white p-3 rounded mb-2">
                <strong>IP:</strong> {results.geolocation.ip || "None"}
              </div>
              <div className="bg-white p-3 rounded mb-2">
                <strong>Source:</strong> {results.geolocation.source || "Unknown"}
              </div>
              <pre className="bg-white p-3 rounded overflow-auto text-sm">
                {JSON.stringify(results.geolocation, null, 2)}
              </pre>
            </div>
          )}

          {results.externalServices && (
            <div className="bg-gray-100 border border-gray-400 rounded p-4">
              <h2 className="text-xl font-semibold mb-3">3. External IP Services</h2>
              {Object.entries(results.externalServices).map(([service, result]: [string, any]) => (
                <div key={service} className="bg-white p-3 rounded mb-2">
                  <strong>{service}:</strong> {result.success ? "✅ Success" : "❌ Failed"}
                  {result.success && result.data && (
                    <div className="ml-4 text-sm">
                      IP: {result.data.ip || result.data.query || "Unknown"}
                    </div>
                  )}
                  {!result.success && (
                    <div className="ml-4 text-sm text-red-600">
                      {result.error || `Status: ${result.status}`}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {results.postGeolocation && (
            <div className="bg-gray-100 border border-gray-400 rounded p-4">
              <h2 className="text-xl font-semibold mb-3">4. POST Geolocation Test</h2>
              <pre className="bg-white p-3 rounded overflow-auto text-sm">
                {JSON.stringify(results.postGeolocation, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      <div className="mt-8 bg-yellow-100 border border-yellow-400 rounded p-4">
        <h3 className="font-semibold mb-2">Debug Information:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>Check browser console for detailed logs</li>
          <li>Ensure environment variables are set for NeutrinoAPI</li>
          <li>Check network tab for API calls</li>
          <li>External services should work even on localhost</li>
        </ul>
      </div>
    </div>
  );
} 