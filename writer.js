const canvas = document.getElementById('paint-canvas');
const ctx = canvas.getContext('2d');

// Persistent offscreen canvas to store drawings
const offscreenCanvas = document.createElement('canvas');
const offscreenCtx = offscreenCanvas.getContext('2d');

// App settings
const CONFIG = {
    brushColor: '#00f0ff',
    brushSize: 8,
    isEraser: false,
    controlMode: 'point', // 'point' or 'pinch'
    backgroundMode: 'full', // 'full' or 'hidden' (corner preview handled in HTML)
    showSkeleton: true,
    smoothing: 0.22 // Easing factor: lower = smoother, higher = raw/shaky
};

// Application state
const STATE = {
    cursorX: 0,
    cursorY: 0,
    prevCursorX: 0,
    prevCursorY: 0,
    isDrawing: false,
    handDetected: false,
    handDetectedBefore: false, // snaps cursor on first frame to prevent drag streaks
    strokes: [], // Array of stroke objects {points, color, size, isEraser}
    currentStrokePoints: [],
    
    // Air Buttons Hover State
    hoveredButton: null,
    hoverTimer: 0, // 0 to 1
    hoverDuration: 1200, // milliseconds to trigger (1.2s)
    lastTickTime: 0,
    cooldownActive: false,
    cooldownTimer: 0,

    // Last video frame received
    lastVideoFrame: null
};

// Air Button definitions
class AirButton {
    constructor(id, label, x, y, w, h, color, callback) {
        this.id = id;
        this.label = label;
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.color = color;
        this.callback = callback;
    }

    contains(px, py) {
        return px >= this.x && px <= this.x + this.w &&
               py >= this.y && py <= this.y + this.h;
    }

    draw(context, isHovered, progress) {
        context.save();
        
        // Button background (monochromatic color inversion)
        context.fillStyle = isHovered ? '#ffffff' : 'rgba(19, 19, 19, 0.65)';
        context.beginPath();
        context.roundRect(this.x, this.y, this.w, this.h, 12);
        context.fill();

        // Monochromatic border
        context.strokeStyle = isHovered ? '#ffffff' : 'rgba(255, 255, 255, 0.2)';
        context.lineWidth = isHovered ? 2.5 : 1.5;
        context.beginPath();
        context.roundRect(this.x, this.y, this.w, this.h, 12);
        context.stroke();

        // Draw loading fill if hovered
        if (isHovered && progress > 0) {
            context.fillStyle = 'rgba(0, 0, 0, 0.15)'; // grey loading progress running over white background
            context.beginPath();
            context.roundRect(this.x, this.y, this.w * progress, this.h, 12);
            context.fill();
        }

        // Label (invert color on hover)
        context.shadowBlur = 0;
        context.fillStyle = isHovered ? '#131313' : '#ffffff';
        context.font = '600 13px "Inter", sans-serif';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(this.label, this.x + this.w / 2, this.y + this.h / 2);

        context.restore();
    }
}

const airButtons = [];

// Handle resizing dynamically
function resizeCanvas() {
    // Save drawings
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = offscreenCanvas.width;
    tempCanvas.height = offscreenCanvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(offscreenCanvas, 0, 0);

    // Resize main
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Resize offscreen
    offscreenCanvas.width = canvas.width;
    offscreenCanvas.height = canvas.height;

    // Restore drawings
    offscreenCtx.drawImage(tempCanvas, 0, 0, canvas.width, canvas.height);

    // Re-position Air Buttons at the top center
    setupAirButtons();
}

function setupAirButtons() {
    airButtons.length = 0; // Clear
    const btnW = 95;
    const btnH = 40;
    const gap = 12;
    const count = 4;
    const totalW = (btnW * count) + (gap * (count - 1));
    
    // Adjust start coordinates to sit inside the visible canvas viewport (below top bar, right of sidebar)
    const sidebarWidth = window.innerWidth >= 1024 ? 260 : 0; // 1024px is Tailwind lg breakpoint
    const topBarHeight = 80;
    
    const startX = sidebarWidth + (canvas.width - sidebarWidth - totalW) / 2;
    const startY = topBarHeight + 15;

    airButtons.push(new AirButton('clear', 'CLEAR', startX, startY, btnW, btnH, '#ff0055', clearDrawing));
    airButtons.push(new AirButton('eraser', 'ERASER', startX + btnW + gap, startY, btnW, btnH, '#ffaa00', toggleEraserAir));
    airButtons.push(new AirButton('undo', 'UNDO', startX + (btnW + gap) * 2, startY, btnW, btnH, '#b026ff', undoLastStroke));
    airButtons.push(new AirButton('save', 'SAVE', startX + (btnW + gap) * 3, startY, btnW, btnH, '#00f0ff', saveDrawing));
}

