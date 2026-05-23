const videoElement = document.getElementById('webcam-video');
const previewCanvas = document.getElementById('webcam-canvas');
const previewCtx = previewCanvas.getContext('2d');

let lastTime = performance.now();
let frameCount = 0;
let modelLoaded = false;
let stream = null;
let hands = null;

// Initialize MediaPipe Hands safely
function initMediaPipe() {
    if (typeof Hands === 'undefined') {
        throw new Error("MediaPipe Hands library is not loaded yet. Please check your network connection.");
    }
    
    hands = new Hands({
        locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4/${file}`;
        }
    });

    hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.65,
        minTrackingConfidence: 0.65
    });

    hands.onResults(onHandResults);
}

// Setup background drawing variables on STATE dynamically
STATE.cachedLandmarks = null;
STATE.pinchActive = false;

async function startCamera() {
    const statusText = document.getElementById('tracking-status-text');
    statusText.innerText = 'Requesting camera access...';
    
    try {
        // 1. Initialize MediaPipe
        initMediaPipe();
        
        // 2. Request native webcam stream
        stream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: 640 },
                height: { ideal: 480 },
                facingMode: 'user'
            },
            audio: false
        });
        
        // 3. Bind stream to video element
        videoElement.srcObject = stream;
        videoElement.setAttribute('autoplay', '');
        videoElement.setAttribute('muted', '');
        videoElement.setAttribute('playsinline', '');
        
        videoElement.onloadedmetadata = () => {
            videoElement.play();
            statusText.innerText = 'Camera active. Loading models...';
            document.getElementById('webcam-panel').classList.add('active');
            document.getElementById('camera-placeholder-ui').classList.add('hidden');
            
            // 4. Start the frame loop
            startFrameLoop();
        };
    } catch (err) {
        console.error("Camera start failure:", err);
        let msg = 'Camera access denied or failed.';
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            msg = 'Camera permission denied. Please allow webcam access in browser settings.';
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
            msg = 'No webcam found on this device. Please connect a camera.';
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
            msg = 'Webcam is currently in use by another application (like Zoom or Teams).';
        } else if (err.message) {
            msg = err.message;
        }
        statusText.innerText = msg;
        document.getElementById('webcam-panel').classList.add('error');
    }
}

let isLoopActive = false;
function startFrameLoop() {
    if (isLoopActive) return;
    isLoopActive = true;
    
    async function processFrame() {
        if (!stream || videoElement.paused || videoElement.ended) {
            isLoopActive = false;
            return;
        }
        
        // 1. Immediately pipe the raw frame to the full-screen canvas background
        STATE.lastVideoFrame = videoElement;
        
        // 2. Draw mirrored preview on sidebar canvas immediately so the screen is never black
        previewCtx.save();
        previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
        previewCtx.translate(previewCanvas.width, 0);
        previewCtx.scale(-1, 1);
        previewCtx.drawImage(videoElement, 0, 0, previewCanvas.width, previewCanvas.height);
        previewCtx.restore();
        
        // 3. Draw skeleton overlay on top of preview if hand is detected
        if (STATE.handDetected && STATE.cachedLandmarks) {
            drawHandOverlay(STATE.cachedLandmarks);
            if (CONFIG.controlMode === 'pinch' && STATE.pinchActive) {
                drawPinchLine(STATE.cachedLandmarks[4], STATE.cachedLandmarks[8], true);
            }
        }
        
        // 4. Process frame with MediaPipe
        if (hands) {
            try {
                await hands.send({ image: videoElement });
            } catch (e) {
                console.error("MediaPipe processing error:", e);
            }
        }
        
        requestAnimationFrame(processFrame);
    }
    
    requestAnimationFrame(processFrame);
}

// Distance helper
function getDistance(p1, p2) {
    return Math.sqrt(
        Math.pow(p1.x - p2.x, 2) + 
        Math.pow(p1.y - p2.y, 2) + 
        Math.pow(p1.z - p2.z, 2)
    );
}


function onHandResults(results) {
    if (!modelLoaded) {
        modelLoaded = true;
        document.getElementById('tracking-status-text').innerText = 'System Active';
        document.getElementById('startup-overlay').classList.add('hidden');
    }

    // Calculate FPS
    frameCount++;
    const now = performance.now();
    if (now - lastTime >= 1000) {
        document.getElementById('tracking-fps').innerText = frameCount;
        frameCount = 0;
        lastTime = now;
    }

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        STATE.handDetected = true;
        const landmarks = results.multiHandLandmarks[0];
        STATE.cachedLandmarks = landmarks; // Cache the landmarks for the onFrame draw loop

        // Tracked coordinates: Index Finger Tip (Landmark 8)
        const indexTip = landmarks[8];
        const indexPip = landmarks[6];
        const thumbTip = landmarks[4];
        
        // Wrist (0) and Middle base (9) for scaling pinch gestures
        const wrist = landmarks[0];
        const middleBase = landmarks[9];

        // Mirror coordinates for canvas: 0 on camera is right, we want left on canvas
        const normX = 1 - indexTip.x;
        const normY = indexTip.y;

        let drawTriggered = false;

        if (CONFIG.controlMode === 'point') {
            // Point to Write Mode:
            // Index finger must be pointing UP (tip below PIP joint in camera space Y coordinate: 0 is top, so indexTip.y < indexPip.y)
            const isIndexExtended = indexTip.y < indexPip.y;
            
            // Check other fingers are curled (their Y tips are larger/lower than their base joints)
            const middleTip = landmarks[12];
            const middlePip = landmarks[10];
            const ringTip = landmarks[16];
            const ringPip = landmarks[14];
            const pinkyTip = landmarks[20];
            const pinkyPip = landmarks[18];

            const isMiddleCurled = middleTip.y > middlePip.y;
            const isRingCurled = ringTip.y > ringPip.y;
            const isPinkyCurled = pinkyTip.y > pinkyPip.y;

            // Trigger draw only if index is pointing and others are folded (gesturing a pencil)
            drawTriggered = isIndexExtended && isMiddleCurled && isRingCurled && isPinkyCurled;
            STATE.pinchActive = false;
            
            // Update HUD tracking label
            document.getElementById('current-gesture-label').innerText = drawTriggered ? 'DRAWING' : 'HOVERING';
        } else {
            // Pinch to Write Mode:
            // Calculate distance between thumb tip (4) and index tip (8) normalized by hand scale
            const handScale = getDistance(wrist, middleBase);
            const pinchDist = getDistance(thumbTip, indexTip);
            const normalizedPinchDist = pinchDist / (handScale || 1);

            const pinchThreshold = 0.28;
            drawTriggered = normalizedPinchDist < pinchThreshold;
            STATE.pinchActive = drawTriggered;
            
            document.getElementById('current-gesture-label').innerText = drawTriggered ? 'PINCH DRAWING' : 'HOVERING';
        }

        // Pass updates to writer engine
        handlePointerUpdate(normX, normY, drawTriggered);
    } else {
        STATE.handDetected = false;
        STATE.cachedLandmarks = null;
        STATE.pinchActive = false;
        STATE.handDetectedBefore = false; // Reset snap state so next hand entry snaps instead of dragging
        document.getElementById('current-gesture-label').innerText = 'NO HAND';
        
        // Reset drawing state if hand leaves screen
        if (STATE.isDrawing) {
            endStroke();
        }
    }
}

function drawHandOverlay(landmarks) {
    const w = previewCanvas.width;
    const h = previewCanvas.height;
    const mirrorX = (x) => w - (x * w);
    const getCanvasY = (y) => y * h;

    previewCtx.save();
    previewCtx.strokeStyle = 'rgba(0, 240, 255, 0.55)';
    previewCtx.lineWidth = 2;

    const connections = [
        [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
        [0, 5], [5, 6], [6, 7], [7, 8], // Index
        [5, 9], [9, 10], [10, 11], [11, 12], // Middle
        [9, 13], [13, 14], [14, 15], [15, 16], // Ring
        [13, 17], [17, 18], [18, 19], [19, 20], [0, 17] // Pinky
    ];

    connections.forEach(([i1, i2]) => {
        const p1 = landmarks[i1];
        const p2 = landmarks[i2];
        previewCtx.beginPath();
        previewCtx.moveTo(mirrorX(p1.x), getCanvasY(p1.y));
        previewCtx.lineTo(mirrorX(p2.x), getCanvasY(p2.y));
        previewCtx.stroke();
    });

    landmarks.forEach((pt, index) => {
        if (index === 8) {
            previewCtx.fillStyle = '#ff007f';
            previewCtx.beginPath();
            previewCtx.arc(mirrorX(pt.x), getCanvasY(pt.y), 5, 0, Math.PI * 2);
            previewCtx.fill();
        } else {
            previewCtx.fillStyle = '#00f0ff';
            previewCtx.beginPath();
            previewCtx.arc(mirrorX(pt.x), getCanvasY(pt.y), 2.5, 0, Math.PI * 2);
            previewCtx.fill();
        }
    });

    previewCtx.restore();
}

function drawPinchLine(thumb, index, active) {
    const w = previewCanvas.width;
    const h = previewCanvas.height;
    const mirrorX = (x) => w - (x * w);
    const getCanvasY = (y) => y * h;

    previewCtx.save();
    previewCtx.strokeStyle = active ? '#22c55e' : 'rgba(255, 255, 255, 0.4)';
    previewCtx.lineWidth = active ? 3 : 1;
    previewCtx.beginPath();
    previewCtx.moveTo(mirrorX(thumb.x), getCanvasY(thumb.y));
    previewCtx.lineTo(mirrorX(index.x), getCanvasY(index.y));
    previewCtx.stroke();
    previewCtx.restore();
}

// Start sequence triggers
const startCameraBtn = document.getElementById('start-camera-btn');
if (startCameraBtn) {
    startCameraBtn.addEventListener('click', async () => {
        window.writerAudio.init(); // Initialize audio
        startCameraBtn.classList.add('hidden');
        document.getElementById('webcam-preview-container').classList.remove('hidden');
        await startCamera();
    });
}

const startOverlayBtn = document.getElementById('start-overlay-btn');
if (startOverlayBtn) {
    startOverlayBtn.addEventListener('click', async () => {
        window.writerAudio.init();
        const startCamBtn = document.getElementById('start-camera-btn');
        if (startCamBtn) startCamBtn.classList.add('hidden');
        document.getElementById('webcam-preview-container').classList.remove('hidden');
        document.getElementById('startup-overlay').classList.add('hidden');
        await startCamera();
    });
}
