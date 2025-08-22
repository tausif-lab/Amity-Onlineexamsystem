/*
*/


























//Enhanced studentExam.js with proctoring integration
// Global variables
let currentExam = null;
let questions = [];
let userAnswers = {};
let examTimer = null;
let timeRemaining = 0;
let examStartTime = null;

// Proctoring variables
let violations = 0;
let maxViolations = 3;
let webcamStream = null;
let isExamActive = false;
let proctoringEnabled = true;
let openCvReady = false;
let eyeTracker = null;
let faceClassifier = null;
let eyeClassifier = null;
let videoElement = null;
let visionCanvas = null;
let visionContext = null;
let eyeTrackingData = {
    isLookingAway: false,
    lookAwayStartTime: null,
    totalLookAwayTime: 0,
    noFaceDetectedTime: 0,
    multipleFacesDetectedTime: 0,
    lastValidGaze: 'center'
};
const EYE_TRACKING_CONFIG = {
    LOOK_AWAY_THRESHOLD: 3000, // 3 seconds
    NO_FACE_THRESHOLD: 2000,   // 2 seconds
    PROCESSING_INTERVAL: 500,  // 500ms between processing
    CONFIDENCE_THRESHOLD: 0.7
};


// Zoom integration variables
//let zoomMeetingConfig = null;
let zoomMeetingActive = false;
let zoomInitialized = false;
// Add these global variables at the top (add to existing globals)
let zoomMeetingJoined = false;
let zoomMeetingConfig = null;
let proctoringInitialized = false;


// Initialize exam when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded - Initializing exam');
    setupEventListeners();
    initializeExam();
});

/*async function initializeAllProctoring(examId) {
    if (!proctoringEnabled) {
        console.log('Proctoring disabled, skipping initialization');
        return;
    }
    
    try {
        console.log('Starting comprehensive proctoring initialization...');
        
        // Step 1: Setup basic proctoring listeners FIRST
        setupProctoringListeners();
        proctoringInitialized = true;
        
        // Step 2: Request webcam access
        await ensureWebcamAccess();
        
        // Step 3: Initialize Zoom proctoring (auto-create meeting if needed)
        await initializeZoomProctoring(examId);
        
        // Step 4: Enter fullscreen mode
        setTimeout(async () => {
            await enterFullscreen();
            isExamActive = true;
            console.log('✅ All proctoring features initialized successfully');
            showTemporaryMessage('🔒 Enhanced security monitoring is now active', 'success', 3000);
        }, 1000);
        
    } catch (error) {
        console.error('Proctoring initialization failed:', error);
        showTemporaryMessage('⚠️ Some security features may not be fully active', 'warning', 5000);
    }
}*/
// Enhanced initialization with automatic Zoom meeting start
async function initializeExam() {
    showLoading();
    
    const urlParams = new URLSearchParams(window.location.search);
    const examId = urlParams.get('examId');
    const autoSubmit = urlParams.get('autoSubmit');
    
    if (!examId) {
        showError('No exam ID provided in URL parameters');
        return;
    }
    
    // Handle auto-submit from violations
    if (autoSubmit === 'true') {
        await handleAutoSubmitFromViolations();
        return;
    }
    
    try {
        // Check if exam was already submitted
        const submissionStatus = await checkExamSubmissionStatus(examId);
        
        if (submissionStatus.isSubmitted) {
            showExamResults(submissionStatus.result);
            return;
        }
        
        // Load exam first to get exam details
        await loadExam(examId);
        
        // Initialize comprehensive proctoring with automatic Zoom meeting
        await initializeAllProctoring(examId);
        
    } catch (error) {
        console.error('Failed to initialize exam:', error);
        showError('Failed to load exam: ' + error.message);
    }
}

// ENHANCED: Comprehensive proctoring initialization with auto Zoom meeting
async function initializeAllProctoring(examId) {
    if (!proctoringEnabled) {
        console.log('Proctoring disabled, skipping initialization');
        return;
    }
    
    try {
        console.log('🔒 Starting comprehensive proctoring initialization...');
        
        // Step 1: Setup basic proctoring listeners FIRST
        setupProctoringListeners();
        proctoringInitialized = true;
        
        // Step 2: Request webcam access
        await ensureWebcamAccess();
        
        // Step 3: AUTO-START Zoom meeting when exam begins
        await autoStartZoomMeeting(examId);
        
        // Step 4: Enter fullscreen mode
        setTimeout(async () => {
            await enterFullscreen();
            isExamActive = true;
            console.log('✅ All proctoring features initialized successfully');
            showTemporaryMessage('🔒 Enhanced security monitoring is now active', 'success', 3000);
            
            // Step 5: Auto-join Zoom meeting after other features are ready
            if (zoomMeetingConfig && !zoomMeetingJoined) {
                await autoJoinZoomMeeting();
            }
        }, 1000);
        window.onOpenCvReady = function() {
    console.log('OpenCV.js is ready');
    openCvReady = true;
    initializeEyeTracking();
};

async function initializeEyeTracking() {
    if (!openCvReady) {
        console.warn('OpenCV not ready for eye tracking');
        return;
    }

    try {
        visionCanvas = document.getElementById('visionCanvas');
        visionContext = visionCanvas.getContext('2d');
        
        // Load Haar Cascades
        await loadHaarCascades();
        
        console.log('✅ Eye tracking initialized successfully');
        updateEyeTrackingStatus('Ready');
        
    } catch (error) {
        console.error('Eye tracking initialization failed:', error);
        updateEyeTrackingStatus('Failed');
    }
}
   async function loadHaarCascades() {
    // Load face cascade
    const faceCascadeUrl = 'https://raw.githubusercontent.com/opencv/opencv/master/data/haarcascades/haarcascade_frontalface_default.xml';
    const eyeCascadeUrl = 'https://raw.githubusercontent.com/opencv/opencv/master/data/haarcascades/haarcascade_eye.xml';
    
    faceClassifier = new cv.CascadeClassifier();
    eyeClassifier = new cv.CascadeClassifier();
    
    // Load cascade files (simplified - in production, you'd handle this better)
    faceClassifier.load('haarcascade_frontalface_default.xml');
    eyeClassifier.load('haarcascade_eye.xml');
}
        
    } catch (error) {
        console.error('Proctoring initialization failed:', error);
        showTemporaryMessage('⚠️ Some security features may not be fully active', 'warning', 5000);
    }
}






// FIXED: Zoom proctoring with auto-create meeting functionality
async function initializeZoomProctoring(examId) {
    if (!proctoringEnabled) return;
    
    try {
        console.log('🔵 Initializing Zoom proctoring for exam:', examId);
        
        // First, try to get existing meeting configuration
        let meetingConfig = await getExamMeetingConfig(examId);
        
        // If no meeting exists, try to auto-create one
        if (!meetingConfig) {
            console.log('No existing meeting found, attempting to auto-create...');
            meetingConfig = await autoCreateMeeting(examId);
        }
        
        if (meetingConfig) {
            zoomMeetingConfig = meetingConfig;
            console.log('📝 Zoom meeting config received:', {
                meetingNumber: meetingConfig.meetingNumber,
                hasPassword: !!meetingConfig.passWord
            });
            
            // Generate signature for student to join
            await generateStudentSignature(meetingConfig.meetingNumber);
            
            console.log('✅ Zoom proctoring setup completed successfully');
            showTemporaryMessage('📹 Video proctoring connected successfully', 'success', 4000);
            
        } else {
            console.warn('⚠️ Could not establish Zoom meeting, continuing with basic proctoring');
            showTemporaryMessage('📹 Video proctoring unavailable, using enhanced monitoring', 'warning', 5000);
        }
        
    } catch (error) {
        console.error('❌ Zoom proctoring initialization failed:', error);
        showTemporaryMessage('📹 Video proctoring setup failed, continuing with security monitoring', 'warning', 6000);
    }
}