// Action Callbacks
function clearDrawing() {
    offscreenCtx.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);
    STATE.strokes = [];
    window.writerAudio.playClear();
}

function toggleEraserAir() {
    CONFIG.isEraser = !CONFIG.isEraser;
    window.writerAudio.playClick();
    
    // Update HTML sidebar UI active button using global sync function
    if (typeof window.updateToolUI === 'function') {
        window.updateToolUI();
    }
}

function undoLastStroke() {
    if (STATE.strokes.length === 0) return;
    STATE.strokes.pop();
    redrawOffscreen();
    window.writerAudio.playClick();
}

function saveDrawing() {
    window.writerAudio.playClick();
    
    // Create clean white/black backdrop for export or keep transparent
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    const eCtx = exportCanvas.getContext('2d');
    
    // Fill with solid dark background
    eCtx.fillStyle = '#050409';
    eCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    
    // Overlay drawing
    eCtx.drawImage(offscreenCanvas, 0, 0);

    const link = document.createElement('a');
    link.download = 'air-writing.png';
    link.href = exportCanvas.toDataURL('image/png');
    link.click();
}

// Redraw all strokes onto the offscreen canvas (used for Undo)
function redrawOffscreen() {
    offscreenCtx.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);
    
    STATE.strokes.forEach(stroke => {
        if (stroke.points.length < 2) return;
        
        offscreenCtx.save();
        
        if (stroke.isEraser) {
            offscreenCtx.lineWidth = stroke.size;
            offscreenCtx.lineCap = 'round';
            offscreenCtx.lineJoin = 'round';
            offscreenCtx.globalCompositeOperation = 'destination-out';
            offscreenCtx.strokeStyle = 'rgba(0,0,0,1)';
            
            offscreenCtx.beginPath();
            offscreenCtx.moveTo(stroke.points[0].x, stroke.points[0].y);
            for (let i = 1; i < stroke.points.length; i++) {
                offscreenCtx.lineTo(stroke.points[i].x, stroke.points[i].y);
            }
            offscreenCtx.stroke();
        } else {
            offscreenCtx.globalCompositeOperation = 'source-over';
            offscreenCtx.fillStyle = stroke.color;
            offscreenCtx.shadowBlur = stroke.size * 0.8;
            offscreenCtx.shadowColor = stroke.color;

            // Draw Calligraphy flat Chisel stroke: sweeping chisel polygons
            const angle = Math.PI / 4; // 45 degrees flat chisel tip
            const dx = Math.cos(angle) * (stroke.size / 2);
            const dy = Math.sin(angle) * (stroke.size / 2);

            for (let i = 1; i < stroke.points.length; i++) {
                const x1 = stroke.points[i - 1].x;
                const y1 = stroke.points[i - 1].y;
                const x2 = stroke.points[i].x;
                const y2 = stroke.points[i].y;

                offscreenCtx.beginPath();
                offscreenCtx.moveTo(x1 - dx, y1 - dy);
                offscreenCtx.lineTo(x1 + dx, y1 + dy);
                offscreenCtx.lineTo(x2 + dx, y2 + dy);
                offscreenCtx.lineTo(x2 - dx, y2 - dy);
                offscreenCtx.closePath();
                offscreenCtx.fill();
            }
        }
        offscreenCtx.restore();
    });
}

// Draw a single line segment to the offscreen canvas (realtime drawing)
function drawSegmentToOffscreen(x1, y1, x2, y2, color, size, isEraser) {
    offscreenCtx.save();

    if (isEraser) {
        // Erase mode deletes content in offscreen canvas
        offscreenCtx.lineWidth = size;
        offscreenCtx.lineCap = 'round';
        offscreenCtx.lineJoin = 'round';
        offscreenCtx.globalCompositeOperation = 'destination-out';
        offscreenCtx.strokeStyle = 'rgba(0,0,0,1)';
        offscreenCtx.beginPath();
        offscreenCtx.moveTo(x1, y1);
        offscreenCtx.lineTo(x2, y2);
        offscreenCtx.stroke();
    } else {
        offscreenCtx.globalCompositeOperation = 'source-over';
        offscreenCtx.fillStyle = color;
        offscreenCtx.shadowBlur = size * 0.8;
        offscreenCtx.shadowColor = color;
        
        // Calligraphy flat chisel segment
        const angle = Math.PI / 4; 
        const dx = Math.cos(angle) * (size / 2);
        const dy = Math.sin(angle) * (size / 2);

        offscreenCtx.beginPath();
        offscreenCtx.moveTo(x1 - dx, y1 - dy);
        offscreenCtx.lineTo(x1 + dx, y1 + dy);
        offscreenCtx.lineTo(x2 + dx, y2 + dy);
        offscreenCtx.lineTo(x2 - dx, y2 - dy);
        offscreenCtx.closePath();
        offscreenCtx.fill();
    }

    offscreenCtx.restore();
}

