# IP Detection Setup Guide

## Overview
This system uses a hybrid approach to detect user IP addresses and get geolocation data:

1. **Server-side IP detection** from request headers
2. **NeutrinoAPI** for geolocation enhancement
3. **External IP services** as fallback
4. **WebRTC** for local network topology

## Environment Variables Required

Create a `.env.local` file in your project root with:

```bash
# NeutrinoAPI Configuration
# Get these from https://www.neutrinoapi.com/
NEXT_PUBLIC_NEUTRINO_USER_ID=your_user_id_here
NEXT_PUBLIC_NEUTRINO_API_KEY=your_api_key_here
```

## How It Works

### 1. Server-side IP Detection (`/api/detect-ip`)
- Extracts IP from various headers: `x-forwarded-for`, `x-real-ip`, `cf-connecting-ip`
- Most reliable method when behind a proxy/load balancer
- Returns IP and source information

### 2. NeutrinoAPI Integration (`/api/geolocation`)
- Calls NeutrinoAPI with detected IP
- Returns comprehensive geolocation data
- Falls back gracefully if API fails

### 3. Hybrid IP Detector (`utils/hybrid-ip-detector.ts`)
- Orchestrates all detection methods
- Implements fallback strategy
- Caches results for performance

### 4. External IP Services Fallback
- Uses multiple external services if all else fails
- Services: ipify.org, myip.com, ipapi.co
- Ensures IP detection even in edge cases

## Testing

Visit `/test/ip-detection` to test the system:
- Test hybrid IP detection
- Test direct API calls
- View detailed console logs

## Troubleshooting

### IP Not Detected
1. Check if you're behind a corporate firewall/proxy
2. Verify environment variables are set
3. Check browser console for errors
4. Ensure server is running on correct port

### NeutrinoAPI Not Working
1. Verify API credentials in `.env.local`
2. Check API quota/limits
3. Verify network connectivity
4. Check console for API errors

### Local Development
- Server-side detection may not work on localhost
- Use external IP services for local testing
- Check if your router provides public IP

## API Endpoints

- `GET /api/detect-ip` - Server-side IP detection
- `GET /api/geolocation` - Get geolocation for current IP
- `POST /api/geolocation` - Get geolocation for specific IP

## Expected Output

```json
{
  "publicIP": "203.0.113.1",
  "localIPs": ["192.168.1.100"],
  "geolocation": {
    "city": "New York",
    "country": "United States",
    "coordinates": "40.7128,-74.0060"
  },
  "source": "neutrinoapi",
  "confidence": 80
}
```

## Security Notes

- IP addresses are logged for debugging
- Consider removing logs in production
- Environment variables are client-accessible (NEXT_PUBLIC_)
- Use server-side only variables for production security 