// FIXED: Auto-create meeting when starting exam
async function autoCreateMeeting(examId) {
    try {
        console.log('🔵 Attempting to auto-create Zoom meeting...');
        
        const token = getAuthToken();
        const response = await fetch(`/api/zoom/auto-create-meeting/${examId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (result.success && result.data) {
            console.log('✅ Meeting auto-created successfully');
            return {
                meetingNumber: result.data.meetingNumber,
                passWord: result.data.password || '',
                userName: getStudentName(),
                userEmail: getStudentEmail()
            };
        } else {
            console.warn('⚠️ Auto-create meeting failed:', result.message);
            return null;
        }
        
    } catch (error) {
        console.error('❌ Error auto-creating meeting:', error);
        return null;
    }
}
async function autoStartZoomMeeting(examId) {
    if (!proctoringEnabled) {
        console.log('Proctoring disabled, skipping Zoom meeting');
        return;
    }
    
    try {
        console.log('🔵 Auto-starting Zoom meeting for exam:', examId);
        
        // Try to get existing meeting or auto-create one
        let meetingConfig = await getExamMeetingConfig(examId);
        
        if (!meetingConfig || !meetingConfig.hasMeeting) {
            console.log('No existing meeting found, attempting to auto-create...');
            meetingConfig = await autoCreateMeeting(examId);
        }
        
        if (meetingConfig) {
            zoomMeetingConfig = {
                meetingNumber: meetingConfig.meetingNumber,
                passWord: meetingConfig.password || '',
                userName: getStudentName(),
                userEmail: getStudentEmail()
            };
            
            console.log('✅ Zoom meeting config ready:', {
                meetingNumber: zoomMeetingConfig.meetingNumber,
                hasPassword: !!zoomMeetingConfig.passWord
            });
            
            // Generate signature and prepare for auto-join
            await generateStudentSignature(zoomMeetingConfig.meetingNumber);
            
            showTemporaryMessage('🔹 Video proctoring session ready', 'success', 3000);
            
        } else {
            console.warn('⚠️ Could not establish Zoom meeting');
            showTemporaryMessage('🔹 Video proctoring unavailable, using enhanced monitoring', 'warning', 4000);
        }
        
    } catch (error) {
        console.error('❌ Auto-start Zoom meeting failed:', error);
        showTemporaryMessage('🔹 Video proctoring setup failed, continuing with security monitoring', 'warning', 5000);
    }
}
async function autoJoinZoomMeeting() {
    if (!zoomMeetingConfig || zoomMeetingJoined) {
        return;
    }
    
    try {
        console.log('🔵 Auto-joining Zoom meeting...');
        
        // Check if Zoom SDK is available
        if (typeof window.zoomStudent !== 'undefined' && window.zoomStudent) {
            await window.zoomStudent.joinMeeting(zoomMeetingConfig);
            zoomMeetingJoined = true;
            console.log('✅ Successfully joined Zoom proctoring meeting');
        } else {
            console.warn('⚠️ Zoom SDK not available, skipping video proctoring');
            showTemporaryMessage('🔹 Video proctoring SDK not available', 'warning', 3000);
        }
        
    } catch (error) {
        console.error('❌ Auto-join Zoom meeting failed:', error);
        showTemporaryMessage('🔹 Could not connect to video proctoring', 'warning', 4000);
    }
}
function showTemporaryMessage(message, type = 'info', duration = 3000) {
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : type === 'warning' ? '#ffc107' : '#17a2b8'};
        color: ${type === 'warning' ? '#212529' : 'white'};
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 10000;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        max-width: 350px;
        font-size: 14px;
        border: 1px solid rgba(255,255,255,0.2);
    `;
    
    messageDiv.textContent = message;
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.style.opacity = '0';
            messageDiv.style.transform = 'translateX(100%)';
            messageDiv.style.transition = 'all 0.3s ease';
            setTimeout(() => {
                messageDiv.parentNode.removeChild(messageDiv);
            }, 300);
        }
    }, duration);
}


// FIXED: Generate signature for student to join meeting
async function generateStudentSignature(meetingNumber) {
    try {
        const token = getAuthToken();
        const response = await fetch('/api/zoom/student-signature', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                meetingNumber: meetingNumber,
                userName: getStudentName(),
                userEmail: getStudentEmail()
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            console.log('✅ Student signature generated successfully');
            // Here you would use the signature to join the meeting
            // This depends on your Zoom SDK implementation
            return result.data;
        }
        
    } catch (error) {
        console.error('❌ Error generating student signature:', error);
    }
    
    return null;
}

// Get meeting configuration for exam
async function getExamMeetingConfig(examId) {
    try {
        const token = getAuthToken();
        const response = await fetch(`/api/zoom/exam/${examId}/meeting-config`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const result = await response.json();
            if (result.success && result.data && result.data.hasMeeting) {
                return {
                    meetingNumber: result.data.meetingNumber,
                    passWord: result.data.password || '',
                    userName: getStudentName(),
                    userEmail: getStudentEmail()
                };
            }
        }
        
        return null;
    } catch (error) {
        console.error('Error getting meeting config:', error);
        return null;
    }
}




// Enhanced initialization with proctoring
async function initializeExam() {
    showLoading();
    
    const urlParams = new URLSearchParams(window.location.search);
    const examId = urlParams.get('examId');
    const autoSubmit = urlParams.get('autoSubmit');
    
    if (!examId) {
        showError('No exam ID provided in URL parameters');
        return;
    }
    
    // Handle auto-submit from violations
    if (autoSubmit === 'true') {
        await handleAutoSubmitFromViolations();
        return;
    }
    
    try {
        // Check if exam was already submitted
        const submissionStatus = await checkExamSubmissionStatus(examId);
        
        if (submissionStatus.isSubmitted) {
            showExamResults(submissionStatus.result);
            return;
        }
        
        // Initialize proctoring for new exam
        await initializeProctoring();
        
        // Load exam normally
        await loadExam(examId);
    } catch (error) {
        console.error('Failed to initialize exam:', error);
        showError('Failed to load exam: ' + error.message);
    }
}

// Initialize proctoring features
async function initializeProctoring() {
    if (!proctoringEnabled) return;
    
    try {
        isExamActive = true;
        violations = 0;
        
        // Initialize webcam
        await ensureWebcamAccess();
        
        // Setup proctoring event listeners
        setupProctoringListeners();
        
        // Enter fullscreen mode
        await enterFullscreen();
        
        console.log('Exam proctoring initialized successfully');
        
    } catch (error) {
        console.error('Proctoring initialization failed:', error);
        showError('Proctoring features could not be initialized. Please refresh and try again.');
    }
}

// Ensure webcam access
/*async function ensureWebcamAccess() {
    let webcamElement = document.getElementById('webcam');
    
    if (!webcamElement || !webcamElement.srcObject) {
        try {
            webcamStream = await navigator.mediaDevices.getUserMedia({ 
                video: true,
                audio: false 
            });
            
            if (!webcamElement) {
                webcamElement = document.createElement('video');
                webcamElement.id = 'webcam';
                webcamElement.style.cssText = `
                    position: fixed;
                    top: 10px;
                    right: 10px;
                    width: 200px;
                    height: 150px;
                    border: 2px solid #007bff;
                    border-radius: 8px;
                    z-index: 9999;
                    background: #000;
                `;
                webcamElement.autoplay = true;
                webcamElement.muted = true;
                document.body.appendChild(webcamElement);
            }
            
            webcamElement.srcObject = webcamStream;
            
        } catch (error) {
            console.error('Webcam initialization failed:', error);
            recordViolation('Webcam access denied or failed');
        }
    }
}*/
async function ensureWebcamAccess() {
    let webcamElement = document.getElementById('webcam');
    
    if (!webcamElement || !webcamElement.srcObject) {
        try {
            webcamStream = await navigator.mediaDevices.getUserMedia({ 
                video: true,
                audio: false 
            });
            
            if (!webcamElement) {
                webcamElement = document.createElement('video');
                webcamElement.id = 'webcam';
                webcamElement.style.cssText = `
                    position: fixed;
                    top: 10px;
                    right: 10px;
                    width: 200px;
                    height: 150px;
                    border: 2px solid #007bff;
                    border-radius: 8px;
                    z-index: 9999;
                    background: #000;
                `;
                webcamElement.autoplay = true;
                webcamElement.muted = true;
                document.body.appendChild(webcamElement);
            }
            webcamElement.srcObject = webcamStream;
            videoElement = webcamElement; // Store reference for OpenCV
            
            // Start eye tracking when webcam is ready
            webcamElement.addEventListener('loadeddata', () => {
                if (openCvReady) {
                    startEyeTracking();
                }
            });
            
        } catch (error) {
            console.error('Webcam initialization failed:', error);
            recordViolation('Webcam access denied or failed');
        }
    }
}