// Start a new line stroke
function startStroke() {
    STATE.isDrawing = true;
    STATE.currentStrokePoints = [{ x: STATE.cursorX, y: STATE.cursorY }];
    
    // Play synthesizer humming sound
    window.writerAudio.startDrawingHum(STATE.cursorY / canvas.height);
}

// Add point to stroke and draw segment
function updateStroke() {
    if (!STATE.isDrawing) return;

    const lastPoint = STATE.currentStrokePoints[STATE.currentStrokePoints.length - 1];
    
    // Filter minimal jitter movements
    const dist = Math.hypot(STATE.cursorX - lastPoint.x, STATE.cursorY - lastPoint.y);
    if (dist > 1.5) {
        STATE.currentStrokePoints.push({ x: STATE.cursorX, y: STATE.cursorY });
        
        // Draw in real-time onto offscreen canvas
        drawSegmentToOffscreen(
            lastPoint.x, lastPoint.y, 
            STATE.cursorX, STATE.cursorY, 
            CONFIG.brushColor, CONFIG.brushSize, CONFIG.isEraser
        );

        // Update sound frequency
        window.writerAudio.startDrawingHum(STATE.cursorY / canvas.height);
    }
}

// Finish stroke and push to array
function endStroke() {
    if (!STATE.isDrawing) return;
    
    STATE.isDrawing = false;
    window.writerAudio.stopDrawingHum();

    if (STATE.currentStrokePoints.length > 1) {
        STATE.strokes.push({
            points: STATE.currentStrokePoints,
            color: CONFIG.brushColor,
            size: CONFIG.brushSize,
            isEraser: CONFIG.isEraser
        });
    }
    STATE.currentStrokePoints = [];
}

// Update coordinates and handle gesture state swaps
function handlePointerUpdate(normX, normY, drawTriggered) {
    STATE.prevCursorX = STATE.cursorX;
    STATE.prevCursorY = STATE.cursorY;

    // Boundary constraints: Limit drawing coordinates to the visible canvas area
    // (excluding left sidebar width of 260px and TopAppBar height of 80px)
    const sidebarWidth = window.innerWidth >= 1024 ? 260 : 0;
    const topBarHeight = 80;

    const targetX = sidebarWidth + normX * (canvas.width - sidebarWidth);
    const targetY = topBarHeight + normY * (canvas.height - topBarHeight);

    // Snap to target on first hand-detection frame to prevent long drag lines from (0,0)
    if (!STATE.handDetectedBefore) {
        STATE.cursorX = targetX;
        STATE.cursorY = targetY;
        STATE.handDetectedBefore = true;
    } else {
        // Apply exponential smoothing (lerp)
        STATE.cursorX += (targetX - STATE.cursorX) * CONFIG.smoothing;
        STATE.cursorY += (targetY - STATE.cursorY) * CONFIG.smoothing;
    }

    // Check Air Buttons Collision
    let hoveredBtnThisFrame = null;
    airButtons.forEach(btn => {
        if (btn.contains(STATE.cursorX, STATE.cursorY)) {
            hoveredBtnThisFrame = btn;
        }
    });

    if (hoveredBtnThisFrame) {
        // If drawing, end drawing when hovering over buttons
        if (STATE.isDrawing) {
            endStroke();
        }

        if (STATE.cooldownActive) {
            // Wait for cooldown to end
            return;
        }

        if (STATE.hoveredButton === hoveredBtnThisFrame) {
            // Accumulate hover progress
            const now = performance.now();
            const elapsed = now - STATE.lastTickTime;
            
            // Increment progress
            STATE.hoverTimer += elapsed / STATE.hoverDuration;
            STATE.lastTickTime = now;

            // Tick audio chimes
            if (STATE.hoverTimer > 0 && Math.floor(STATE.hoverTimer * 8) > Math.floor((STATE.hoverTimer - elapsed/STATE.hoverDuration) * 8)) {
                window.writerAudio.playHoverTick();
            }

            if (STATE.hoverTimer >= 1) {
                // Trigger button action!
                hoveredBtnThisFrame.callback();
                
                // Active button cooldown
                STATE.cooldownActive = true;
                STATE.cooldownTimer = 60; // frames
                STATE.hoverTimer = 0;
                STATE.hoveredButton = null;
            }
        } else {
            // New hover
            STATE.hoveredButton = hoveredBtnThisFrame;
            STATE.hoverTimer = 0;
            STATE.lastTickTime = performance.now();
        }
    } else {
        // Reset hover states
        STATE.hoveredButton = null;
        STATE.hoverTimer = 0;
        
        // Cooldown processing
        if (STATE.cooldownActive) {
            STATE.cooldownTimer--;
            if (STATE.cooldownTimer <= 0) {
                STATE.cooldownActive = false;
            }
        }

        // Draw logic based on triggers
        if (drawTriggered) {
            if (!STATE.isDrawing) {
                startStroke();
            } else {
                updateStroke();
            }
        } else {
            if (STATE.isDrawing) {
                endStroke();
            }
        }
    }
}

