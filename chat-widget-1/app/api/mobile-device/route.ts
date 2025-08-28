import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    // Get user agent from request headers
    const userAgent = request.headers.get("user-agent") || "";
    const forwardedFor = request.headers.get("x-forwarded-for");
    const realIP = request.headers.get("x-real-ip");
    const cfConnectingIP = request.headers.get("cf-connecting-ip");
    
    // Get client IP
    let clientIP = cfConnectingIP || realIP || forwardedFor?.split(",")[0].trim() || "";
    

    console.log("📱 User Agent:", userAgent.substring(0, 100) + "...");
    console.log("📱 Is Mobile:", isMobileDevice(userAgent));


    // Check if environment variables are set
    const userId = process.env.NEXT_PUBLIC_NEUTRINO_USER_ID;
    const apiKey = process.env.NEXT_PUBLIC_NEUTRINO_API_KEY;
    
    if (!userId || !apiKey) {
      const basicInfo = getBasicMobileInfo(userAgent);
      console.log("📊 Basic Mobile Info:", basicInfo);
      
      return NextResponse.json({
        error: "NeutrinoAPI credentials not configured",
        mobileInfo: basicInfo,
        timestamp: new Date().toISOString(),
      });
    }

    // Get mobile device information using NeutrinoAPI
    const mobileInfo = await getNeutrinoMobileInfo(userAgent, clientIP, userId, apiKey);
    
  
    console.log("📊 Final Mobile Info:", mobileInfo);

    
    return NextResponse.json({
      success: true,
      mobileInfo,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error("❌ === MOBILE DEVICE DETECTION ERROR ===");
    return NextResponse.json({ 
      error: "Failed to detect mobile device",
      mobileInfo: getBasicMobileInfo(request.headers.get("user-agent") || ""),
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber, userAgent } = body;
    
    if (!phoneNumber) {
      const basicInfo = getBasicMobileInfo(userAgent || "");
      
      return NextResponse.json({
        error: "Phone number is required for detailed mobile info",
        mobileInfo: basicInfo,
        timestamp: new Date().toISOString(),
      });
    }

    // Check if environment variables are set
    const userId = process.env.NEXT_PUBLIC_NEUTRINO_USER_ID;
    const apiKey = process.env.NEXT_PUBLIC_NEUTRINO_API_KEY;
    
    if (!userId || !apiKey) {
      const basicInfo = getBasicMobileInfo(userAgent || "");
      
      return NextResponse.json({
        error: "NeutrinoAPI credentials not configured",
        mobileInfo: basicInfo,
        timestamp: new Date().toISOString(),
      });
    }

    // Get detailed mobile info with phone number
    const mobileInfo = await getDetailedMobileInfo(phoneNumber, userAgent, userId, apiKey);
    
    return NextResponse.json({
      success: true,
      mobileInfo,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    return NextResponse.json({ 
      error: "Failed to detect mobile device",
      mobileInfo: getBasicMobileInfo(""),
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

// Add a test endpoint for debugging NeutrinoAPI calls
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { testType, phoneNumber, userAgent } = body;
    
    // Check if environment variables are set
    const userId = process.env.NEXT_PUBLIC_NEUTRINO_USER_ID;
    const apiKey = process.env.NEXT_PUBLIC_NEUTRINO_API_KEY;
    
    if (!userId || !apiKey) {
      return NextResponse.json({
        error: "NeutrinoAPI credentials not configured",
        testType,
        timestamp: new Date().toISOString(),
      }, { status: 400 });
    }

    const testResult: any = {
      testType,
      timestamp: new Date().toISOString(),
    };

    if (testType === "hlr" && phoneNumber) {
      console.log("🧪 Testing HLR Lookup API...");
      try {
        const hlrResponse = await fetch("https://neutrinoapi.net/hlr-lookup", {
          method: "POST",
          headers: {
            "User-ID": userId,
            "API-Key": apiKey,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            "number": phoneNumber,
          }),
        });

        if (hlrResponse.ok) {
          const hlrData = await hlrResponse.json();
          testResult.hlrTest = { status: hlrResponse.status, success: true, data: hlrData };
          console.log("✅ HLR Lookup API Success:", hlrData);
        } else {
          const errorText = await hlrResponse.text();
          testResult.hlrTest = { status: hlrResponse.status, success: false, data: { error: errorText } };
          console.log("❌ HLR Lookup API Failed:", hlrResponse.status, errorText);
        }
      } catch (error) {
        testResult.hlrTest = { status: 500, success: false, data: { error: String(error) } };
        console.log("❌ HLR Lookup API Error:", error);
      }
    }

    if (testType === "ualookup" && userAgent) {
      console.log("🧪 Testing NeutrinoAPI UA Lookup API...");
      console.log("📡 API Endpoint: https://neutrinoapi.net/ua-lookup");
      console.log("🔑 Using User ID:", userId);
      console.log("📱 User Agent:", userAgent.substring(0, 100) + "...");
      
      try {
        const uaResponse = await fetch("https://neutrinoapi.net/ua-lookup", {
          method: "POST",
          headers: {
            "User-ID": userId,
            "API-Key": apiKey,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            "ua": userAgent,
          }),
        });

        console.log("📡 UA Lookup API Response Status:", uaResponse.status);
        console.log("📡 UA Lookup API Response Headers:", Object.fromEntries(uaResponse.headers.entries()));

        if (uaResponse.ok) {
          const uaData = await uaResponse.json();
          testResult.uaLookupTest = { status: uaResponse.status, success: true, data: uaData };
          console.log("✅ UA Lookup API Success!");
          console.log("📊 UA Lookup Data:", uaData);
        } else {
          const errorText = await uaResponse.text();
          testResult.uaLookupTest = { status: uaResponse.status, success: false, data: { error: errorText } };
          console.log("❌ UA Lookup API Failed with status:", uaResponse.status);
          console.log("❌ Error response:", errorText);
          
          try {
            const errorData = JSON.parse(errorText);
            console.log("❌ Parsed error data:", errorData);
          } catch (parseError) {
            console.log("❌ Could not parse error response as JSON");
          }
        }
      } catch (error) {
        testResult.uaLookupTest = { status: 500, success: false, data: { error: String(error) } };
        console.log("❌ UA Lookup API Error:", error);
      }
    }

    if (testType === "useragent" && userAgent) {
      console.log("🧪 Testing NeutrinoAPI UA Lookup API...");
      console.log("📡 API Endpoint: https://neutrinoapi.net/ua-lookup");
      console.log("🔑 Using User ID:", userId);
      console.log("📱 User Agent:", userAgent.substring(0, 100) + "...");
      
      try {
        const uaResponse = await fetch("https://neutrinoapi.net/ua-lookup", {
          method: "POST",
          headers: {
            "User-ID": userId,
            "API-Key": apiKey,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            "ua": userAgent,
          }),
        });

        console.log("📡 UA Lookup API Response Status:", uaResponse.status);
        console.log("📡 UA Lookup API Response Headers:", Object.fromEntries(uaResponse.headers.entries()));

        if (uaResponse.ok) {
          const uaData = await uaResponse.json();
          testResult.userAgentTest = { status: uaResponse.status, success: true, data: uaData };
          console.log("✅ UA Lookup API Success!");
          console.log("📊 UA Lookup Data:", uaData);
        } else {
          const errorText = await uaResponse.text();
          testResult.userAgentTest = { status: uaResponse.status, success: false, data: { error: errorText } };
          console.log("❌ UA Lookup API Failed with status:", uaResponse.status);
          console.log("❌ Error response:", errorText);
          
          try {
            const errorData = JSON.parse(errorText);
            console.log("❌ Parsed error data:", errorData);
          } catch (parseError) {
            console.log("❌ Could not parse error response as JSON");
          }
        }
      } catch (error) {
        testResult.userAgentTest = { status: 500, success: false, data: { error: String(error) } };
        console.log("❌ UA Lookup API Error:", error);
      }
    }

    if (testType === "both") {
      console.log("🧪 Testing both APIs...");
      // Test HLR
      if (phoneNumber) {
        try {
          const hlrResponse = await fetch("https://neutrinoapi.net/hlr-lookup", {
            method: "POST",
            headers: {
              "User-ID": userId,
              "API-Key": apiKey,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              "number": phoneNumber,
            }),
          });

          if (hlrResponse.ok) {
            const hlrData = await hlrResponse.json();
            testResult.hlrTest = { status: hlrResponse.status, success: true, data: hlrData };
            console.log("✅ HLR Lookup API Success:", hlrData);
          } else {
            const errorText = await hlrResponse.text();
            testResult.hlrTest = { status: hlrResponse.status, success: false, data: { error: errorText } };
            console.log("❌ HLR Lookup API Failed:", hlrResponse.status, errorText);
          }
        } catch (error) {
          testResult.hlrTest = { status: 500, success: false, data: { error: String(error) } };
          console.log("❌ HLR Lookup API Error:", error);
        }
      }

      // Test UA Lookup
      if (userAgent) {
        try {
          console.log("🧪 Testing NeutrinoAPI UA Lookup API...");
          console.log("📡 API Endpoint: https://neutrinoapi.net/ua-lookup");
          console.log("🔑 Using User ID:", userId);
          console.log("📱 User Agent:", userAgent.substring(0, 100) + "...");
          
          const uaResponse = await fetch("https://neutrinoapi.net/ua-lookup", {
            method: "POST",
            headers: {
              "User-ID": userId,
              "API-Key": apiKey,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              "ua": userAgent,
            }),
          });

          console.log("📡 UA Lookup API Response Status:", uaResponse.status);
          console.log("📡 UA Lookup API Response Headers:", Object.fromEntries(uaResponse.headers.entries()));

          if (uaResponse.ok) {
            const uaData = await uaResponse.json();
            testResult.uaLookupTest = { status: uaResponse.status, success: true, data: uaData };
            console.log("✅ UA Lookup API Success!");
            console.log("📊 UA Lookup Data:", uaData);
          } else {
            const errorText = await uaResponse.text();
            testResult.uaLookupTest = { status: uaResponse.status, success: false, data: { error: errorText } };
            console.log("❌ UA Lookup API Failed with status:", uaResponse.status);
            console.log("❌ Error response:", errorText);
            
            try {
              const errorData = JSON.parse(errorText);
              console.log("❌ Parsed error data:", errorData);
            } catch (parseError) {
              console.log("❌ Could not parse error response as JSON");
            }
          }
        } catch (error) {
          testResult.uaLookupTest = { status: 500, success: false, data: { error: String(error) } };
          console.log("❌ UA Lookup API Error:", error);
        }
      }
    }
    
    console.log("🧪 Test Results:", testResult);
    console.log("=====================================");
    
    return NextResponse.json({
      success: true,
      testType,
      ...testResult,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error("❌ === NEUTRINOAPI TEST ERROR ===");
    console.error("Error:", error);
    console.error("=====================================");
    
    return NextResponse.json({ 
      error: "Test failed",
      testType: "unknown",
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

/**
 * Basic mobile device detection from user agent
 */
function getBasicMobileInfo(userAgent: string) {
  const isMobile = isMobileDevice(userAgent);
  const deviceInfo = extractDeviceInfoFromUserAgent(userAgent);
  
  return {
    isMobile,
    deviceType: isMobile ? "Mobile" : "Desktop",
    userAgent: userAgent.substring(0, 200),
    detectedBy: "user-agent-analysis",
    carrier: null,
    network: null,
    status: null,
    phoneNumber: null,
    deviceBrand: deviceInfo.brand,
    deviceModel: deviceInfo.model,
    hlrData: null,
    userAgentData: deviceInfo,
  };
}

/**
 * Check if device is mobile based on user agent
 */
function isMobileDevice(userAgent: string): boolean {
  const mobileKeywords = [
    'mobile', 'android', 'iphone', 'ipad', 'blackberry', 'windows phone',
    'opera mini', 'mobile safari', 'mobile chrome', 'mobile firefox'
  ];
  
  const lowerUA = userAgent.toLowerCase();
  return mobileKeywords.some(keyword => lowerUA.includes(keyword));
}

/**
 * Extract device information from user agent string
 */
function extractDeviceInfoFromUserAgent(userAgent: string) {
  const ua = userAgent.toLowerCase();
  let brand = null;
  let model = null;
  
  // Android devices
  if (ua.includes('android')) {
    // Extract brand from user agent
    if (ua.includes('samsung')) {
      brand = 'Samsung';
      // Extract model - look for Galaxy models
      const galaxyMatch = ua.match(/galaxy\s+([a-z0-9]+)/i);
      if (galaxyMatch) {
        model = `Galaxy ${galaxyMatch[1]}`;
      } else {
        // Look for other Samsung models
        const samsungMatch = ua.match(/sm-([a-z0-9]+)/i) || ua.match(/gt-([a-z0-9]+)/i);
        if (samsungMatch) {
          model = `Samsung ${samsungMatch[1]}`;
        }
      }
    } else if (ua.includes('huawei')) {
      brand = 'Huawei';
      const huaweiMatch = ua.match(/(p\d+|mate\s+\d+|nova\s+\d+|y\d+)/i);
      if (huaweiMatch) {
        model = huaweiMatch[1];
      }
    } else if (ua.includes('xiaomi')) {
      brand = 'Xiaomi';
      const xiaomiMatch = ua.match(/(redmi\s+\d+|mi\s+\d+|poco\s+\d+)/i);
      if (xiaomiMatch) {
        model = xiaomiMatch[1];
      }
    } else if (ua.includes('oneplus')) {
      brand = 'OnePlus';
      const oneplusMatch = ua.match(/(\d+)/);
      if (oneplusMatch) {
        model = `OnePlus ${oneplusMatch[1]}`;
      }
    } else if (ua.includes('oppo')) {
      brand = 'OPPO';
      const oppoMatch = ua.match(/(find\s+x\d+|reno\s+\d+|a\d+)/i);
      if (oppoMatch) {
        model = oppoMatch[1];
      }
    } else if (ua.includes('vivo')) {
      brand = 'vivo';
      const vivoMatch = ua.match(/(x\d+|y\d+|v\d+)/i);
      if (vivoMatch) {
        model = vivoMatch[1];
      }
    } else if (ua.includes('realme')) {
      brand = 'Realme';
      const realmeMatch = ua.match(/(\d+)/);
      if (realmeMatch) {
        model = `Realme ${realmeMatch[1]}`;
      }
    } else if (ua.includes('motorola')) {
      brand = 'Motorola';
      const motoMatch = ua.match(/(moto\s+\w+|edge\s+\w+|g\s+\w+)/i);
      if (motoMatch) {
        model = motoMatch[1];
      }
    } else if (ua.includes('lg')) {
      brand = 'LG';
      const lgMatch = ua.match(/(g\d+|v\d+|k\d+)/i);
      if (lgMatch) {
        model = lgMatch[1];
      }
    } else if (ua.includes('sony')) {
      brand = 'Sony';
      const sonyMatch = ua.match(/(xperia\s+\w+)/i);
      if (sonyMatch) {
        model = sonyMatch[1];
      }
    } else if (ua.includes('nokia')) {
      brand = 'Nokia';
      const nokiaMatch = ua.match(/(\d+)/);
      if (nokiaMatch) {
        model = `Nokia ${nokiaMatch[1]}`;
      }
    } else if (ua.includes('google')) {
      brand = 'Google';
      const googleMatch = ua.match(/(pixel\s+\d+)/i);
      if (googleMatch) {
        model = googleMatch[1];
      }
    } else {
      // Generic Android device
      brand = 'Android Device';
      // Try to extract any model info
      const genericMatch = ua.match(/android\s+\d+[\.\d]*;\s*([^;]+)/);
      if (genericMatch) {
        model = genericMatch[1].trim();
      }
    }
  }
  
  // iOS devices
  else if (ua.includes('iphone')) {
    brand = 'Apple';
    const iphoneMatch = ua.match(/iphone\s+os\s+(\d+)/i);
    if (iphoneMatch) {
      const version = parseInt(iphoneMatch[1]);
      if (version >= 17) model = 'iPhone 15 Pro';
      else if (version >= 16) model = 'iPhone 14 Pro';
      else if (version >= 15) model = 'iPhone 13 Pro';
      else if (version >= 14) model = 'iPhone 12 Pro';
      else if (version >= 13) model = 'iPhone 11 Pro';
      else model = 'iPhone';
    } else {
      model = 'iPhone';
    }
  } else if (ua.includes('ipad')) {
    brand = 'Apple';
    model = 'iPad';
  }
  
  // Windows Phone
  else if (ua.includes('windows phone')) {
    brand = 'Windows Phone';
    const wpMatch = ua.match(/windows\s+phone\s+(\d+)/i);
    if (wpMatch) {
      model = `Windows Phone ${wpMatch[1]}`;
    }
  }
  
  // BlackBerry
  else if (ua.includes('blackberry')) {
    brand = 'BlackBerry';
    model = 'BlackBerry';
  }
  
  return {
    brand,
    model,
    userAgent: userAgent.substring(0, 200),
    detectedBy: "user-agent-parsing"
  };
}

/**
 * Get mobile device information using NeutrinoAPI
 */
async function getNeutrinoMobileInfo(userAgent: string, clientIP: string, userId: string, apiKey: string) {
  try {
    console.log("🔍 Starting NeutrinoAPI mobile device detection...");
    const baseInfo = getBasicMobileInfo(userAgent);
    console.log("📱 Base Mobile Info:", baseInfo);
    
    // If not mobile, return basic info
    if (!baseInfo.isMobile) {
      console.log("📱 Device is not mobile - returning basic info only");
      return baseInfo;
    }

    // Get Device Info using the correct NeutrinoAPI endpoint
    let deviceInfo = null;
    try {
      console.log("🌐 Calling NeutrinoAPI UA Lookup API...");
      console.log("📡 API Endpoint: https://neutrinoapi.net/ua-lookup");
      console.log("🔑 Using User ID:", userId);
      console.log("📱 User Agent:", userAgent.substring(0, 100) + "...");
      
      // Use the correct ua-lookup endpoint
      const uaResponse = await fetch("https://neutrinoapi.net/ua-lookup", {
        method: "POST",
        headers: {
          "User-ID": userId,
          "API-Key": apiKey,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          "ua": userAgent, // Changed from "user-agent" to "ua" to fix MISSING OR INVALID PARAMETER error
        }),
      });

      console.log("📡 UA Lookup API Response Status:", uaResponse.status);
      console.log("📡 UA Lookup API Response Headers:", Object.fromEntries(uaResponse.headers.entries()));
      
      if (uaResponse.ok) {
        deviceInfo = await uaResponse.json();
        console.log("✅ UA Lookup API Success!");
        console.log("📊 UA Lookup Data:", deviceInfo);
      } else {
        const errorText = await uaResponse.text();
        console.warn("❌ UA Lookup API failed with status:", uaResponse.status);
        console.warn("❌ Error response:", errorText);
        
        try {
          const errorData = JSON.parse(errorText);
          console.warn("❌ Parsed error data:", errorData);
        } catch (parseError) {
          console.warn("❌ Could not parse error response as JSON");
        }
      }
    } catch (error) {
      console.warn("❌ UA Lookup API error:", error);
    }

    // Extract device info from user agent as fallback
    let enhancedDeviceInfo = null;
    if (!deviceInfo) {
      console.log("🔍 APIs failed, extracting device info from user agent...");
      enhancedDeviceInfo = extractDeviceInfoFromUserAgent(userAgent);
      console.log("📱 Extracted device info from user agent:", enhancedDeviceInfo);
    }

    const enhancedInfo = {
      ...baseInfo,
      deviceBrand: deviceInfo?.brand || deviceInfo?.manufacturer || deviceInfo?.["device-brand"] || enhancedDeviceInfo?.brand || "Unknown",
      deviceModel: deviceInfo?.model || deviceInfo?.["device-model"] || enhancedDeviceInfo?.model || "Unknown",
      detectedBy: deviceInfo ? "neutrinoapi-ua-lookup" : "user-agent-parsing",
      userAgentData: deviceInfo || enhancedDeviceInfo,
    };

    console.log("🎯 Enhanced Mobile Info:", enhancedInfo);
    return enhancedInfo;

  } catch (error) {
    console.error("❌ Error in getNeutrinoMobileInfo:", error);
    return getBasicMobileInfo(userAgent);
  }
}

/**
 * Get detailed mobile information using phone number (HLR Lookup)
 */
async function getDetailedMobileInfo(phoneNumber: string, userAgent: string, userId: string, apiKey: string) {
  try {
    const baseInfo = getBasicMobileInfo(userAgent);
    
    // Get HLR Lookup information
    let hlrInfo = null;
    try {
      const hlrResponse = await fetch("https://neutrinoapi.net/hlr-lookup", {
        method: "POST",
        headers: {
          "User-ID": userId,
          "API-Key": apiKey,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          number: phoneNumber,
        }),
      });

      if (hlrResponse.ok) {
        hlrInfo = await hlrResponse.json();
      } else {
        const errorText = await hlrResponse.text();
        console.warn("⚠️  HLR Lookup API failed with status:", hlrResponse.status);
        console.warn("📄 Error Response:", errorText);
        
        // Try to parse error response for more details
        try {
          const errorData = JSON.parse(errorText);
          console.warn("📄 Parsed Error Data:", errorData);
        } catch (e) {
          console.warn("📄 Raw Error Response:", errorText);
        }
      }
    } catch (error) {
      console.warn("❌ HLR Lookup API error:", error);
    }

    // Get Device Info using the correct NeutrinoAPI endpoint
    let deviceInfo = null;
    try {
      // Use the correct ua-lookup endpoint
      const uaResponse = await fetch("https://neutrinoapi.net/ua-lookup", {
        method: "POST",
        headers: {
          "User-ID": userId,
          "API-Key": apiKey,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          "ua": userAgent,
        }),
      });

      if (uaResponse.ok) {
        deviceInfo = await uaResponse.json();
      } else {
        const errorText = await uaResponse.text();
        console.warn("⚠️  UA Lookup API failed with status:", uaResponse.status);
        console.warn("📄 Error Response:", errorText);
        
        // Try to parse error response for more details
        try {
          const errorData = JSON.parse(errorText);
          console.warn("📄 Parsed Error Data:", errorData);
        } catch (e) {
          console.warn("📄 Raw Error Response:", errorText);
        }
      }
    } catch (error) {
      console.warn("❌ UA Lookup API error:", error);
    }

    // Enhanced device detection from user agent if APIs fail
    let enhancedDeviceInfo = null;
    if (!deviceInfo) {
      enhancedDeviceInfo = extractDeviceInfoFromUserAgent(userAgent);
    }

    // Combine all information with proper fallbacks
    const detailedInfo = {
      ...baseInfo,
      phoneNumber,
      carrier: hlrInfo?.carrier || hlrInfo?.["carrier-name"] || null,
      network: hlrInfo?.network || hlrInfo?.["network-name"] || null,
      status: hlrInfo?.status || hlrInfo?.["device-status"] || null,
      deviceBrand: deviceInfo?.brand || deviceInfo?.["device-brand"] || deviceInfo?.manufacturer || enhancedDeviceInfo?.brand || null,
      deviceModel: deviceInfo?.model || deviceInfo?.["device-model"] || deviceInfo?.device || enhancedDeviceInfo?.model || null,
      detectedBy: "neutrinoapi-hlr-ua-lookup",
      hlrData: hlrInfo,
      userAgentData: deviceInfo || enhancedDeviceInfo,
    };

    return detailedInfo;

  } catch (error) {
    console.warn("❌ Detailed mobile info failed:", error);
    return getBasicMobileInfo(userAgent);
  }
} 