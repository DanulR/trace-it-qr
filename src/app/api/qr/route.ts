import { NextResponse } from 'next/server';
import { createQRCode, getAllQRCodes, initDB } from '@/lib/db';
import { nanoid } from 'nanoid';
import crypto from 'crypto';

export async function POST(request: Request) {
    try {
        console.log('[API] Starting POST /api/qr');
        await initDB(); // Ensure DB is ready
        console.log('[API] DB initialized');

        const body = await request.json();
        console.log('[API] Request body parsed:', JSON.stringify(body));

        const {
            type,
            title,
            destination_url,
            landing_content,
            folder,
            custom_domain,
            organization,
            content_category,
            style
        } = body;

        if (!title) {
            return NextResponse.json({ error: 'Title is required' }, { status: 400 });
        }

        const id = nanoid(6);
        console.log('[API] Generated ID:', id);

        // Generate a mock verification hash for "Verified Content"
        let verification_hash = undefined;
        if (type === 'verified_content') {
            verification_hash = crypto.createHash('sha256').update(id + title + new Date().toISOString()).digest('hex').substring(0, 16);
        }

        console.log('[API] About to call createQRCode with:', { id, type, title });

        await createQRCode({
            id,
            type: type || 'link',
            title,
            destination_url,
            landing_content: landing_content ? JSON.stringify(landing_content) : undefined,
            folder: folder || 'General',
            custom_domain,
            organization,
            content_category,
            verification_hash,
            style: style ? JSON.stringify(style) : undefined
        });

        console.log('[API] QR Code created successfully');

        const host = request.headers.get('host') || 'localhost:3000';
        const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';

        // If custom domain is provided, we might want to return that instead
        // For now, we'll just return the standard URL but the frontend can display the "intended" domain
        const shortUrl = `${protocol}://${host}/${id}`;

        return NextResponse.json({ id, shortUrl, verification_hash });
    } catch (error: any) {
        console.error('Create QR error:', error);
        return NextResponse.json({ error: 'Failed to create QR code', details: error.message }, { status: 500 });
    }
}

export async function GET() {
    try {
        await initDB();
        const qrCodes = await getAllQRCodes();
        return NextResponse.json(qrCodes);
    } catch (error) {
        console.error('Fetch QR error:', error);
        return NextResponse.json({ error: 'Failed to fetch QR codes' }, { status: 500 });
    }
}
