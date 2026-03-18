
import React from 'react';
import { QRCode } from 'react-qrcode-logo';

export type QRStyle = {
    fgColor: string;
    bgColor: string;
    logoImage: string;
    eyeRadius: [number, number, number, number]; // [top-left, top-right, bottom-right, bottom-left]
    labelText: string;
    borderColor?: string;
};

interface QRCodePreviewProps {
    value: string;
    style: QRStyle;
    size?: number;
    id?: string;
}

export const QRCodePreview: React.FC<QRCodePreviewProps> = ({ value, style, size = 250, id = 'qr-preview' }) => {
    // Automatically convert the old maroon to the newer darker maroon, or use the exact configured color
    const brandColor = style.borderColor === '#8B0000' || !style.borderColor ? '#600000' : style.borderColor;

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '20px',
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            width: 'fit-content'
        }}>
            {/* Wrapper for Border */}
            <div style={{
                border: `8px solid ${brandColor}`,
                borderRadius: style.eyeRadius[0] > 0 ? '30px' : '0',
                padding: '15px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
            }}>
                <QRCode
                    value={value}
                    size={size}
                    fgColor={style.fgColor}
                    bgColor={style.bgColor}
                    logoImage={style.logoImage}
                    logoWidth={size * 0.22}
                    logoHeight={size * 0.22}
                    eyeRadius={style.eyeRadius}
                    eyeColor={brandColor}
                    removeQrCodeBehindLogo={true}
                    logoPadding={0}
                    qrStyle="squares"
                    ecLevel="H"
                    quietZone={0}
                    id={id}
                />
            </div>

            {style.labelText && (
                <div style={{
                    backgroundColor: brandColor,
                    color: 'white',
                    padding: `${size * 0.04}px 0`,
                    borderRadius: '0 0 20px 20px',
                    fontWeight: 'bold',
                    fontSize: `${size * 0.22}px`,
                    fontFamily: 'sans-serif',
                    textAlign: 'center' as const,
                    alignSelf: 'stretch',
                    marginTop: `${size * 0.02}px`,
                    letterSpacing: '1px'
                }}>
                    {style.labelText}
                </div>
            )}
        </div>
    );
};
