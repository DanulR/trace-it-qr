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
                    cookiesToSet.forEach(({ name, value, options }) => {
                        // Ensure cookies are shared across all trace-it.io subdomains
                        const domainOption = process.env.NODE_ENV === 'production' ? { domain: '.trace-it.io' } : {};
                        request.cookies.set(name, value)
                    })
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) => {
                        const domainOption = process.env.NODE_ENV === 'production' ? { domain: '.trace-it.io' } : {};
                        supabaseResponse.cookies.set(name, value, { ...options, ...domainOption })
                    })
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

    // Clean hostname (remove port)
    const domain = hostname.split(':')[0];
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'trace-it.io';
    const isLocalhost = domain.includes("localhost");

    if (!isLocalhost && url.pathname.startsWith('/dashboard')) {
        if (!user) {
            // Unauthenticated users trying to access ANY dashboard get sent to login
            const loginUrl = request.nextUrl.clone()
            loginUrl.hostname = `qr.${rootDomain}`
            loginUrl.pathname = '/login'
            return NextResponse.redirect(loginUrl)
        }

        const userSubdomain = user.user_metadata?.subdomain;

        // If they are on the main qr.trace-it.io and try to go to dashboard, redirect to their subdomain
        if (domain === `qr.${rootDomain}`) {
            if (userSubdomain) {
                const newUrl = request.nextUrl.clone()
                newUrl.hostname = `${userSubdomain}.${rootDomain}`
                return NextResponse.redirect(newUrl)
            } else {
                // User has no subdomain assigned yet. They can't access dashboard.
                // You could redirect them to an error page or a setup page.
                // For now, let's keep them on qr.trace-it.io but maybe redirect to a generic page or home
            }
        }
        // If they are on a specific subdomain (e.g. acmeco.trace-it.io)
        else if (domain.endsWith(`.${rootDomain}`) && domain !== `qr.${rootDomain}` && domain !== `www.${rootDomain}`) {
            const currentSubdomain = domain.replace(`.${rootDomain}`, '');

            // Check if this subdomain matches their assigned subdomain
            if (currentSubdomain !== userSubdomain) {
                // Unauthorized for this subdomain. Send them to their own, or login if none
                if (userSubdomain) {
                    const newUrl = request.nextUrl.clone()
                    newUrl.hostname = `${userSubdomain}.${rootDomain}`
                    return NextResponse.redirect(newUrl)
                } else {
                    const loginUrl = request.nextUrl.clone()
                    loginUrl.hostname = `qr.${rootDomain}`
                    loginUrl.pathname = '/login'
                    return NextResponse.redirect(loginUrl)
                }
            }
        }
    }

    // Protect login/landing (only accessible via qr.trace-it.io or roots)
    if (!isLocalhost && (url.pathname === '/login' || url.pathname === '/')) {
        if (domain !== `qr.${rootDomain}` && domain !== rootDomain && domain !== `www.${rootDomain}`) {
            const newUrl = request.nextUrl.clone()
            newUrl.hostname = `qr.${rootDomain}`
            return NextResponse.redirect(newUrl)
        }
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