function startEyeTracking() {
    if (!openCvReady || !faceClassifier || !videoElement) {
        console.warn('Eye tracking not ready');
        return;
    }

    console.log('🎯 Starting eye tracking...');
    updateEyeTrackingStatus('Active');
    
    // Process frames at intervals
    setInterval(() => {
        if (isExamActive && videoElement.readyState === 4) {
            processFrame();
        }
    }, EYE_TRACKING_CONFIG.PROCESSING_INTERVAL);
}
function processFrame() {
    try {
        // Capture frame from video
        visionContext.drawImage(videoElement, 0, 0, visionCanvas.width, visionCanvas.height);
        const imageData = visionContext.getImageData(0, 0, visionCanvas.width, visionCanvas.height);
        
        // Convert to OpenCV Mat
        const src = cv.matFromImageData(imageData);
        const gray = new cv.Mat();
        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
        
        // Detect faces
        const faces = new cv.RectVector();
        faceClassifier.detectMultiScale(gray, faces);
        
        analyzeDetections(faces.size(), faces, gray);
        
        // Clean up
        src.delete();
        gray.delete();
        faces.delete();
        
    } catch (error) {
        console.error('Frame processing error:', error);
    }
}
function analyzeDetections(faceCount, faces, grayMat) {
    const currentTime = Date.now();
    
    if (faceCount === 0) {
        // No face detected
        eyeTrackingData.noFaceDetectedTime += EYE_TRACKING_CONFIG.PROCESSING_INTERVAL;
        
        if (eyeTrackingData.noFaceDetectedTime > EYE_TRACKING_CONFIG.NO_FACE_THRESHOLD) {
            logSuspiciousActivity('no_face_detected', {
                duration: eyeTrackingData.noFaceDetectedTime,
                timestamp: currentTime
            });
            eyeTrackingData.noFaceDetectedTime = 0; // Reset to avoid spam
        }
        
        updateEyeTrackingStatus('No Face');
        } else if (faceCount > 1) {
        // Multiple faces detected
        eyeTrackingData.multipleFacesDetectedTime += EYE_TRACKING_CONFIG.PROCESSING_INTERVAL;
        
        if (eyeTrackingData.multipleFacesDetectedTime > 1000) { // 1 second
            logSuspiciousActivity('multiple_faces_detected', {
                faceCount: faceCount,
                timestamp: currentTime
            });
            eyeTrackingData.multipleFacesDetectedTime = 0;
        }
        
        updateEyeTrackingStatus(`${faceCount} Faces`);
        
    }else {
        // Single face detected - analyze gaze
        eyeTrackingData.noFaceDetectedTime = 0;
        eyeTrackingData.multipleFacesDetectedTime = 0;
        
        const face = faces.get(0);
        const gazeDirection = analyzeGaze(face, grayMat);
        
        if (gazeDirection !== 'center' && gazeDirection !== 'slight_left' && gazeDirection !== 'slight_right') {
            if (!eyeTrackingData.isLookingAway) {
                eyeTrackingData.isLookingAway = true;
                eyeTrackingData.lookAwayStartTime = currentTime;
            } else {
                const lookAwayDuration = currentTime - eyeTrackingData.lookAwayStartTime;
                if (lookAwayDuration > EYE_TRACKING_CONFIG.LOOK_AWAY_THRESHOLD) {
                    logSuspiciousActivity('looking_away_extended', {
                        direction: gazeDirection,
                        duration: lookAwayDuration,
                        timestamp: currentTime
                    });
                    eyeTrackingData.isLookingAway = false; // Reset
                }
            }
        }else {
            eyeTrackingData.isLookingAway = false;
            eyeTrackingData.lookAwayStartTime = null;
        }
        
        eyeTrackingData.lastValidGaze = gazeDirection;
        updateEyeTrackingStatus(`Face OK - ${gazeDirection}`);
    }
}
function analyzeGaze(faceRect, grayMat) {
    // Simple gaze estimation based on face position and eye detection
    const faceROI = grayMat.roi(faceRect);
    const eyes = new cv.RectVector();
    
    try {
        eyeClassifier.detectMultiScale(faceROI, eyes);
        
        if (eyes.size() >= 2) {
            // Basic gaze direction based on eye positions relative to face
            const leftEye = eyes.get(0);
            const rightEye = eyes.get(1);
            
            // Calculate relative positions (simplified)
            const faceCenter = faceRect.width / 2;
            const eyeCenterAvg = (leftEye.x + rightEye.x) / 2;
            const relativePosition = (eyeCenterAvg - faceCenter) / faceCenter;
            
            if (relativePosition > 0.3) return 'looking_right';
            if (relativePosition < -0.3) return 'looking_left';
            if (relativePosition > 0.15) return 'slight_right';
            if (relativePosition < -0.15) return 'slight_left';
            return 'center';
        }
        
        return 'unknown';
        
    } catch (error) {
        console.error('Gaze analysis error:', error);
        return 'error';
    } finally {
        faceROI.delete();
        eyes.delete();
    }
}

function logSuspiciousActivity(activityType, data) {
    console.warn('👁️ Suspicious activity detected:', activityType, data);
    
    // Send to backend
    sendEyeTrackingLog({
        type: activityType,
        data: data,
        examId: new URLSearchParams(window.location.search).get('examId'),
        timestamp: new Date().toISOString()
    });
    
    // Record as violation if severe enough
    if (activityType === 'looking_away_extended' && data.duration > 5000) {
        recordViolation(`Looking away for ${Math.round(data.duration/1000)} seconds`);
    } else if (activityType === 'multiple_faces_detected') {
        recordViolation('Multiple faces detected - possible assistance');
    } else if (activityType === 'no_face_detected') {
        recordViolation('Face not visible in camera');
    }
}

async function sendEyeTrackingLog(logData) {
    try {
        const token = getAuthToken();
        await fetch('/api/violations/eye-tracking', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(logData)
        });
    } catch (error) {
        console.error('Failed to send eye tracking log:', error);
    }
}

function updateEyeTrackingStatus(status) {
    const statusElement = document.getElementById('eyeStatus');
    if (statusElement) {
        statusElement.textContent = status;
    }
}
// Setup proctoring event listeners
function setupProctoringListeners() {
    // Fullscreen exit detection
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    
    // Tab switching detection
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Window blur detection
    window.addEventListener('blur', handleWindowBlur);
    
    // Keyboard and mouse restrictions
    document.addEventListener('contextmenu', preventRightClick);
    document.addEventListener('keydown', preventKeyboardShortcuts);
    document.addEventListener('mouseleave', handleMouseLeave);
    
    console.log('Proctoring event listeners setup for exam');
}

// Handle fullscreen changes
function handleFullscreenChange() {
    if (!isExamActive) return;
    
    const isFullscreen = document.fullscreenElement || 
                        document.webkitFullscreenElement || 
                        document.mozFullScreenElement || 
                        document.msFullscreenElement;
    
    if (!isFullscreen) {
        recordViolation('Exited fullscreen during exam');
        
        // Try to re-enter fullscreen
        setTimeout(() => {
            if (isExamActive) {
                enterFullscreen().catch(console.error);
            }
        }, 1000);
    }
}

// Handle tab switching
function handleVisibilityChange() {
    if (!isExamActive) return;
    
    if (document.hidden) {
        recordViolation('Tab switching detected during exam');
    }
}

// Handle window blur
function handleWindowBlur() {
    if (!isExamActive) return;
    
    recordViolation('Window focus lost during exam');
}

// Handle mouse leaving the exam area
function handleMouseLeave() {
    if (!isExamActive) return;
    
    recordViolation('Mouse left exam area');
}

// Prevent right-click
function preventRightClick(e) {
    if (!isExamActive) return;
    
    e.preventDefault();
    recordViolation('Right-click attempted during exam');
    return false;
}

