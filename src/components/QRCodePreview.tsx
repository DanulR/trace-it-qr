
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
                border: `8px solid ${style.borderColor || '#8B0000'}`,
                borderRadius: style.eyeRadius[0] > 0
                    ? (style.labelText ? '30px 30px 0 0' : '30px')
                    : (style.labelText ? '0' : '0'),
                borderBottom: style.labelText ? 'none' : `8px solid ${style.borderColor || '#8B0000'}`,
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
                    eyeRadius={style.eyeRadius}
                    ecLevel="H"
                    quietZone={0}
                    id={id}
                />
            </div>

            {style.labelText && (
                <div style={{
                    backgroundColor: style.borderColor || '#8B0000',
                    color: 'white',
                    padding: `${size * 0.03}px 0`,
                    borderRadius: style.eyeRadius[0] > 0 ? '0 0 30px 30px' : '0',
                    fontWeight: 'bold',
                    fontSize: `${(size + 46) * 0.22}px`,
                    fontFamily: 'sans-serif',
                    textAlign: 'center' as const,
                    alignSelf: 'stretch',
                    letterSpacing: '2px'
                }}>
                    {style.labelText}
                </div>
            )}
        </div>
    );
};
