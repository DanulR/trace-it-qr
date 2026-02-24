import { NextResponse } from 'next/server';
import { createQRCode, initDB, createFolder, getFolders } from '@/lib/db';
import { nanoid } from 'nanoid';

export async function POST(request: Request) {
    try {
        await initDB();
        const { count, folder } = await request.json();

        if (!count || count < 1) {
            return NextResponse.json({ error: 'Valid count is required' }, { status: 400 });
        }

        if (!folder || folder.trim() === '') {
            return NextResponse.json({ error: 'Folder name is required' }, { status: 400 });
        }

        const folderName = folder.trim();

        // 1. Ensure Folder Exists
        // slightly inefficient to fetch all, but safe for now given existing db.ts structure
        const existingFolders = await getFolders();
        const folderExists = existingFolders.some((f: any) => f.name === folderName);

        if (!folderExists && folderName !== 'General') {
            try {
                await createFolder(folderName);
            } catch (e: any) {
                // Ignore if unique constraint fails (race condition)
                // Postgres: code 23505 or message includes "violates unique constraint"
                if (
                    !e.message?.includes('UNIQUE') &&
                    !e.message?.includes('violates unique constraint') &&
                    e.code !== '23505'
                ) {
                    throw e;
                }
            }
        }

        // 2. Create QR Codes
        const createdIds = [];
        const timestamp = new Date().toLocaleString();

        // Fetch user metadata to enforce locked styles
        let baseStyle = {
            fgColor: '#000000',
            bgColor: '#ffffff',
            logoImage: '/logo.png',
            eyeRadius: [0, 0, 0, 0],
            labelText: 'Trace-it',
            borderColor: '#8b0000'
        };

        try {
            const { createClient } = await import('@/lib/supabase/server');
            const supabase = await createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (user && user.user_metadata?.style) {
                const userStyle = user.user_metadata.style;
                const loadedStyle = { ...userStyle };

                if (userStyle.cornerStyle === 'rounded') {
                    loadedStyle.eyeRadius = [10, 10, 10, 10];
                } else if (userStyle.cornerStyle === 'square') {
                    loadedStyle.eyeRadius = [0, 0, 0, 0];
                }

                baseStyle = { ...baseStyle, ...loadedStyle };
            }
        } catch (e) {
            console.error('[API] Failed to fetch user metadata for bulk style enforcement', e);
        }

        // We'll run these sequentially to avoid overwhelming SQLite/Turso with parallel requests if count is high
        for (let i = 0; i < count; i++) {
            const id = nanoid(6);
            const title = `Bulk QR ${timestamp} #${i + 1}`;

            await createQRCode({
                id,
                type: 'link', // Default type
                title: title,
                destination_url: '',
                folder: folderName,
                style: JSON.stringify(baseStyle)
            });
            createdIds.push(id);
        }

        return NextResponse.json({ success: true, count: createdIds.length, folder: folderName });

    } catch (error: any) {
        console.error('Bulk Create Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
