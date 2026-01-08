import { NextResponse } from 'next/server';
import { incrementScan } from '@/lib/db';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await incrementScan(id);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Scan increment error:', error);
        return NextResponse.json({ error: 'Failed to increment scan' }, { status: 500 });
    }
}
