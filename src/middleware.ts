import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    // 1. Refresh Supabase Session
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        request.cookies.set(name, value)
                    )
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // Refreshing the auth token
    const {
        data: { user },
    } = await supabase.auth.getUser()

    // 2. Subdomain Handling
    const url = request.nextUrl
    const hostname = request.headers.get("host") || "";
    const searchParams = request.nextUrl.searchParams.toString();

    // Clean hostname (remove port)
    const domain = hostname.split(':')[0];

    // Define root domains (localhost, vercel.app, or your custom domain)
    // In production, this should be env var. For now assuming 'trace-it.io' or generic.
    // We can detect if it's a subdomain by checking part count or env var.

    const isLocalhost = domain.includes("localhost");
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'trace-it.io';

    // If we are on a custom subdomain (e.g. user.trace-it.io)
    // We rewrite to a dynamic route like /_sites/[subdomain]
    // BUT: The user asked for "different subdomains for each user".
    // This usually implies serving content (redirection logic) or a branded dashboard.
    // Assuming for now it's for REDIRECTION/LINK handling.

    // If the user wants a branded DASHBOARD on their subdomain, we need to rewrite dashboard routes.
    // For now, let's just secure the /dashboard route for main domain.

    if (request.nextUrl.pathname.startsWith('/dashboard') && !user) {
        const loginUrl = request.nextUrl.clone()
        loginUrl.pathname = '/login'
        return NextResponse.redirect(loginUrl)
    }

    return supabaseResponse
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
