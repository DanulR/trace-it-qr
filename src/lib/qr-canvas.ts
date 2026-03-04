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

    const labelFontSize = Math.round(qrCanvas.width * 0.22);
    const boxPaddingY = Math.round(qrCanvas.width * 0.06);
    const labelBoxHeight = labelFontSize + (boxPaddingY * 2);
    const brandColor = styleObj.borderColor || '#8B0000';
    const borderPadding = 20;
    const isRounded = styleObj.eyeRadius && styleObj.eyeRadius[0] > 0;
    const borderRadius = isRounded ? 40 : 0;
    const borderThickness = 12;

    const borderH = qrCanvas.height + (borderPadding * 2);
    const totalContentHeight = (padding - borderPadding) + borderH + (borderThickness / 2) + labelBoxHeight + 40;

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

        // Draw border with flat bottom when label is present
        ctx.beginPath();
        ctx.moveTo(borderX + borderRadius, borderY);
        ctx.lineTo(borderX + borderW - borderRadius, borderY);
        ctx.quadraticCurveTo(borderX + borderW, borderY, borderX + borderW, borderY + borderRadius);
        ctx.lineTo(borderX + borderW, borderY + borderH);
        ctx.lineTo(borderX, borderY + borderH);
        ctx.lineTo(borderX, borderY + borderRadius);
        ctx.quadraticCurveTo(borderX, borderY, borderX + borderRadius, borderY);
        ctx.closePath();
        ctx.stroke();

        // Label bar spanning full border width, flush underneath
        const labelY = borderY + borderH + (borderThickness / 2);
        const labelX = borderX - (borderThickness / 2);
        const labelW = borderW + borderThickness;
        const boxHeight = labelBoxHeight;

        ctx.fillStyle = brandColor;
        ctx.beginPath();
        ctx.moveTo(labelX, labelY);
        ctx.lineTo(labelX + labelW, labelY);
        ctx.lineTo(labelX + labelW, labelY + boxHeight - borderRadius);
        ctx.quadraticCurveTo(labelX + labelW, labelY + boxHeight, labelX + labelW - borderRadius, labelY + boxHeight);
        ctx.lineTo(labelX + borderRadius, labelY + boxHeight);
        ctx.quadraticCurveTo(labelX, labelY + boxHeight, labelX, labelY + boxHeight - borderRadius);
        ctx.lineTo(labelX, labelY);
        ctx.closePath();
        ctx.fill();

        // Label text
        const centerX = finalCanvas.width / 2;
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${labelFontSize}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(styleObj.labelText, centerX, labelY + (boxHeight / 2) + 4);
    }

    return finalCanvas;
}
