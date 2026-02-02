import { NextResponse } from 'next/server';
import { updateQRCode, initDB } from '@/lib/db';

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await initDB();
        const { id } = await params;
        const body = await request.json();
        const { title, destination_url } = body;

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        await updateQRCode(id, { title, destination_url });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Update QR Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