// Prevent keyboard shortcuts
function preventKeyboardShortcuts(e) {
    if (!isExamActive) return;
    
    const blockedKeys = ['F12', 'F5', 'F11'];
    const blockedCombos = [
        { ctrl: true, key: 'c' }, { ctrl: true, key: 'v' }, { ctrl: true, key: 'x' },
        { ctrl: true, key: 'a' }, { ctrl: true, key: 'r' }, { ctrl: true, key: 'u' },
        { ctrl: true, key: 'i' }, { ctrl: true, key: 's' }, { ctrl: true, key: 'p' },
        { ctrl: true, shift: true, key: 'i' }, { ctrl: true, shift: true, key: 'j' },
        { ctrl: true, shift: true, key: 'c' }, { alt: true, key: 'Tab' }
    ];
    
    if (blockedKeys.includes(e.key)) {
        e.preventDefault();
        recordViolation(`Blocked key pressed: ${e.key}`);
        return false;
    }
    
    for (let combo of blockedCombos) {
        if (
            (combo.ctrl ? e.ctrlKey : true) &&
            (combo.shift ? e.shiftKey : !combo.shift) &&
            (combo.alt ? e.altKey : !combo.alt) &&
            e.key.toLowerCase() === combo.key.toLowerCase()
        ) {
            e.preventDefault();
            recordViolation(`Blocked shortcut attempted`);
            return false;
        }
    }
}

// Record violation - FIXED VERSION
function recordViolation(violationType) {
    violations++;
    console.warn(`Exam Violation ${violations}/${maxViolations}: ${violationType}`);
    
    // Show warning
    showViolationWarning(violationType);
    
    // Log to backend
    logViolation(violationType);
    
    // FIXED: Auto-submit if max violations reached
    if (violations >= maxViolations) {
        console.log('Maximum violations reached, triggering auto-submit');
        autoSubmitDueToViolations();
    }
}

