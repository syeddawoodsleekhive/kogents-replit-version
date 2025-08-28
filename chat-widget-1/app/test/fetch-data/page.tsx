"use client";

import { useState, useEffect } from "react";
import { detectUserIP } from "@/utils/hybrid-ip-detector";

interface TestResult {
  type: string;
  data: any;
  timestamp: string;
}

export default function MobileDetectionTest() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);

  // Auto-load data when component mounts (like fingerprint)
  useEffect(() => {
    console.log("🚀 === WIDGET INITIALIZING - AUTO-LOADING DATA ===");
    testAllAPIs();
  }, []);

  const testAllAPIs = async () => {
    setLoading(true);
    setResults(prev => [...prev, { 
      type: "All APIs Test", 
      data: { message: "Starting comprehensive API test - IP, Geolocation, and Mobile Detection..." },
      timestamp: new Date().toISOString()
    }]);

    try {
      // Get current user agent
      const userAgent = navigator.userAgent;
      
      // Step 1: Test IP Detection
      const ipResponse = await fetch("/api/detect-ip");
      const ipData = await ipResponse.json();
      
      // Step 2: Test Geolocation
      const geoResponse = await fetch("/api/geolocation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ip: ipData.ip || ipData.clientIP })
      });
      const geoData = await geoResponse.json();
      
      // Step 3: Test Mobile Device Detection (without phone number)
      const mobileResponse = await fetch("/api/mobile-device");
      const mobileData = await mobileResponse.json();
      
      // Step 4: Test NeutrinoAPI Endpoints (UA Lookup only, no HLR)
      const neutrinoResponse = await fetch("/api/mobile-device", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testType: "ualookup",
          userAgent: userAgent,
        }),
      });
      const neutrinoData = await neutrinoResponse.json();
      
      // Combine all data into one comprehensive result
      const combinedResult = {
        timestamp: new Date().toISOString(),
        ipDetection: {
          success: ipResponse.ok,
          data: ipData,
          status: ipResponse.status
        },
        geolocation: {
          success: geoResponse.ok,
          data: geoData,
          status: geoResponse.status
        },
        mobileDetection: {
          success: mobileResponse.ok,
          data: mobileData,
          status: mobileResponse.status
        },
        neutrinoAPITest: {
          success: neutrinoResponse.ok,
          data: neutrinoData,
          status: neutrinoResponse.status
        },
        // Summary of all combined data
        summary: {
          ip: ipData.ip || ipData.clientIP || "Unknown",
          location: geoData.city || geoData.country || "Unknown",
          isMobile: mobileData.mobileInfo?.isMobile || false,
          deviceBrand: mobileData.mobileInfo?.deviceBrand || "Unknown",
          deviceModel: mobileData.mobileInfo?.deviceModel || "Unknown",
          carrier: "N/A (No phone number)",
          network: "N/A (No phone number)",
          detectedBy: mobileData.mobileInfo?.detectedBy || "Unknown"
        }
      };
      
      // Single comprehensive console output
      console.log("🚀 === COMPREHENSIVE WIDGET DATA LOADED ===");
      console.log("⏰ Timestamp:", combinedResult.timestamp);
      console.log("📍 IP Detection:", combinedResult.ipDetection.success ? "✅ SUCCESS" : "❌ FAILED");
      console.log("🌍 Geolocation:", combinedResult.geolocation.success ? "✅ SUCCESS" : "❌ FAILED");
      console.log("📱 Mobile Detection:", combinedResult.mobileDetection.success ? "✅ SUCCESS" : "❌ FAILED");
      console.log("🔬 NeutrinoAPI Test:", combinedResult.neutrinoAPITest.success ? "✅ SUCCESS" : "❌ FAILED");
      console.log("");
      console.log("🎯 === COMBINED SUMMARY ===");
      console.log("📍 IP Address:", combinedResult.summary.ip);
      console.log("🌍 Location:", combinedResult.summary.location);
      console.log("📱 Device Type:", combinedResult.summary.isMobile ? "Mobile" : "Desktop");
      console.log("🏷️ Brand:", combinedResult.summary.deviceBrand);
      console.log("📱 Model:", combinedResult.summary.deviceModel);
      console.log("📡 Carrier:", combinedResult.summary.carrier);
      console.log("🌐 Network:", combinedResult.summary.network);
      console.log("🔍 Detected By:", combinedResult.summary.detectedBy);
      console.log("");
      console.log("📊 === DETAILED DATA ===");
      console.log("IP Detection Data:", combinedResult.ipDetection.data);
      console.log("Geolocation Data:", combinedResult.geolocation.data);
      console.log("Mobile Detection Data:", combinedResult.mobileDetection.data);
      console.log("NeutrinoAPI Test Data:", combinedResult.neutrinoAPITest.data);
      console.log("=====================================");
      
      setResults(prev => [...prev, { 
        type: "All APIs Test", 
        data: combinedResult,
        timestamp: new Date().toISOString()
      }]);
      
    } catch (error) {
      console.error("❌ === COMPREHENSIVE TEST ERROR ===");
      console.error("Error:", error);
      console.error("=====================================");
      
      setResults(prev => [...prev, { 
        type: "All APIs Test Error", 
        data: { error: error instanceof Error ? error.message : String(error) },
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">Fetch All Data Test</h1>
      
      <div className="mb-6 space-y-4">
        <div className="space-y-4">
          <button
            onClick={testAllAPIs}
            className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
          >
            Test All APIs
          </button>
          
          <button
            onClick={() => setResults([])}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            Clear Results
          </button>
        </div>
      </div>

      {results.map((test, index) => (
        <div key={index} className="bg-gray-100 border border-gray-400 rounded p-4">
          <h2 className="text-xl font-semibold mb-3">{test.type}</h2>
          <div className="bg-white p-3 rounded mb-2">
            <strong>Timestamp:</strong> {new Date(test.timestamp).toLocaleString()}
          </div>
          
          {/* Show mobile-specific info if available */}
          {test.data?.mobileInfo && (
            <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-3">
              <h3 className="font-semibold text-blue-800 mb-2">📱 Mobile Device Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div><strong>Is Mobile:</strong> {test.data.mobileInfo.isMobile ? "✅ Yes" : "❌ No"}</div>
                <div><strong>Device Type:</strong> {test.data.mobileInfo.deviceType || "Unknown"}</div>
                <div><strong>Device Brand:</strong> {test.data.mobileInfo.deviceBrand || "Unknown"}</div>
                <div><strong>Device Model:</strong> {test.data.mobileInfo.deviceModel || "Unknown"}</div>
                <div><strong>Carrier:</strong> {test.data.mobileInfo.carrier || "Unknown"}</div>
                <div><strong>Network:</strong> {test.data.mobileInfo.network || "Unknown"}</div>
                <div><strong>Status:</strong> {test.data.mobileInfo.status || "Unknown"}</div>
                <div><strong>Phone Number:</strong> {test.data.mobileInfo.phoneNumber || "None"}</div>
                <div><strong>Detected By:</strong> {test.data.mobileInfo.detectedBy || "Unknown"}</div>
              </div>
              
              {/* Show HLR Data if available */}
              {test.data.mobileInfo.hlrData && (
                <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded">
                  <strong className="text-green-800">📡 HLR Data:</strong>
                  <pre className="text-xs mt-1 overflow-auto">{JSON.stringify(test.data.mobileInfo.hlrData, null, 2)}</pre>
                </div>
              )}
              
              {/* Show User Agent Data if available */}
              {test.data?.mobileInfo?.userAgentData && (
                <div className="mt-3 p-2 bg-purple-50 border border-purple-200 rounded">
                  <strong className="text-purple-800">🌐 User Agent Data:</strong>
                  <pre className="text-xs mt-1 overflow-auto">{JSON.stringify(test.data.mobileInfo.userAgentData, null, 2)}</pre>
                </div>
              )}
            </div>
          )}
          
          {/* Show comprehensive combined data for All APIs Test */}
          {test.type === "All APIs Test" && test.data?.summary && (
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-300 rounded p-4 mb-3">
              <h3 className="font-semibold text-purple-800 mb-3 text-lg">🎯 Combined Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                <div className="bg-white p-2 rounded border">
                  <strong className="text-blue-600">📍 IP Address:</strong><br/>
                  <span className="text-gray-700">{test.data.summary.ip}</span>
                </div>
                <div className="bg-white p-2 rounded border">
                  <strong className="text-green-600">🌍 Location:</strong><br/>
                  <span className="text-gray-700">{test.data.summary.location}</span>
                </div>
                <div className="bg-white p-2 rounded border">
                  <strong className="text-purple-600">📱 Device Type:</strong><br/>
                  <span className="text-gray-700">{test.data.summary.isMobile ? "Mobile" : "Desktop"}</span>
                </div>
                <div className="bg-white p-2 rounded border">
                  <strong className="text-orange-600">🏷️ Brand:</strong><br/>
                  <span className="text-gray-700">{test.data.summary.deviceBrand}</span>
                </div>
                <div className="bg-white p-2 rounded border">
                  <strong className="text-teal-600">📱 Model:</strong><br/>
                  <span className="text-gray-700">{test.data.summary.deviceModel}</span>
                </div>
                <div className="bg-white p-2 rounded border">
                  <strong className="text-indigo-600">📡 Carrier:</strong><br/>
                  <span className="text-gray-700">{test.data.summary.carrier}</span>
                </div>
                <div className="bg-white p-2 rounded border">
                  <strong className="text-pink-600">🌐 Network:</strong><br/>
                  <span className="text-gray-700">{test.data.summary.network}</span>
                </div>
                <div className="bg-white p-2 rounded border">
                  <strong className="text-gray-600">🔍 Detected By:</strong><br/>
                  <span className="text-gray-700">{test.data.summary.detectedBy}</span>
                </div>
              </div>
            </div>
          )}
          
          {/* Show detailed API results for All APIs Test */}
          {test.type === "All APIs Test" && test.data?.ipDetection && (
            <div className="space-y-3 mb-3">
              {/* IP Detection Results */}
              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <h4 className="font-semibold text-blue-800 mb-2">📍 IP Detection Results</h4>
                <div className="text-sm">
                  <div><strong>Status:</strong> {test.data.ipDetection.status} {test.data.ipDetection.success ? "✅" : "❌"}</div>
                  <div><strong>IP:</strong> {test.data.ipDetection.data.ip || test.data.ipDetection.data.clientIP || "Unknown"}</div>
                </div>
              </div>
              
              {/* Geolocation Results */}
              <div className="bg-green-50 border border-green-200 rounded p-3">
                <h4 className="font-semibold text-green-800 mb-2">🌍 Geolocation Results</h4>
                <div className="text-sm">
                  <div><strong>Status:</strong> {test.data.geolocation.status} {test.data.geolocation.success ? "✅" : "❌"}</div>
                  <div><strong>City:</strong> {test.data.geolocation.data.city || "Unknown"}</div>
                  <div><strong>Country:</strong> {test.data.geolocation.data.country || "Unknown"}</div>
                  <div><strong>Coordinates:</strong> {test.data.geolocation.data.coordinates || "Unknown"}</div>
                  <div><strong>Latitude:</strong> {test.data.geolocation.data.latitude || "Unknown"}</div>
                  <div><strong>Longitude:</strong> {test.data.geolocation.data.longitude || "Unknown"}</div>
                </div>
              </div>
              
              {/* Mobile Detection Results */}
              <div className="bg-purple-50 border border-purple-200 rounded p-3">
                <h4 className="font-semibold text-purple-800 mb-2">📱 Mobile Detection Results</h4>
                <div className="text-sm">
                  <div><strong>Status:</strong> {test.data.mobileDetection.status} {test.data.mobileDetection.success ? "✅" : "❌"}</div>
                  <div><strong>Is Mobile:</strong> {test.data.mobileDetection.data.mobileInfo?.isMobile ? "✅ Yes" : "❌ No"}</div>
                  <div><strong>Device Brand:</strong> {test.data.mobileDetection.data.mobileInfo?.deviceBrand || "Unknown"}</div>
                </div>
              </div>
              
              {/* NeutrinoAPI Test Results */}
              <div className="bg-orange-50 border border-orange-200 rounded p-3">
                <h4 className="font-semibold text-orange-800 mb-2">🔬 NeutrinoAPI Test Results</h4>
                <div className="text-sm">
                  <div><strong>Status:</strong> {test.data.neutrinoAPITest.status} {test.data.neutrinoAPITest.success ? "✅" : "❌"}</div>
                  <div><strong>Test Type:</strong> {test.data.neutrinoAPITest.data.testType || "Unknown"}</div>
                </div>
              </div>
            </div>
          )}
          
          {/* Show complete data */}
          <div className="bg-white p-3 rounded mb-2">
            <strong>Complete Data:</strong>
            <pre className="bg-gray-50 p-3 rounded overflow-auto text-xs max-h-96">
              {JSON.stringify(test.data, null, 2)}
            </pre>
          </div>
        </div>
      ))}

      <div className="mt-8 bg-yellow-100 border border-yellow-400 rounded p-4">
        <h3 className="font-semibold mb-2">🚀 Comprehensive API Testing Features:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li><strong>Single Button Test:</strong> One click tests all APIs simultaneously</li>
          <li><strong>IP Detection:</strong> Server-side and external IP detection</li>
          <li><strong>Geolocation:</strong> Location data via NeutrinoAPI and fallbacks</li>
          <li><strong>Mobile Detection:</strong> Device info via UA Lookup (no phone number needed)</li>
          <li><strong>Combined Results:</strong> All data merged into one comprehensive response</li>
          <li><strong>Real-time Logging:</strong> Detailed console logs for debugging</li>
        </ul>
      </div>

      <div className="mt-6 bg-blue-100 border border-blue-400 rounded p-4">
        <h3 className="font-semibold mb-2">🧪 Testing Instructions:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li><strong>Click "Test All APIs":</strong> Single button runs all tests</li>
          <li><strong>View Results:</strong> See combined summary and detailed API responses</li>
          <li><strong>Check Console:</strong> View detailed logs in browser console</li>
          <li><strong>Mobile Testing:</strong> Open on mobile device for best results</li>
          <li><strong>No Setup Required:</strong> Works immediately without any configuration</li>
        </ol>
      </div>
    </div>
  );
} 