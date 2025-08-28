import { NextResponse } from "next/server"

export async function GET() {
  try {
    const userId = process.env.NEXT_PUBLIC_NEUTRINO_USER_ID;
    const apiKey = process.env.NEXT_PUBLIC_NEUTRINO_API_KEY;
    
    const envStatus = {
      hasUserId: !!userId,
      hasApiKey: !!apiKey,
      userIdLength: userId?.length || 0,
      apiKeyLength: apiKey?.length || 0,
      userIdPreview: userId ? `${userId.substring(0, 4)}...${userId.substring(userId.length - 4)}` : "NOT_SET",
      apiKeyPreview: apiKey ? `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}` : "NOT_SET",
      timestamp: new Date().toISOString(),
    };

    console.log("Environment variables check:", envStatus);

    return NextResponse.json({
      status: "success",
      environment: envStatus,
      message: userId && apiKey ? "NeutrinoAPI credentials are configured" : "NeutrinoAPI credentials are missing"
    });
  } catch (error) {
    console.error("Environment check failed:", error);
    return NextResponse.json({ 
      status: "error", 
      error: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
} 