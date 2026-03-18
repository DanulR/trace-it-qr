export interface QRStyle {
    fgColor: string;
    bgColor: string;
    logoImage?: string;
    eyeRadius?: [number, number, number, number];
    labelText?: string;
    borderColor?: string;
}

export function createQRCompositeCanvas(qrCanvas: HTMLCanvasElement, styleObj: QRStyle, padding: number = 100): HTMLCanvasElement {
    const finalCanvas = document.createElement('canvas'); // We shouldn't strictly require document unless run in browser. It runs in browser though.
    const ctx = finalCanvas.getContext('2d');
    if (!ctx) return finalCanvas;

    const labelFontSize = Math.round(qrCanvas.width * 0.16);
    const pillPaddingX = Math.round(qrCanvas.width * 0.12);
    const pillPaddingY = Math.round(qrCanvas.width * 0.02);
    const labelBoxHeight = labelFontSize + (pillPaddingY * 2);
    const brandColor = styleObj.borderColor || '#8B0000';
    const borderPadding = 20;
    const isRounded = styleObj.eyeRadius && styleObj.eyeRadius[0] > 0;
    const borderRadius = isRounded ? 40 : 0;
    const borderThickness = 12;

    const borderH = qrCanvas.height + (borderPadding * 2);
    const labelGap = Math.round(qrCanvas.width * 0.03);
    const totalContentHeight = (padding - borderPadding) + borderH + (borderThickness / 2) + labelGap + labelBoxHeight + 40;

    finalCanvas.width = qrCanvas.width + (padding * 2);
    finalCanvas.height = styleObj.labelText
        ? Math.max(qrCanvas.height + (padding * 2), totalContentHeight)
        : qrCanvas.height + (padding * 2);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
    ctx.drawImage(qrCanvas, padding, padding);

    if (styleObj.labelText) {
        ctx.strokeStyle = brandColor;
        ctx.lineWidth = borderThickness;
        const borderX = padding - borderPadding;
        const borderY = padding - borderPadding;
        const borderW = qrCanvas.width + (borderPadding * 2);

        // Draw full rounded border
        ctx.beginPath();
        ctx.moveTo(borderX + borderRadius, borderY);
        ctx.lineTo(borderX + borderW - borderRadius, borderY);
        ctx.quadraticCurveTo(borderX + borderW, borderY, borderX + borderW, borderY + borderRadius);
        ctx.lineTo(borderX + borderW, borderY + borderH - borderRadius);
        ctx.quadraticCurveTo(borderX + borderW, borderY + borderH, borderX + borderW - borderRadius, borderY + borderH);
        ctx.lineTo(borderX + borderRadius, borderY + borderH);
        ctx.quadraticCurveTo(borderX, borderY + borderH, borderX, borderY + borderH - borderRadius);
        ctx.lineTo(borderX, borderY + borderRadius);
        ctx.quadraticCurveTo(borderX, borderY, borderX + borderRadius, borderY);
        ctx.closePath();
        ctx.stroke();

        // Centered pill-shaped label below border
        const centerX = finalCanvas.width / 2;
        const labelY = borderY + borderH + (borderThickness / 2) + labelGap;

        // Measure text to size the pill
        ctx.font = `bold ${labelFontSize}px sans-serif`;
        const textWidth = ctx.measureText(styleObj.labelText).width;
        const pillW = textWidth + (pillPaddingX * 2);
        const pillH = labelBoxHeight;
        const pillX = centerX - (pillW / 2);
        const pillRadius = pillH / 2; // Full pill shape

        ctx.fillStyle = brandColor;
        ctx.beginPath();
        ctx.moveTo(pillX + pillRadius, labelY);
        ctx.lineTo(pillX + pillW - pillRadius, labelY);
        ctx.quadraticCurveTo(pillX + pillW, labelY, pillX + pillW, labelY + pillRadius);
        ctx.quadraticCurveTo(pillX + pillW, labelY + pillH, pillX + pillW - pillRadius, labelY + pillH);
        ctx.lineTo(pillX + pillRadius, labelY + pillH);
        ctx.quadraticCurveTo(pillX, labelY + pillH, pillX, labelY + pillRadius);
        ctx.quadraticCurveTo(pillX, labelY, pillX + pillRadius, labelY);
        ctx.closePath();
        ctx.fill();

        // Label text
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(styleObj.labelText, centerX, labelY + (pillH / 2));
    }

    return finalCanvas;
}
