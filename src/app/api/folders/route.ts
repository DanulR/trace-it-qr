import { NextResponse } from 'next/server';
import { getFolders, createFolder } from '@/lib/db';

export async function GET() {
    try {
        const folders = await getFolders();
        return NextResponse.json(folders);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { name } = await request.json();

        if (!name || name.trim() === '') {
            return NextResponse.json({ error: 'Folder name is required' }, { status: 400 });
        }

        await createFolder(name.trim());
        return NextResponse.json({ success: true });
    } catch (error: any) {
        // Handle unique constraint
        if (error.message.includes('UNIQUE constraint') || error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            return NextResponse.json({ error: 'Folder already exists' }, { status: 409 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
