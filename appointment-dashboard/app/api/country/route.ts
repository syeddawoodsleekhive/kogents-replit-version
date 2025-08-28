import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const geoRes = await fetch('https://ipinfo.io/json?token=58aebde1f600a3');
    const data = await geoRes.json();
    return NextResponse.json({ country: data.country || '' });
  } catch {
    return NextResponse.json({ country: '' });
  }
} 