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
                if (!e.message?.includes('UNIQUE')) {
                    throw e;
                }
            }
        }

        // 2. Create QR Codes
        const createdIds = [];
        const timestamp = new Date().toLocaleString();

        // We'll run these sequentially to avoid overwhelming SQLite/Turso with parallel requests if count is high
        for (let i = 0; i < count; i++) {
            const id = nanoid(6);
            const title = `Bulk QR ${timestamp} #${i + 1}`;

            await createQRCode({
                id,
                type: 'link', // Default type
                title: title,
                destination_url: '', // Empty initially? Or should we ask? User said "number of qr codes and the folder name only"
                folder: folderName,
                style: JSON.stringify({
                    fgColor: '#000000',
                    bgColor: '#ffffff',
                    logoImage: '/logo.png',
                    eyeRadius: [0, 0, 0, 0],
                    labelText: 'Trace-it'
                })
            });
            createdIds.push(id);
        }

        return NextResponse.json({ success: true, count: createdIds.length, folder: folderName });

    } catch (error: any) {
        console.error('Bulk Create Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