// Show violation warning - ENHANCED VERSION
function showViolationWarning(violationType, isAutoSubmit = false) {
    const warningDiv = document.createElement('div');
    warningDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: ${violations >= maxViolations ? '#dc3545' : '#f39c12'};
        color: white;
        padding: 20px;
        border-radius: 8px;
        z-index: 10000;
        text-align: center;
        min-width: 400px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.5);
        border: 3px solid white;
    `;
    
    warningDiv.innerHTML = `
        <h4>⚠️ PROCTORING VIOLATION</h4>
        <p><strong>Violation:</strong> ${violationType}</p>
        <p><strong>Count:</strong> ${violations}/${maxViolations}</p>
        ${violations >= maxViolations ? 
            '<p style="color: #ffeb3b; font-weight: bold; font-size: 16px;">🚨 MAXIMUM VIOLATIONS REACHED! 🚨</p><p><strong>Your exam will be submitted automatically in 3 seconds!</strong></p>' : 
            '<p>Please follow exam rules to avoid automatic submission.</p>'
        }
        ${isAutoSubmit ? '<p style="color: #ffeb3b;">Submitting exam now...</p>' : ''}
    `;
    
    document.body.appendChild(warningDiv);
    
    // Keep warning visible longer for auto-submit
    const displayTime = violations >= maxViolations ? 8000 : 5000;
    
    setTimeout(() => {
        if (warningDiv.parentNode) {
            warningDiv.parentNode.removeChild(warningDiv);
        }
    }, displayTime);
}

// Log violation to backend
async function logViolation(violationType) {
    try {
        const token = getAuthToken();
        const urlParams = new URLSearchParams(window.location.search);
        const examId = urlParams.get('examId');
        
        await fetch('/api/violations/log', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                examId: examId,
                violationType: violationType,
                timestamp: new Date().toISOString(),
                violationCount: violations
            })
        });
    } catch (error) {
        console.error('Failed to log violation:', error);
    }
}


async function autoSubmitDueToViolations() {
    console.log('Auto-submitting exam due to maximum violations reached');
    
    // Immediately set exam as inactive to prevent further violations
    isExamActive = false;
    
    try {
        // Show final warning with auto-submit message
        showViolationWarning('Maximum violations reached', true);
        
        // Disable all user interactions immediately
        const examContainer = document.getElementById('examQuestions');
        if (examContainer) {
            examContainer.style.pointerEvents = 'none';
            examContainer.style.opacity = '0.5';
        }
        
        // Stop the exam timer
        if (examTimer) {
            clearInterval(examTimer);
            examTimer = null;
        }
        
        // UPDATED: End Zoom meeting before violation submit
        await endZoomMeeting();
        
        // Show alert to user
        alert('⚠️ MAXIMUM VIOLATIONS REACHED!\n\nYour exam will be submitted automatically due to proctoring violations.');
        
        // Clean up proctoring resources
        cleanupProctoring();
        
        // Wait a moment then submit
        setTimeout(async () => {
            try {
                await submitExam(true); // true indicates auto-submit due to violations
            } catch (error) {
                console.error('Auto-submit failed:', error);
                showError('Exam submission failed due to violations. Please contact support immediately.');
            }
        }, 3000);
        
    } catch (error) {
        console.error('Auto-submit due to violations failed:', error);
        showError('Exam submission failed due to violations. Please contact support immediately.');
    }
}
async function endZoomMeeting() {
    if (!zoomMeetingJoined) {
        return;
    }
    
    try {
        console.log('🔵 Ending Zoom meeting...');
        
        // Use Zoom SDK to leave meeting
        if (typeof window.zoomStudent !== 'undefined' && window.zoomStudent) {
            window.zoomStudent.leaveMeeting();
            console.log('✅ Left Zoom meeting successfully');
        }
        
        zoomMeetingJoined = false;
        zoomMeetingConfig = null;
        
    } catch (error) {
        console.error('❌ Error ending Zoom meeting:', error);
    }
}

// NEW: End Zoom meeting on backend
async function endZoomMeetingOnBackend(examId) {
    try {
        const token = getAuthToken();
        const response = await fetch(`/api/zoom/exam/${examId}/end-meeting`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            console.log('✅ Zoom meeting ended on backend');
        } else {
            console.warn('⚠️ Backend meeting end failed:', result.message);
        }
        
    } catch (error) {
        console.error('❌ Error ending meeting on backend:', error);
    }
}


// Handle auto-submit from violations (when redirected from student.js)
async function handleAutoSubmitFromViolations() {
    try {
        showLoading();
        
        const urlParams = new URLSearchParams(window.location.search);
        const examId = urlParams.get('examId');
        
        // Try to submit with current state
        const submissionData = {
            answers: [],
            userAnswers: {},
            submittedAt: new Date().toISOString(),
            timeTaken: 0,
            isAutoSubmit: true,
            violationSubmit: true,
            totalQuestions: 0,
            answeredQuestions: 0,
            proctoringData: {
                violationCount: maxViolations,
                submittedDueToViolations: true,
                proctoringEnabled: true
            }
        };
        
        const result = await apiCall(`/results/submit/${examId}`, {
            method: 'POST',
            body: JSON.stringify(submissionData)
        });
        
        if (result.success) {
            showError('Exam submitted due to proctoring violations. Your responses have been recorded.');
            setTimeout(() => {
                window.location.href = '/student-dashboard';
            }, 3000);
        }
        
    } catch (error) {
        console.error('Violation auto-submit failed:', error);
        showError('Exam submission failed. Please contact support.');
    }
}

// Enter fullscreen mode
function enterFullscreen() {
    return new Promise((resolve, reject) => {
        const elem = document.documentElement;
        
        const requestFullscreen = elem.requestFullscreen || 
                                 elem.webkitRequestFullscreen || 
                                 elem.msRequestFullscreen || 
                                 elem.mozRequestFullScreen;
        
        if (requestFullscreen) {
            requestFullscreen.call(elem)
                .then(resolve)
                .catch(reject);
        } else {
            resolve(); // Continue without fullscreen
        }
    });
}



function cleanupProctoring() {
    isExamActive = false;
    
    // UPDATED: End Zoom meeting if still active
    if (zoomMeetingJoined) {
        endZoomMeeting().catch(console.error);
    }
    
    // Stop webcam
    if (webcamStream) {
        webcamStream.getTracks().forEach(track => track.stop());
        webcamStream = null;
    }
    
    // Remove webcam element
    const webcamElement = document.getElementById('webcam');
    if (webcamElement) {
        webcamElement.remove();
    }
    
    // Remove event listeners
    document.removeEventListener('fullscreenchange', handleFullscreenChange);
    document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
    document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('blur', handleWindowBlur);
    document.removeEventListener('contextmenu', preventRightClick);
    document.removeEventListener('keydown', preventKeyboardShortcuts);
    document.removeEventListener('mouseleave', handleMouseLeave);
    
    // Exit fullscreen
    if (document.exitFullscreen) {
        document.exitFullscreen().catch(console.error);
    } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
    } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
    } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
    }
    
    console.log('Proctoring cleanup complete with Zoom meeting end');
}



// UPDATED: Enhanced submit exam function with automatic Zoom meeting end
async function submitExam(isAutoSubmit = false) {
    if (!isAutoSubmit) {
        const unansweredCount = Object.values(userAnswers).filter(answer => 
            answer === null || answer === undefined
        ).length;
        
        if (unansweredCount > 0) {
            const confirmSubmit = confirm(`You have ${unansweredCount} unanswered questions. Are you sure you want to submit?`);
            if (!confirmSubmit) return;
        }
    }
    
    try {
        showLoading();
        
        // Stop exam timer
        if (examTimer) {
            clearInterval(examTimer);
            examTimer = null;
        }
        
        // UPDATED: End Zoom meeting before cleaning up proctoring
        await endZoomMeeting();
        
        // Clean up proctoring
        cleanupProctoring();
        
        const examDuration = examStartTime ? Math.floor((new Date() - examStartTime) / 1000) : 0;
        const answersArray = convertAnswersToArray();
        
        const answeredQuestions = answersArray.filter(answer => 
            answer.isAnswered && 
            answer.selectedOption !== null && 
            answer.selectedOption !== undefined && 
            answer.selectedOption !== -1
        ).length;
        
        // Enhanced submission data with proctoring info
        const submissionData = {
            answers: answersArray,
            userAnswers: userAnswers,
            submittedAt: new Date().toISOString(),
            timeTaken: examDuration,
            isAutoSubmit: isAutoSubmit,
            totalQuestions: questions.length,
            answeredQuestions: answeredQuestions,
            // Proctoring data
            proctoringData: {
                violationCount: violations,
                submittedDueToViolations: isAutoSubmit && violations >= maxViolations,
                proctoringEnabled: proctoringEnabled,
                zoomMeetingUsed: zoomMeetingJoined
            }
        };
        
        console.log('Submitting exam with proctoring data:', submissionData);
        
        const urlParams = new URLSearchParams(window.location.search);
        const examId = urlParams.get('examId');
        
        const result = await apiCall(`/results/submit/${examId}`, {
            method: 'POST',
            body: JSON.stringify(submissionData)
        });
        
        console.log('Submission result:', result);
        
        if (result.success) {
            // UPDATED: End Zoom meeting on backend after successful submission
            await endZoomMeetingOnBackend(examId);
            
            setTimeout(async () => {
                try {
                    await showResultsForSubmittedExam(examId);
                } catch (error) {
                    console.error('Error loading results after submission:', error);
                    showSubmissionSuccess(result.data);
                }
            }, 2000);
        } else {
            throw new Error(result.message || 'Submission failed');
        }
        
    } catch (error) {
        console.error('Submit exam error:', error);
        showError('Failed to submit exam: ' + error.message);
        
        if (!isAutoSubmit && timeRemaining > 0) {
            startTimer();
        }
    } finally {
        hideLoading();
    }
}

// UPDATED: Auto-submit exam when time runs out with Zoom meeting end
async function autoSubmitExam() {
    console.log('Auto-submitting exam due to time expiry');
    
    // Set exam as inactive
    isExamActive = false;
    
    alert('Time has expired! The exam will be submitted automatically.');
    
    try {
        // UPDATED: End Zoom meeting before auto-submit
        await endZoomMeeting();
        
        await submitExam(true);
    } catch (error) {
        console.error('Auto-submit failed:', error);
        showError('Time expired and auto-submit failed. Please try submitting manually.');
    }
}




window.addEventListener('beforeunload', async (event) => {
    if (isExamActive && currentExam && timeRemaining > 0) {
        // End Zoom meeting before page unload
        if (zoomMeetingJoined) {
            await endZoomMeeting();
        }
        
        cleanupProctoring();
        event.preventDefault();
        event.returnValue = 'You have a proctored exam in progress. Are you sure you want to leave?';
        return event.returnValue;
    }
});
// API Base URL
const API_BASE_URL = '/api';

// Helper function to get auth token
function getAuthToken() {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
}

// Helper function to make authenticated API calls
async function apiCall(endpoint, options = {}) {
    const token = getAuthToken();
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        }
    };

    const mergedOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, mergedOptions);
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Request failed' }));
        throw new Error(errorData.message || `HTTP ${response.status}`);
    }
    
    return response.json();
}

// Check if exam was already submitted and get results
async function checkExamSubmissionStatus(examId) {
    try {
        const response = await apiCall(`/results/exam/${examId}`);
        if (response.success && response.data) {
            return {
                isSubmitted: true,
                result: response.data
            };
        }
        return { isSubmitted: false };
    } catch (error) {
        console.log('Could not check submission status:', error.message);
        return { isSubmitted: false };
    }
}

// Load exam data from API
async function loadExam(examId) {
    try {
        showLoading();
        
        const data = await apiCall(`/questions/exam/${examId}`);
        
        if (data.success && data.data.questions && data.data.questions.length > 0) {
            currentExam = data.data.exam;
            questions = data.data.questions;
            
            userAnswers = {};
            questions.forEach(question => {
                userAnswers[question._id] = null;
            });
            
            console.log('Loaded exam:', currentExam);
            console.log('Loaded questions:', questions.length);
            console.log('Initialized userAnswers:', userAnswers);
            
            displayExam();
        } else {
            throw new Error('No questions found for this exam');
        }

        if (data.success && data.data.questions && data.data.questions.length > 0) {
       currentExam = data.data.exam;
       questions = data.data.questions;
    
       // DEBUG: Add this line to see what data you're getting
        debugQuestionData(questions);
    
        userAnswers = {};
        questions.forEach(question => {
        userAnswers[question._id] = null;
        });
    
      // ... rest of your existing code
        }
    } catch (error) {
        console.error('Load exam error:', error);
        throw error;
    }
}

// Display exam interface
function displayExam() {
    hideLoading();
    hideError();
    
    const examInfoElement = document.getElementById('examInfo');
    if (examInfoElement) {
        examInfoElement.style.display = 'block';
        
        const examTitleElement = document.getElementById('examTitle');
        const examCategoryElement = document.getElementById('examCategory');
        const examDurationElement = document.getElementById('examDuration');
        const totalQuestionsElement = document.getElementById('totalQuestions');
        
        if (examTitleElement) examTitleElement.textContent = currentExam.title;
        if (examCategoryElement) examCategoryElement.textContent = currentExam.category;
        if (examDurationElement) examDurationElement.textContent = `${currentExam.duration} minutes`;
        if (totalQuestionsElement) totalQuestionsElement.textContent = `${questions.length} questions`;
    }
    
    const examQuestionsElement = document.getElementById('examQuestions');
    if (examQuestionsElement) {
        examQuestionsElement.style.display = 'block';
    }
    
    renderQuestions();
    updateProgress();
    
    timeRemaining = currentExam.duration * 60;
    examStartTime = new Date();
    startTimer();
}

// Render all questions
function renderQuestions() {
    const container = document.getElementById('questionsContainer');
    if (!container) {
        console.error('Questions container not found');
        return;
    }
    
    container.innerHTML = '';
    
    questions.forEach((question, index) => {
        const questionElement = createQuestionElement(question, index);
        container.appendChild(questionElement);
    });
}


function createQuestionElement(question, index) {
    const questionDiv = document.createElement('div');
    questionDiv.className = 'question-container';
    questionDiv.setAttribute('data-question-id', question._id);
    
    let optionsHTML = '';
    question.options.forEach((option, optionIndex) => {
        const isSelected = userAnswers[question._id] === optionIndex;
        optionsHTML += `
            <div class="option-container">
                <label class="option-label">
                    <input type="radio" 
                           name="question_${question._id}" 
                           value="${optionIndex}"
                           data-question-id="${question._id}"
                           data-option-index="${optionIndex}"
                           ${isSelected ? 'checked' : ''}>
                    <span class="option-text">${option}</span>
                </label>
            </div>
        `;
    });
    
    // FIXED: Build question content - handle both text and image correctly
    let questionContent = '';
    
    // Check for question text - use the correct property from your backend
    const questionText = question.text || '';
    
    // Add text if it exists and is not empty
    if (questionText && questionText.trim()) {
        questionContent += `<div class="question-text">${questionText}</div>`;
    }
    
    // FIXED: Check for image URL - your backend uses 'photoUrl' property
    // Based on your controller code, the property is 'photoUrl'
    const imageUrl = question.photoUrl || '';
    
    // Add image if it exists and is not empty
    if (imageUrl && imageUrl.trim()) {
        console.log('Processing image URL:', imageUrl);
        
        // FIXED: Handle the URL correctly based on your upload configuration
        // Your questionRoutes.js returns URLs like `/uploads/questions/${filename}`
        let fullImageUrl;
        
        if (imageUrl.startsWith('/uploads/')) {
            // URL is already complete (this is what your backend returns)
            fullImageUrl = imageUrl;
        } else if (imageUrl.startsWith('http')) {
            // External URL
            fullImageUrl = imageUrl;
        } else {
            // Filename only - construct the full path
            fullImageUrl = `/uploads/questions/${imageUrl}`;
        }
        
        console.log('Full image URL:', fullImageUrl);
        
        questionContent += `
            <div class="question-image">
                <img src="${fullImageUrl}" 
                     alt="Question ${index + 1} Image" 
                     style="max-width: 100%; height: auto; border-radius: 8px; margin: 10px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.1); cursor: pointer;"
                     onclick="openImageModal('${fullImageUrl}', 'Question ${index + 1} Image')"
                     onerror="handleImageError(this, '${imageUrl}')"
                     onload="console.log('Image loaded successfully:', this.src)">
            </div>
        `;
    }
    
    // FIXED: Only show "not available" if BOTH text and image are empty
    if ((!questionText || !questionText.trim()) && (!imageUrl || !imageUrl.trim())) {
        questionContent = '<div class="question-text" style="color: #dc3545;">⚠️ Question content not available</div>';
    }
    
    questionDiv.innerHTML = `
        <div class="question-header">
            <h3>Question ${index + 1}</h3>
            <span class="question-points">${question.points || 1} point(s)</span>
        </div>
        ${questionContent}
        <div class="options-container">
            ${optionsHTML}
        </div>
    `;
    
    return questionDiv;
}

// FIXED: Enhanced image error handling with better debugging
function handleImageError(img, originalUrl) {
    console.error('Failed to load image:', img.src, 'Original URL:', originalUrl);
    
    // If we've already tried alternatives, don't try again
    if (img.dataset.hasTriedAlternatives === 'true') {
        showImagePlaceholder(img, originalUrl);
        return;
    }
    
    // Try multiple URL formats based on your setup
    const alternatives = [
        originalUrl, // Try original first (in case it's already correct)
        `/uploads/questions/${originalUrl}`, // Your configured upload path
        originalUrl.startsWith('/') ? originalUrl : `/${originalUrl}`, // Try as relative path
        `/uploads/${originalUrl}`, // Alternative upload path
        `./uploads/questions/${originalUrl}` // Relative to current directory
    ];
    
    let attemptIndex = 0;
    
    function tryNextUrl() {
        if (attemptIndex < alternatives.length) {
            const nextUrl = alternatives[attemptIndex];
            console.log(`Trying alternative URL ${attemptIndex + 1}:`, nextUrl);
            
            // Create a temporary image to test the URL
            const testImg = new Image();
            testImg.onload = function() {
                console.log('Successfully loaded alternative URL:', nextUrl);
                img.src = nextUrl;
                img.dataset.hasTriedAlternatives = 'true';
            };
            testImg.onerror = function() {
                attemptIndex++;
                tryNextUrl();
            };
            testImg.src = nextUrl;
        } else {
            // All attempts failed, show placeholder
            console.error('All image URL attempts failed for:', originalUrl);
            img.dataset.hasTriedAlternatives = 'true';
            showImagePlaceholder(img, originalUrl);
        }
    }
    
    tryNextUrl();
}

// Helper function to show image placeholder
function showImagePlaceholder(img, originalUrl) {
    // Hide the broken image
    img.style.display = 'none';
    
    // Create a placeholder if it doesn't already exist
    if (!img.parentNode.querySelector('.image-placeholder')) {
        const placeholder = document.createElement('div');
        placeholder.className = 'image-placeholder';
        placeholder.style.cssText = `
            padding: 20px;
            border: 2px dashed #ccc;
            border-radius: 8px;
            text-align: center;
            color: #666;
            margin: 10px 0;
            background-color: #f9f9f9;
        `;
        placeholder.innerHTML = `
            <div style="font-size: 24px; margin-bottom: 10px;">🖼️</div>
            <div>Image could not be loaded</div>
            <div style="font-size: 12px; margin-top: 5px; color: #999;">
                Original: ${originalUrl}<br>
                Attempted: ${img.src}
            </div>
        `;
        
        // Insert placeholder after the image
        img.parentNode.insertBefore(placeholder, img.nextSibling);
    }
}

// Add image modal functionality
function openImageModal(imageUrl, altText) {
    // Create modal overlay
    const modalOverlay = document.createElement('div');
    modalOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        z-index: 10001;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
    `;
    
    // Create modal content
    modalOverlay.innerHTML = `
        <div style="position: relative; max-width: 90%; max-height: 90%;">
            <img src="${imageUrl}" 
                 alt="${altText}" 
                 style="max-width: 100%; max-height: 100%; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.5);">
            <button onclick="closeImageModal()" 
                    style="position: absolute; top: -10px; right: -10px; width: 30px; height: 30px; border-radius: 50%; background: white; border: none; font-size: 16px; cursor: pointer; box-shadow: 0 2px 10px rgba(0,0,0,0.3);">
                ×
            </button>
        </div>
    `;
    
    // Add click to close functionality
    modalOverlay.addEventListener('click', function(e) {
        if (e.target === modalOverlay) {
            document.body.removeChild(modalOverlay);
        }
    });
    
    // Add to body
    document.body.appendChild(modalOverlay);
    
    // Global close function
    window.closeImageModal = function() {
        if (modalOverlay.parentNode) {
            modalOverlay.parentNode.removeChild(modalOverlay);
        }
    };
    
    // Close with Escape key
    const escapeHandler = function(e) {
        if (e.key === 'Escape') {
            window.closeImageModal();
            document.removeEventListener('keydown', escapeHandler);
        }
    };
    document.addEventListener('keydown', escapeHandler);
}

