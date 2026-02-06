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
        // Handle unique constraint (Postgres 23505 or Supabase error details)
        if (
            error.message?.includes('violates unique constraint') ||
            error.code === '23505' ||
            error.message?.includes('duplicate key value')
        ) {
            return NextResponse.json({ error: 'Folder already exists' }, { status: 409 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