// Core drawing loops
function appLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Draw webcam feed in background if enabled
    if (CONFIG.backgroundMode === 'full' && STATE.lastVideoFrame) {
        ctx.save();
        // Mirror the webcam background stream
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.globalAlpha = 0.35; // transparent overlay
        ctx.drawImage(STATE.lastVideoFrame, 0, 0, canvas.width, canvas.height);
        ctx.restore();
    } else {
        // Flat dark background
        ctx.fillStyle = '#050409';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // 2. Draw offscreen canvas drawings (persistent layers)
    ctx.drawImage(offscreenCanvas, 0, 0);

    // 3. Draw current active line segment (realtime feedback)
    if (STATE.isDrawing && STATE.currentStrokePoints.length > 1) {
        ctx.save();

        if (CONFIG.isEraser) {
            ctx.lineWidth = CONFIG.brushSize;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.strokeStyle = 'rgba(255,255,255,0.25)';
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            const pts = STATE.currentStrokePoints;
            ctx.moveTo(pts[0].x, pts[0].y);
            for (let i = 1; i < pts.length; i++) {
                ctx.lineTo(pts[i].x, pts[i].y);
            }
            ctx.stroke();
        } else {
            // Draw Calligraphy Chisel segment in real-time
            ctx.fillStyle = CONFIG.brushColor;
            ctx.shadowBlur = CONFIG.brushSize * 0.8;
            ctx.shadowColor = CONFIG.brushColor;
            
            const angle = Math.PI / 4; 
            const dx = Math.cos(angle) * (CONFIG.brushSize / 2);
            const dy = Math.sin(angle) * (CONFIG.brushSize / 2);
            const pts = STATE.currentStrokePoints;
            
            for (let i = 1; i < pts.length; i++) {
                const x1 = pts[i - 1].x;
                const y1 = pts[i - 1].y;
                const x2 = pts[i].x;
                const y2 = pts[i].y;
                
                ctx.beginPath();
                ctx.moveTo(x1 - dx, y1 - dy);
                ctx.lineTo(x1 + dx, y1 + dy);
                ctx.lineTo(x2 + dx, y2 + dy);
                ctx.lineTo(x2 - dx, y2 - dy);
                ctx.closePath();
                ctx.fill();
            }
        }
        ctx.restore();
    }

    // 4. Draw Air Buttons at top
    airButtons.forEach(btn => {
        const isHovered = STATE.hoveredButton === btn;
        btn.draw(ctx, isHovered, isHovered ? STATE.hoverTimer : 0);
    });

    // 5. Draw hand cursor pointer if tracking is active
    if (STATE.handDetected) {
        drawPointerCursor();
    }

    requestAnimationFrame(appLoop);
}

function drawPointerCursor() {
    ctx.save();
    
    // Position
    const cx = STATE.cursorX;
    const cy = STATE.cursorY;

    // Glowing dot
    ctx.fillStyle = CONFIG.isEraser ? '#ffaa00' : CONFIG.brushColor;
    ctx.shadowBlur = 10;
    ctx.shadowColor = CONFIG.isEraser ? '#ffaa00' : CONFIG.brushColor;
    ctx.beginPath();
    ctx.arc(cx, cy, CONFIG.isEraser ? 10 : CONFIG.brushSize / 2 + 2, 0, Math.PI * 2);
    ctx.fill();

    // Outer crosshair circle
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, 22, 0, Math.PI * 2);
    ctx.stroke();

    // Draw circular hover radial progress indicator
    if (STATE.hoveredButton && STATE.hoverTimer > 0) {
        ctx.strokeStyle = STATE.hoveredButton.color;
        ctx.lineWidth = 3.5;
        ctx.shadowBlur = 8;
        ctx.shadowColor = STATE.hoveredButton.color;
        
        ctx.beginPath();
        // Start angle at top (-Math.PI/2) and draw clockwise based on progress
        ctx.arc(cx, cy, 22, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * STATE.hoverTimer));
        ctx.stroke();
    }

    ctx.restore();
}

// Initial triggers
window.addEventListener('resize', resizeCanvas);
resizeCanvas(); // Initial call
requestAnimationFrame(appLoop);