// Enhanced debug function to check question data structure
function debugQuestionData(questions) {
    console.log('=== DEBUGGING QUESTION DATA ===');
    console.log('Total questions:', questions.length);
    
    questions.forEach((question, index) => {
        console.log(`Question ${index + 1}:`, {
            id: question._id,
            text: question.text,
            photoUrl: question.photoUrl, // This is the correct property from your backend
            type: question.type,
            options: question.options,
            correctAnswer: question.correctAnswer,
            allProperties: Object.keys(question)
        });
        
        const hasImage = !!(question.photoUrl);
        const hasText = !!(question.text);
        
        console.log(`Question ${index + 1} validation:`, {
            hasText: hasText,
            hasImage: hasImage,
            textContent: question.text || 'none',
            textLength: (question.text || '').length,
            photoUrl: question.photoUrl || 'none',
            status: !hasText && !hasImage ? '❌ NO CONTENT' : '✅ OK'
        });
        
        // Test image URL construction
        if (hasImage) {
            const imageUrl = question.photoUrl;
            console.log(`Image URL for Question ${index + 1}:`, {
                original: imageUrl,
                constructed: imageUrl.startsWith('/uploads/') ? imageUrl : `/uploads/questions/${imageUrl}`,
                startsWithSlash: imageUrl.startsWith('/'),
                startsWithUploads: imageUrl.startsWith('/uploads/')
            });
        }
    });
    
    console.log('=== END DEBUG ===');
}

// ADDITIONAL DEBUGGING: Add this function to test image loading
function testImageLoad(imageUrl) {
    console.log('Testing image URL:', imageUrl);
    const testImg = new Image();
    testImg.onload = function() {
        console.log('✅ Image loads successfully:', imageUrl);
    };
    testImg.onerror = function() {
        console.log('❌ Image failed to load:', imageUrl);
    };
    testImg.src = imageUrl;
}




// Create individual question element - UPDATED to support images
// Create individual question element - UPDATED to properly support images

// Handle answer selection
function selectAnswer(questionId, optionIndex) {
    const selectedOption = parseInt(optionIndex);
    userAnswers[questionId] = selectedOption;
    updateProgress();
    
    console.log(`Selected option ${selectedOption} for question ${questionId}`);
    console.log('Current userAnswers:', userAnswers);
}


