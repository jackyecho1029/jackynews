const imageInput = document.getElementById('imageInput');
const subtitleText = document.getElementById('subtitleText');
const downloadBtn = document.getElementById('downloadBtn');
const resetBtn = document.getElementById('resetBtn');
const placeholder = document.getElementById('placeholder');
const canvas = document.getElementById('previewCanvas');
const ctx = canvas.getContext('2d');

// Style Inputs
const fontSizeInput = document.getElementById('fontSize');
const cropHeightInput = document.getElementById('cropHeight');
const textColorInput = document.getElementById('textColor');
const strokeColorInput = document.getElementById('strokeColor');
const strokeWidthInput = document.getElementById('strokeWidth');
const bgColorInput = document.getElementById('bgColor');
const bgOpacityInput = document.getElementById('bgOpacity');
const bgOpacityValue = document.getElementById('bgOpacityValue');
const textOffsetInput = document.getElementById('textOffset');
const offsetValueDisplay = document.getElementById('offsetValue');

let baseImage = null;

// --- Event Listeners ---

imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            baseImage = img;
            placeholder.style.display = 'none';
            canvas.style.display = 'block';
            downloadBtn.disabled = false;
            draw();
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
});

// Real-time updates for all inputs
[subtitleText, fontSizeInput, cropHeightInput, textColorInput, strokeColorInput,
    strokeWidthInput, bgColorInput, textOffsetInput].forEach(el => {
        el.addEventListener('input', () => {
            if (el === textOffsetInput) offsetValueDisplay.textContent = el.value;
            debouncedDraw();
        });
    });

bgOpacityInput.addEventListener('input', (e) => {
    bgOpacityValue.textContent = e.target.value;
    debouncedDraw();
});

resetBtn.addEventListener('click', () => {
    baseImage = null;
    imageInput.value = '';
    subtitleText.value = '';
    canvas.style.display = 'none';
    placeholder.style.display = 'flex';
    downloadBtn.disabled = true;
});

downloadBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = 'cinematic_subtitle.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
});

// --- Logic ---

let debounceTimer;
function debouncedDraw() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(draw, 20); // 20ms debounce
}

function draw() {
    if (!baseImage) return;

    // 1. Get Config
    const lines = subtitleText.value.split('\n').filter(line => line.trim() !== ''); // Start with empty if no text, but we usually want at least one frame if image exists? 
    // If no text, treat as 1 frame empty? Or just show image?
    // Let's assume if no text, we just show the base image.
    const textLines = lines.length > 0 ? lines : [''];

    const fontSize = parseInt(fontSizeInput.value) || 40;
    const cropHeight = parseInt(cropHeightInput.value) || 100;
    const color = textColorInput.value;
    const strokeColor = strokeColorInput.value;
    const strokeWidth = parseInt(strokeWidthInput.value) || 0;
    const bgCol = bgColorInput.value;
    const bgOp = parseFloat(bgOpacityInput.value);
    const bottomOffset = parseInt(textOffsetInput.value);

    // 2. Calculate Canvas Size
    // Width = Base Image Width
    // Height = Base Image Height + ( (Lines - 1) * CropHeight )
    // Note: If 1 line, height = Base Image Height.

    const w = baseImage.width;
    const h = baseImage.height;
    const totalHeight = h + (Math.max(0, textLines.length - 1) * cropHeight);

    canvas.width = w;
    canvas.height = totalHeight;

    // 3. Draw Frame 1 (Full Image)
    ctx.drawImage(baseImage, 0, 0);

    // Draw Text for Frame 1
    drawTextLine(textLines[0], w / 2, h - bottomOffset, fontSize, color, strokeColor, strokeWidth, bgCol, bgOp);

    // 4. Draw Subsequent Frames
    let currentY = h;
    for (let i = 1; i < textLines.length; i++) {
        // Draw Image Slice
        // Source: Bottom 'cropHeight' pixels of image? 
        // Or arbitrary bottom slice? Usually for subtitles we want the bottom part.
        // Let's take the bottom 'cropHeight' pixels from the source image.

        // Ensure cropHeight doesn't exceed image height
        const safeCropH = Math.min(cropHeight, h);
        const sourceY = h - safeCropH;

        ctx.drawImage(baseImage,
            0, sourceY, w, safeCropH,  // Source: x, y, w, h
            0, currentY, w, safeCropH  // Dest: x, y, w, h
        );

        // Draw Text
        // Center of the new strip? Or offset from bottom of the strip?
        // To be consistent with Frame 1, we should position it relative to the strip bottom?
        // Frame 1 text is at 'h - offset'. 
        // These strips are 'safeCropH' tall.
        // So text should be at 'currentY + safeCropH - offset' ?? 
        // OR, if the user thinks of "Subtitle Height" as the space *containing* the text, maybe center it?
        // Let's stick to 'offset from bottom' consistency.

        // Wait, if cropHeight is small, 'offset' might push text out.
        // Let's assume offset is relative to the bottom of the drawn frame.
        const textY = currentY + safeCropH - bottomOffset;

        drawTextLine(textLines[i], w / 2, textY, fontSize, color, strokeColor, strokeWidth, bgCol, bgOp);

        currentY += safeCropH;
    }
}

function drawTextLine(text, x, y, dataFontSize, color, strokeColor, strokeW, bgCol, bgOp) {
    if (!text) return;

    ctx.font = `bold ${dataFontSize}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom'; // Draw from bottom up to handle offset easily

    const lines = text.split('\\n'); // support manual line break if they type \n ? Actually textarea handles newlines as new array items in main loop.
    // But if a single subtitle has multiple lines? 
    // The requirement says "text box... split by line". Usually this means 1 line = 1 subtitle frame.
    // If they wrap in the box, it's a new frame. 

    // Measure text for background
    const metrics = ctx.measureText(text);
    const txtH = dataFontSize; // approx
    const txtW = metrics.width;
    const padding = 20;

    // Draw Background
    if (bgOp > 0) {
        ctx.save();
        ctx.globalAlpha = bgOp;
        ctx.fillStyle = bgCol;
        // Rect centered at x, moving up from y
        // y is baseline. Top is y - txtH. 
        ctx.fillRect(x - txtW / 2 - padding, y - txtH + (txtH * 0.2), txtW + padding * 2, txtH + padding);
        // Note: textBaseline 'bottom' is tricky with measureText. 
        // Simple approximation: y is bottom. height is fontSize.
        ctx.restore();
    }

    // Stroke
    if (strokeW > 0) {
        ctx.lineWidth = strokeW;
        ctx.strokeStyle = strokeColor;
        ctx.strokeText(text, x, y);
    }

    // Fill
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
}
