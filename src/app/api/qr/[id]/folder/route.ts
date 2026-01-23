import { NextResponse } from 'next/server';
import { updateQRFolder } from '@/lib/db';

export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { folder } = await request.json();
        const qrId = params.id;

        if (!folder) {
            return NextResponse.json({ error: 'Folder name is required' }, { status: 400 });
        }

        await updateQRFolder(qrId, folder);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