// Update progress display
function updateProgress() {
    const answeredCount = Object.values(userAnswers).filter(answer => 
        answer !== null && answer !== undefined
    ).length;
    const totalQuestions = questions.length;
    
    const progressElement = document.getElementById('examProgress');
    if (progressElement) {
        progressElement.textContent = `${answeredCount}/${totalQuestions} questions answered`;
    }
    
    const progressTextElement = document.getElementById('progressText');
    if (progressTextElement) {
        progressTextElement.textContent = `Questions Answered: ${answeredCount}/${totalQuestions}`;
    }
    
    const remainingElement = document.getElementById('remainingQuestions');
    if (remainingElement) {
        const remaining = totalQuestions - answeredCount;
        remainingElement.textContent = `${remaining} questions remaining`;
    }
    
    const progressBar = document.getElementById('progressBar');
    if (progressBar) {
        const percentage = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;
        progressBar.style.width = `${percentage}%`;
    }
}

// Convert answers to array format
function convertAnswersToArray() {
    const answersArray = [];
    
    questions.forEach(question => {
        const selectedOption = userAnswers[question._id];
        
        const hasValidAnswer = selectedOption !== null && 
                             selectedOption !== undefined && 
                             !isNaN(selectedOption);
        
        answersArray.push({
            questionId: question._id,
            selectedOption: hasValidAnswer ? parseInt(selectedOption) : -1,
            isAnswered: hasValidAnswer
        });
    });
    
    console.log('Converted answers array:', answersArray);
    return answersArray;
}

// Start exam timer
function startTimer() {
    if (examTimer) {
        clearInterval(examTimer);
    }
    
    updateTimerDisplay();
    
    examTimer = setInterval(() => {
        timeRemaining--;
        updateTimerDisplay();
        
        if (timeRemaining === 300) {
            alert('Warning: 5 minutes remaining!');
        }
        
        if (timeRemaining === 60) {
            alert('Warning: 1 minute remaining!');
        }
        
        if (timeRemaining <= 0) {
            clearInterval(examTimer);
            examTimer = null;
            autoSubmitExam(); // This will now work correctly
        }
    }, 1000);
}

// Update timer display
function updateTimerDisplay() {
    const hours = Math.floor(timeRemaining / 3600);
    const minutes = Math.floor((timeRemaining % 3600) / 60);
    const seconds = timeRemaining % 60;
    
    const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    const timerElement = document.getElementById('examTimer');
    if (timerElement) {
        timerElement.textContent = timeString;
    }
    
    const timerDisplayElement = document.getElementById('timerDisplay');
    if (timerDisplayElement) {
        timerDisplayElement.textContent = `Time Remaining: ${timeString}`;
    }
    
    if (timeRemaining <= 300) {
        if (timerElement) timerElement.style.color = 'red';
        if (timerDisplayElement) timerDisplayElement.style.color = 'red';
    } else if (timeRemaining <= 600) {
        if (timerElement) timerElement.style.color = 'orange';
        if (timerDisplayElement) timerDisplayElement.style.color = 'orange';
    }
}

// Show results for already submitted exam
async function showResultsForSubmittedExam(examId) {
    try {
        showLoading();
        const resultData = await apiCall(`/results/exam/${examId}`);
        
        console.log('Received result data from API:', resultData);
        
        if (resultData.success && resultData.data) {
            showExamResults(resultData.data);
        } else {
            throw new Error('Could not load exam results');
        }
    } catch (error) {
        console.error('Error loading results:', error);
        showAlreadySubmittedMessage();
    }
}

