// =====================================================
// Sun + Flower (Tilt-controlled Start/Pause; Y-axis brighten)
// - Top: sunshine.gif; Bottom: flowers.gif
// - Y-axis (left-right tilt) brightens the screen (black veil fades)
// - Start when tilted right (~60%); pause (hide) when tilted left/flat (~35%)
// - Uses robust sensor strategy (deviceorientation + p5 fallback + swipe fallback)
// =====================================================

const SUN_GIF    = 'sunshine.gif';
const FLOWER_GIF = 'flowers.gif';

let sunEl, flowerEl;
let sunBox = { x:0, y:0, w:0, h:0 };
let flowerBox = { x:0, y:0, w:0, h:0 };

// Sensor state
let sensorsEnabled = false;
let gammaY = null;     // deviceorientation.gamma (-90..90)
let haveGamma = false;

// Brightness values
let brightness = 0;
const BRIGHT_EASE   = 1.2;
const DIM_ALPHA_MAX = 190;

// Finger-swipe fallback
let pointerT = 0.0;
let pointerActive = false;

// Playback control (right tilt = start, left/flat = pause)
// Adjusted thresholds to make flower appear earlier
let isPlaying = false;
const START_T = 0.35; // earlier start threshold
const STOP_T  = 0.35; // same pause threshold

function getTiltY() {
  if (haveGamma && typeof gammaY === 'number') {
    return constrain(gammaY, -45, 45);
  }
  if (typeof rotationY === 'number') {
    return constrain(rotationY, -45, 45);
  }
  return (pointerActive ? (pointerT * 90 - 45) : 0);
}

