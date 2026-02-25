export interface QRStyle {
    fgColor: string;
    bgColor: string;
    logoImage?: string;
    eyeRadius?: [number, number, number, number];
    labelText?: string;
}

export function createQRCompositeCanvas(qrCanvas: HTMLCanvasElement, styleObj: QRStyle, padding: number = 100): HTMLCanvasElement {
    const finalCanvas = document.createElement('canvas'); // We shouldn't strictly require document unless run in browser. It runs in browser though.
    const ctx = finalCanvas.getContext('2d');
    if (!ctx) return finalCanvas;

    const labelFontSize = 72;
    const boxPaddingY = 32;
    const labelBoxHeight = labelFontSize + (boxPaddingY * 2);
    const brandColor = '#8B0000';
    const borderPadding = 20;
    const borderRadius = 40;
    const borderThickness = 12;
    const spaceBetweenBorderAndLabel = 30;

    const borderH = qrCanvas.height + (borderPadding * 2);
    const totalContentHeight = (padding - borderPadding) + borderH + spaceBetweenBorderAndLabel + labelBoxHeight + 40;

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

        const centerX = finalCanvas.width / 2;
        const labelY = borderY + borderH + spaceBetweenBorderAndLabel;

        ctx.font = `bold ${labelFontSize}px sans-serif`;
        const textMetrics = ctx.measureText(styleObj.labelText);
        const textWidth = textMetrics.width;
        const boxPaddingX = 60;

        const boxWidth = textWidth + (boxPaddingX * 2);
        const boxHeight = labelBoxHeight;

        ctx.fillStyle = brandColor;
        const radius = 40;
        const x = centerX - (boxWidth / 2);
        const y = labelY;

        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + boxWidth - radius, y);
        ctx.quadraticCurveTo(x + boxWidth, y, x + boxWidth, y + radius);
        ctx.lineTo(x + boxWidth, y + boxHeight - radius);
        ctx.quadraticCurveTo(x + boxWidth, y + boxHeight, x + boxWidth - radius, y + boxHeight);
        ctx.lineTo(x + radius, y + boxHeight);
        ctx.quadraticCurveTo(x, y + boxHeight, x, y + boxHeight - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.fill();

        const pointerWidth = 60;
        ctx.beginPath();
        ctx.moveTo(centerX - (pointerWidth / 2), y + 2);
        ctx.lineTo(centerX, borderY + borderH - (borderThickness / 2) + 2);
        ctx.lineTo(centerX + (pointerWidth / 2), y + 2);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(styleObj.labelText, centerX, y + (boxHeight / 2) + 4);
    }

    return finalCanvas;
}
