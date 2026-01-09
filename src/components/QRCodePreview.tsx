import React from 'react';
import { QRCode } from 'react-qrcode-logo';

export type QRStyle = {
    fgColor: string;
    bgColor: string;
    logoImage: string;
    eyeRadius: [number, number, number, number]; // [top-left, top-right, bottom-right, bottom-left]
    labelText: string;
};

interface QRCodePreviewProps {
    value: string;
    style: QRStyle;
    size?: number;
    id?: string;
}

export const QRCodePreview: React.FC<QRCodePreviewProps> = ({ value, style, size = 250, id = 'qr-preview' }) => {
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
                border: style.labelText ? '8px solid #8B0000' : 'none',
                borderRadius: '30px',
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
                    logoWidth={size * 0.2}
                    logoHeight={size * 0.2}
                    eyeRadius={style.eyeRadius}
                    removeQrCodeBehindLogo={true}
                    logoPadding={5}
                    ecLevel="H" // High error correction for logos
                    quietZone={0} // We handle padding with the border wrapper
                    id={id}
                />
            </div>

            {style.labelText && (
                <div style={{
                    marginTop: '20px',
                    backgroundColor: '#8B0000', // Default brand color
                    color: 'white',
                    padding: '12px 32px',
                    borderRadius: '24px',
                    fontWeight: 'bold',
                    fontSize: '24px',
                    fontFamily: 'sans-serif',
                    position: 'relative',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}>
                    {/* Connector */}
                    <div style={{
                        content: '""',
                        position: 'absolute',
                        top: '-16px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '0',
                        height: '0',
                        borderLeft: '20px solid transparent', // Wider base
                        borderRight: '20px solid transparent',
                        borderBottom: '20px solid #8B0000',
                    }}></div>
                    {style.labelText}
                </div>
            )}
        </div>
    );
};