// Display exam results
function showExamResults(resultData) {
    hideLoading();
    hideError();
    
    console.log('Displaying results with data:', resultData);
    
    const examInfoElement = document.getElementById('examInfo');
    const examQuestionsElement = document.getElementById('examQuestions');
    
    if (examInfoElement) examInfoElement.style.display = 'none';
    if (examQuestionsElement) examQuestionsElement.style.display = 'none';
    
    const resultsElement = document.getElementById('examResults') || createResultsElement();
    resultsElement.style.display = 'block';
    
    const score = (resultData.score !== null && 
                  resultData.score !== undefined && 
                  !isNaN(resultData.score)) ? parseInt(resultData.score) : 0;
                  
    const totalQuestions = (resultData.totalQuestions !== null && 
                           resultData.totalQuestions !== undefined && 
                           !isNaN(resultData.totalQuestions)) ? parseInt(resultData.totalQuestions) : 0;
    
    let percentage = 0;
    if (totalQuestions > 0 && score >= 0) {
        percentage = ((score / totalQuestions) * 100).toFixed(2);
    }
    
    const status = parseFloat(percentage) >= 60 ? 'PASSED' : 'FAILED';
    
    let submittedDate = 'Unknown';
    if (resultData.submittedAt) {
        try {
            submittedDate = new Date(resultData.submittedAt).toLocaleString();
        } catch (error) {
            console.error('Date parsing error:', error);
            submittedDate = 'Invalid Date';
        }
    }
    
    const timeTaken = parseInt(resultData.timeTaken) || 0;
    
    // Include proctoring information in results
    const proctoringData = resultData.proctoringData || {};
  /*  const violationInfo = proctoringData.violationCount > 0 ? `
        <div class="alert alert-warning">
            <strong>Proctoring Notice:</strong> ${proctoringData.violationCount} violation(s) detected during exam.
            ${proctoringData.submittedDueToViolations ? ' <strong>Exam was auto-submitted due to violations.</strong>' : ''}
        </div>
    ` : '';*/
    const wasViolationSubmit = resultData.wasViolationSubmit || proctoringData.submittedDueToViolations;
const violationInfo = proctoringData.violationCount > 0 || wasViolationSubmit ? `
    <div class="alert ${wasViolationSubmit ? 'alert-danger' : 'alert-warning'}">
        <strong>⚠️ Proctoring Notice:</strong> 
        ${proctoringData.violationCount || 0} violation(s) detected during exam.
        ${wasViolationSubmit ? 
            ' <strong>🚨 This exam was automatically submitted due to multiple proctoring violations.</strong>' : 
            ''}
        ${proctoringData.proctoringEnabled ? ' Enhanced monitoring was active.' : ''}
    </div>
` : '';
    
    resultsElement.innerHTML = `
        <div class="results-container">
            <div class="results-header">
                <h1>📊 Exam Results</h1>
                <div class="status-badge ${status.toLowerCase()}">${status}</div>
            </div>
            
            ${violationInfo}
            
            <div class="results-summary">
                <div class="score-display">
                    <div class="score-circle">
                        <span class="score-number">${score}</span>
                        <span class="score-total">/${totalQuestions}</span>
                    </div>
                    <div class="percentage">${percentage}%</div>
                </div>
                
                <div class="result-details">
                    <div class="detail-item">
                        <label>Exam:</label>
                        <span>${resultData.examTitle || 'N/A'}</span>
                    </div>
                    <div class="detail-item">
                        <label>Category:</label>
                        <span>${resultData.examCategory || 'N/A'}</span>
                    </div>
                    <div class="detail-item">
                        <label>Total Questions:</label>
                        <span>${totalQuestions}</span>
                    </div>
                    <div class="detail-item">
                        <label>Correct Answers:</label>
                        <span>${score}</span>
                    </div>
                    <div class="detail-item">
                        <label>Wrong Answers:</label>
                        <span>${Math.max(0, totalQuestions - score)}</span>
                    </div>
                    <div class="detail-item">
                        <label>Submitted At:</label>
                        <span>${submittedDate}</span>
                    </div>
                    <div class="detail-item">
                        <label>Time Taken:</label>
                        <span>${formatDuration(timeTaken)}</span>
                    </div>
                    ${wasViolationSubmit ? `
    <div class="detail-item violation-submit">
        <label>Submission Type:</label>
        <span style="color: #dc3545; font-weight: bold;">
            🚨 Auto-submitted due to violations
        </span>
    </div>
` : `
    <div class="detail-item">
        <label>Submission Type:</label>
        <span>${resultData.isAutoSubmit ? 'Auto-submitted (Time expired)' : 'Manual submission'}</span>
    </div>
`}

                </div>
            </div>
            
            ${resultData.questions && Array.isArray(resultData.questions) && resultData.questions.length > 0 ? `
                <div class="detailed-results">
                    <h3>Question-wise Results</h3>
                    <div class="questions-review">
                        ${resultData.questions.map((q, index) => {
                            const isCorrect = q.isCorrect === true;
                            const selectedOptionText = (q.selectedOption !== null && 
                                                       q.selectedOption !== undefined && 
                                                       q.options && 
                                                       q.options[q.selectedOption]) 
                                                     ? q.options[q.selectedOption] 
                                                     : 'Not answered';
                            const correctOptionText = (q.correctAnswer !== null && 
                                                      q.correctAnswer !== undefined && 
                                                      q.options && 
                                                      q.options[q.correctAnswer]) 
                                                     ? q.options[q.correctAnswer] 
                                                     : 'N/A';
                            
                            return `
                                <div class="question-result ${isCorrect ? 'correct' : 'incorrect'}">
                                    <div class="question-header">
                                        <span class="question-number">Q${index + 1}</span>
                                        <span class="result-icon">${isCorrect ? '✅' : '❌'}</span>
                                    </div>
                                    <div class="question-text">${q.question || 'Question text not available'}</div>
                                    <div class="answer-comparison">
                                        <div class="your-answer">
                                            <strong>Your Answer:</strong> ${selectedOptionText}
                                        </div>
                                        <div class="correct-answer">
                                            <strong>Correct Answer:</strong> ${correctOptionText}
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            ` : `
                <div class="no-details">
                    <p>Detailed question results are not available.</p>
                </div>
            `}
            
            <div class="results-actions">
                <button onclick="printResults()" class="btn btn-secondary">🖨️ Print Results</button>
                <button onclick="goToDashboard()" class="btn btn-primary">📋 Back to Dashboard</button>
                <button onclick="takeAnotherExam()" class="btn btn-outline">📝 Take Another Exam</button>
            </div>
        </div>
    `;
}

// Create results element
function createResultsElement() {
    const resultsElement = document.createElement('div');
    resultsElement.id = 'examResults';
    resultsElement.className = 'exam-results';
    resultsElement.style.display = 'none';
    document.body.appendChild(resultsElement);
    return resultsElement;
}

// Show message for already submitted exam
function showAlreadySubmittedMessage() {
    hideLoading();
    hideError();
    
    const examQuestionsElement = document.getElementById('examQuestions');
    const examInfoElement = document.getElementById('examInfo');
    
    if (examQuestionsElement) examQuestionsElement.style.display = 'none';
    if (examInfoElement) examInfoElement.style.display = 'none';
    
    const messageElement = document.getElementById('alreadySubmittedMessage') || createAlreadySubmittedElement();
    messageElement.style.display = 'block';
    
    messageElement.innerHTML = `
        <div class="already-submitted-container">
            <div class="message-icon">📝</div>
            <h2>Exam Already Submitted</h2>
            <div class="message-content">
                <p>You have already submitted this exam.</p>
                <p>Your results should be available shortly.</p>
            </div>
            <div class="action-buttons">
                <button onclick="retryLoadResults()" class="btn btn-primary">🔄 Try Loading Results</button>
                <button onclick="goToDashboard()" class="btn btn-secondary">📋 Back to Dashboard</button>
                <button onclick="contactSupport()" class="btn btn-outline">📞 Contact Support</button>
            </div>
        </div>
    `;
}

// Create already submitted message element
function createAlreadySubmittedElement() {
    const messageElement = document.createElement('div');
    messageElement.id = 'alreadySubmittedMessage';
    messageElement.className = 'already-submitted-message';
    messageElement.style.display = 'none';
    document.body.appendChild(messageElement);
    return messageElement;
}

// Show submission success
function showSubmissionSuccess(resultData) {
    const examQuestionsElement = document.getElementById('examQuestions');
    const examInfoElement = document.getElementById('examInfo');
    
    if (examQuestionsElement) examQuestionsElement.style.display = 'none';
    if (examInfoElement) examInfoElement.style.display = 'none';
    
    const successElement = document.getElementById('submissionSuccess') || createSuccessElement();
    successElement.style.display = 'block';
    
    successElement.innerHTML = `
        <div class="success-container">
            <h2>✅ Exam Submitted Successfully!</h2>
            <div class="submission-details">
                <p><strong>Submission ID:</strong> ${resultData.submissionId || 'Generated'}</p>
                <p><strong>Total Questions:</strong> ${resultData.totalQuestions || questions.length}</p>
                <p><strong>Questions Answered:</strong> ${resultData.answeredQuestions || Object.values(userAnswers).filter(a => a !== null).length}</p>
                <p><strong>Submitted At:</strong> ${new Date(resultData.submittedAt || Date.now()).toLocaleString()}</p>
                <p><strong>Time Taken:</strong> ${formatDuration(resultData.timeTaken || 0)}</p>
            </div>
            <div class="action-buttons">
                <button onclick="retryLoadResults()" class="btn btn-primary">View Results</button>
                <button onclick="goToDashboard()" class="btn btn-secondary">Back to Dashboard</button>
            </div>
        </div>
    `;
}

// Create success element
function createSuccessElement() {
    const successElement = document.createElement('div');
    successElement.id = 'submissionSuccess';
    successElement.style.display = 'none';
    successElement.className = 'submission-success';
    document.body.appendChild(successElement);
    return successElement;
}

// Retry loading results
async function retryLoadResults() {
    const urlParams = new URLSearchParams(window.location.search);
    const examId = urlParams.get('examId');
    
    if (examId) {
        try {
            showLoading();
            await showResultsForSubmittedExam(examId);
        } catch (error) {
            showError('Still unable to load results. Please try again later or contact support.');
        }
    }
}

// Navigation and utility functions
function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
        return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
        return `${minutes}m ${secs}s`;
    } else {
        return `${secs}s`;
    }
}

function printResults() {
    window.print();
}

function goToDashboard() {
    window.location.href = '/student-dashboard';
}

function takeAnotherExam() {
    window.location.href = '/student-dashboard';
}

function contactSupport() {
    window.location.href = '/support.html';
}

function toggleDebugInfo() {
    const debugInfo = document.querySelector('.debug-info');
    if (debugInfo) {
        debugInfo.style.display = debugInfo.style.display === 'none' ? 'block' : 'none';
    }
}

// Utility functions for UI
function showLoading() {
    const loadingElement = document.getElementById('loadingSection');
    if (loadingElement) {
        loadingElement.style.display = 'block';
    }
}

function hideLoading() {
    const loadingElement = document.getElementById('loadingSection');
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }
}

function showError(message) {
    const errorElement = document.getElementById('errorSection');
    const errorMessage = document.getElementById('errorMessage');
    if (errorElement && errorMessage) {
        errorMessage.textContent = message;
        errorElement.style.display = 'block';
    } else {
        alert('Error: ' + message);
    }
}

function hideError() {
    const errorElement = document.getElementById('errorSection');
    if (errorElement) {
        errorElement.style.display = 'none';
    }
}

// Event delegation for radio button clicks
function setupEventListeners() {
    document.addEventListener('change', function(event) {
        if (event.target.type === 'radio' && event.target.name.startsWith('question_')) {
            const questionId = event.target.getAttribute('data-question-id');
            const optionIndex = event.target.getAttribute('data-option-index');
            
            if (questionId && optionIndex !== null) {
                selectAnswer(questionId, optionIndex);
            }
        }
    });
    
    const submitButton = document.getElementById('submitExam');
    if (submitButton) {
        submitButton.addEventListener('click', () => submitExam(false));
    }
    
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) {
        submitBtn.addEventListener('click', () => submitExam(false));
    }
}

// Expose functions to global scope for debugging and external access
window.examDebug = {
    userAnswers,
    questions,
    currentExam,
    timeRemaining,
    updateProgress,
    updateTimerDisplay,
    convertAnswersToArray,
    toggleDebugInfo,
    // Proctoring debug info
    violations,
    maxViolations,
    isExamActive,
    proctoringEnabled,
    cleanupProctoring,
    recordViolation
};


window.examProctoring = {
    violations,
    maxViolations,
    isExamActive,
    proctoringEnabled,
    recordViolation,
    cleanupProctoring,
    autoSubmitDueToViolations,
    initializeProctoring,
    setupProctoringListeners,
    // UPDATED: Add Zoom meeting debug info
    zoomMeetingJoined,
    zoomMeetingConfig,
    endZoomMeeting,
    autoStartZoomMeeting,
    autoJoinZoomMeeting
};




