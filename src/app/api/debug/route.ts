import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({
        hasUrl: !!process.env.TURSO_DATABASE_URL,
        hasToken: !!process.env.TURSO_AUTH_TOKEN,
        urlLength: process.env.TURSO_DATABASE_URL?.length || 0,
        tokenLength: process.env.TURSO_AUTH_TOKEN?.length || 0,
        nodeEnv: process.env.NODE_ENV,
        // Show first/last few chars to verify without exposing full values
        urlPreview: process.env.TURSO_DATABASE_URL?.slice(0, 20) + '...' || 'missing',
    });
}
