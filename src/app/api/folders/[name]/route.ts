import { NextResponse } from 'next/server';
import { deleteFolder } from '@/lib/db';

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ name: string }> }
) {
    try {
        const { name } = await params;
        const decodedName = decodeURIComponent(name);

        await deleteFolder(decodedName);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