function hideBtnIfReady() {
  if (sensorsEnabled) {
    const btn = document.getElementById('enableMotionBtn');
    if (btn) btn.classList.add('hidden');
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  noStroke();
  textFont('system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial');

  // Sunshine at top
  sunEl = createImg(SUN_GIF, 'sunshine');
  sunEl.style('position', 'fixed');
  sunEl.style('z-index', '1');
  sunEl.style('pointer-events', 'none');

  // Flower at bottom (initially hidden)
  flowerEl = createImg(FLOWER_GIF, 'flower');
  flowerEl.style('position', 'fixed');
  flowerEl.style('z-index', '2');
  flowerEl.style('pointer-events', 'none');
  flowerEl.style('opacity', '0');

  sunEl.elt.addEventListener('load', layoutUI);
  flowerEl.elt.addEventListener('load', layoutUI);
  layoutUI();

  // Enable Motion button
  const btn = document.getElementById('enableMotionBtn');
  btn.classList.remove('hidden');
  btn.addEventListener('click', () => {
    requestMotionPermission().then(() => hideBtnIfReady());
  });

  // Also request on user gesture (for Android)
  window.addEventListener('touchstart', () => { requestMotionPermission().then(hideBtnIfReady); }, { passive:false });
  window.addEventListener('mousedown',  () => { requestMotionPermission().then(hideBtnIfReady); });

  // Sensor listeners
  window.addEventListener('deviceorientation', (e) => {
    if (e && typeof e.gamma === 'number') {
      gammaY = e.gamma;
      haveGamma = true;
      sensorsEnabled = true;
      hideBtnIfReady();
    }
  }, { passive:true });

  window.addEventListener('devicemotion', () => {
    sensorsEnabled = true;
    hideBtnIfReady();
  }, { passive:true });

  lockGestures();
}

function draw() {
  clear();

  // Convert Y tilt to normalized [0..1]
  let yDeg = getTiltY();
  let t = map(yDeg, -45, 45, 0, 1);
  t = constrain(t, 0, 1);
  brightness = lerp(brightness, pow(t, BRIGHT_EASE), 0.12);

  // Move sunshine along top
  const sunX = lerp(0, width - sunBox.w, t);
  sunEl.position(sunX, sunBox.y);

  // Black veil overlay (darker when brightness small)
  const alpha = (1 - brightness) * DIM_ALPHA_MAX;
  fill(0, 0, 0, alpha);
  rect(0, 0, width, height);

  // Start/pause flower visibility
  if (!isPlaying && t >= START_T) {
    isPlaying = true;
    flowerEl.style('opacity', '1');
    restartGif(flowerEl, FLOWER_GIF);
  } else if (isPlaying && t <= STOP_T) {
    isPlaying = false;
    flowerEl.style('opacity', '0');
  }

  // Instruction text
  fill(0, 0, 0, 120);
  textAlign(CENTER, TOP);
  textSize(13);
  const tip = sensorsEnabled
    ? 'Tilt right (≈60%) to START • Tilt left/flat (≤35%) to PAUSE'
    : 'Tap "Enable Motion", then tilt right to START';
  text(tip, width/2, 14);
}

function layoutUI() {
  const sW = sunEl.elt.naturalWidth  || 480;
  const sH = sunEl.elt.naturalHeight || 480;
  let sw = min(width * 0.36, 420);
  let sh = sw * (sH / sW);
  let sx = (width - sw)/2;
  let sy = height * 0.06;
  sunEl.size(sw, sh);
  sunEl.position(sx, sy);
  sunBox = { x:sx, y:sy, w:sw, h:sh };

  const fW = flowerEl.elt.naturalWidth  || width * 0.8;
  const fH = flowerEl.elt.naturalHeight || width * 1.0;
  let fw = width * 0.90;
  let fh = fw * (fH / Math.max(1, fW));
  const margin = 18;
  const maxH = height - sunBox.y - sunBox.h - margin - 24;
  if (fh > maxH) { fh = maxH; fw = fh * (fW / Math.max(1, fH)); }
  let fx = (width - fw)/2;
  let fy = height - fh - margin;
  flowerEl.size(fw, fh);
  flowerEl.position(fx, fy);
  flowerBox = { x:fx, y:fy, w:fw, h:fh };
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  layoutUI();
}

function restartGif(el, src) {
  el.attribute('src', src + '?t=' + Date.now());
}

function requestMotionPermission() {
  return new Promise(resolve => {
    const httpsOk = (location.protocol === 'https:') || (location.hostname === 'localhost');
    if (!httpsOk) { sensorsEnabled = true; resolve(); return; }

    let asked = false;
    const done = () => resolve();

    if (typeof DeviceMotionEvent !== 'undefined' &&
        typeof DeviceMotionEvent.requestPermission === 'function') {
      DeviceMotionEvent.requestPermission().then(s => { if (s === 'granted') sensorsEnabled = true; done(); }).catch(done);
      asked = true;
    }
    if (typeof DeviceOrientationEvent !== 'undefined' &&
        typeof DeviceOrientationEvent.requestPermission === 'function') {
      DeviceOrientationEvent.requestPermission().then(s => { if (s === 'granted') sensorsEnabled = true; done(); }).catch(done);
      asked = true;
    }
    if (!asked) { sensorsEnabled = true; done(); }
  });
}

function lockGestures() {
  document.documentElement.style.touchAction = 'none';
  document.addEventListener('gesturestart', e => e.preventDefault());
  document.addEventListener('touchmove',  e => e.preventDefault(), { passive:false });
}

// Finger-swipe fallback
function touchStarted() { updatePointerT(); return false; }
function touchMoved()   { updatePointerT(); return false; }
function mousePressed() { pointerActive = true; pointerT = constrain(mouseX/width, 0, 1); }
function mouseDragged() { pointerActive = true; pointerT = constrain(mouseX/width, 0, 1); }
function mouseReleased(){ pointerActive = false; }
function updatePointerT() {
  pointerActive = true;
  const t = touches && touches.length ? touches[0].x / width : mouseX / width;
  pointerT = constrain(t, 0, 1);
}
