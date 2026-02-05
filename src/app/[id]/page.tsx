import ScanTracker from '@/components/ScanTracker';
import { getQRCode } from '@/lib/db';
import { notFound } from 'next/navigation';
import { Globe, Link as LinkIcon, Mail, Phone, Facebook, Twitter, Instagram, Linkedin, ShieldCheck, CheckCircle } from 'lucide-react';

// Force dynamic rendering since we rely on DB data that changes
export const dynamic = 'force-dynamic';

export default async function PublicQRPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const qrData = await getQRCode(id);

    if (!qrData) {
        notFound();
    }

    // Client-side tracking & redirect
    if (qrData.type === 'link') {
        if (!qrData.destination_url) {
            return (
                <div style={{
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    fontFamily: 'sans-serif',
                    padding: '2rem',
                    textAlign: 'center',
                    color: '#334155',
                    backgroundColor: '#f8fafc'
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        padding: '3rem',
                        borderRadius: '1rem',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        maxWidth: '400px',
                        width: '100%'
                    }}>
                        <div style={{
                            fontSize: '3rem',
                            marginBottom: '1rem'
                        }}>🚧</div>
                        <h1 style={{ marginBottom: '0.5rem', color: '#0f172a' }}>Setup Required</h1>
                        <p style={{ color: '#64748b' }}>
                            This QR code has been created but not yet configured.
                        </p>
                    </div>
                </div>
            );
        }
        return <ScanTracker id={id} type="link" destinationUrl={qrData.destination_url} createdAt={qrData.created_at} />;
    }

    // Handle Verified Content Page
    if (qrData.type === 'verified_content') {
        return (
            <div style={{
                minHeight: '100vh',
                backgroundColor: '#f8fafc',
                color: '#0f172a',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                fontFamily: 'sans-serif'
            }}>
                <ScanTracker id={id} type="verified_content" />
                {/* Verification Header */}
                <div style={{
                    width: '100%',
                    backgroundColor: '#22c55e',
                    color: 'white',
                    padding: '1rem',
                    textAlign: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    fontWeight: 'bold'
                }}>
                    <ShieldCheck size={24} />
                    VERIFIED SOURCE
                </div>

                <div style={{
                    maxWidth: '600px',
                    width: '100%',
                    padding: '2rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2rem'
                }}>
                    {/* Organization Card */}
                    <div style={{
                        backgroundColor: 'white',
                        padding: '2rem',
                        borderRadius: '1rem',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        textAlign: 'center'
                    }}>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            backgroundColor: '#e2e8f0',
                            borderRadius: '50%',
                            margin: '0 auto 1rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '2rem',
                            fontWeight: 'bold',
                            color: '#64748b'
                        }}>
                            {qrData.organization?.charAt(0) || 'O'}
                        </div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                            {qrData.organization}
                        </h1>
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            backgroundColor: '#dcfce7',
                            color: '#166534',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '1rem',
                            fontSize: '0.875rem',
                            fontWeight: '600'
                        }}>
                            <CheckCircle size={14} /> Verified Entity
                        </div>

                        {qrData.custom_domain && (
                            <p style={{ marginTop: '1rem', color: '#64748b', fontSize: '0.9rem' }}>
                                Source Domain: <strong>{qrData.custom_domain}.trace-it.io</strong>
                            </p>
                        )}
                    </div>

                    {/* Content Info */}
                    <div style={{
                        backgroundColor: 'white',
                        padding: '2rem',
                        borderRadius: '1rem',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', color: '#334155' }}>
                            Content Details
                        </h2>

                        <div style={{ display: 'grid', gap: '1rem' }}>
                            <div>
                                <label style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Category</label>
                                <p style={{ fontWeight: '500' }}>{qrData.content_category}</p>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Published Date</label>
                                <p style={{ fontWeight: '500' }}>{new Date(qrData.created_at).toLocaleDateString()}</p>
                            </div>

                        </div>

                        <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid #e2e8f0', width: '100%' }}>
                            {(() => {
                                let urls: string[] = [];
                                if (qrData.destination_url) {
                                    try {
                                        const parsed = JSON.parse(qrData.destination_url);
                                        if (Array.isArray(parsed)) {
                                            urls = parsed;
                                        } else {
                                            urls = [qrData.destination_url];
                                        }
                                    } catch (e) {
                                        urls = [qrData.destination_url];
                                    }
                                }

                                return urls.map((url, index) => (
                                    <a
                                        key={index}
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                            display: 'block',
                                            width: '100%',
                                            backgroundColor: '#0f172a',
                                            color: 'white',
                                            textAlign: 'center',
                                            padding: '1rem',
                                            borderRadius: '0.5rem',
                                            textDecoration: 'none',
                                            fontWeight: '600',
                                            marginBottom: '0.5rem'
                                        }}
                                    >
                                        {urls.length > 1 ? `View Original Content ${index + 1}` : 'View Original Content'}
                                    </a>
                                ));
                            })()}

                            <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.8rem', color: '#64748b' }}>
                                You will be redirected to the external source.
                            </p>
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: 'auto', padding: '2rem', color: '#94a3b8', fontSize: '0.8rem' }}>
                    Powered by Trace-it Verification System
                </div>
            </div>
        );
    }

    // Handle Landing Page
    if (qrData.type === 'landing' && qrData.landing_content) {
        const content = JSON.parse(qrData.landing_content);

        return (
            <div style={{
                minHeight: '100vh',
                backgroundColor: content.theme?.background || '#ffffff',
                color: content.theme?.text || '#000000',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '2rem',
                fontFamily: 'sans-serif'
            }}>
                <ScanTracker id={id} type="landing" />
                {/* Header / Profile */}
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    {content.image && (
                        <img
                            src={content.image}
                            alt="Profile"
                            style={{
                                width: '100px',
                                height: '100px',
                                borderRadius: '50%',
                                objectFit: 'cover',
                                marginBottom: '1rem',
                                border: `3px solid ${content.theme?.primary || '#000'}`
                            }}
                        />
                    )}
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                        {content.title}
                    </h1>
                    <p style={{ opacity: 0.8 }}>{content.description}</p>
                </div>

                {/* Links List */}
                <div style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {content.links?.map((link: any, index: number) => (
                        <a
                            key={index}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '1rem',
                                backgroundColor: content.theme?.buttonBg || '#f3f4f6',
                                color: content.theme?.buttonText || '#000000',
                                borderRadius: '0.5rem',
                                textDecoration: 'none',
                                transition: 'transform 0.2s',
                                border: '1px solid rgba(0,0,0,0.05)'
                            }}
                        >
                            <div style={{ marginRight: '1rem' }}>
                                {getIcon(link.icon)}
                            </div>
                            <span style={{ fontWeight: '500' }}>{link.title}</span>
                        </a>
                    ))}
                </div>

                {/* Footer */}
                <div style={{ marginTop: '3rem', fontSize: '0.8rem', opacity: 0.5 }}>
                    Powered by Trace-it
                </div>
            </div>
        );
    }

    return <div>Invalid QR Code Type</div>;
}

function getIcon(name: string) {
    const props = { size: 20 };
    switch (name) {
        case 'globe': return <Globe {...props} />;
        case 'mail': return <Mail {...props} />;
        case 'phone': return <Phone {...props} />;
        case 'facebook': return <Facebook {...props} />;
        case 'twitter': return <Twitter {...props} />;
        case 'instagram': return <Instagram {...props} />;
        case 'linkedin': return <Linkedin {...props} />;
        default: return <LinkIcon {...props} />;
    }
}
