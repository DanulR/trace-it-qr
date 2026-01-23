import { NextResponse } from 'next/server';
import { deleteFolder } from '@/lib/db';

export async function DELETE(
    request: Request,
    { params }: { params: { name: string } }
) {
    try {
        // Next.js 13+ app dir, params must be awaited in some versions but generally passed as prop to route handler functions? 
        // Actually in Next.js 15 params is a promise, but in 14 it's an object. 
        // Based on the file viewing earlier, this looks like standard App Router.
        // decoding URI component just in case
        const name = decodeURIComponent(params.name);

        await deleteFolder(name);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
