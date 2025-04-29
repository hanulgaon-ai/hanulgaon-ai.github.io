const audioPlayer = document.getElementById("audio-player");
const canvas = document.getElementById("visualization-canvas");
const playPauseBtn = document.getElementById("play-pause-btn");
const playPauseIcon = document.getElementById("play-pause-icon");
const progressBar = document.getElementById("progress-bar-fill");
const progressContainer = document.querySelector(".progress-bar");
const currentTimeElement = document.getElementById("current-time");
const durationElement = document.getElementById("duration");
const volumeSlider = document.getElementById("volume-slider");
const muteBtn = document.getElementById("mute-btn");
const volumeIcon = document.getElementById("volume-icon");
const fullscreenBtn = document.getElementById("fullscreen-btn");
const timerPanel = document.getElementById("timer-panel");
const timerToggleBtn = document.getElementById("timer-toggle-btn");
const timerMinutes = document.getElementById("timer-minutes");
const timerSeconds = document.getElementById("timer-seconds");
const timerStartStopBtn = document.getElementById("timer-start-stop");
const timerStartStopIcon = document.getElementById("timer-start-stop-icon");
const timerResetBtn = document.getElementById("timer-reset");
const timerModeBtn = document.getElementById("timer-mode");
const timerModeLabel = document.getElementById("timer-mode-label");
const countdownSettings = document.getElementById("countdown-settings");
const countdownMinutesInput = document.getElementById("countdown-minutes");
const setCountdownBtn = document.getElementById("set-countdown");
const themeToggle = document.getElementById("theme-toggle");
const mediaPlayer = document.querySelector(".media-player");
const container = document.querySelector(".container");

const ctx = canvas.getContext("2d");
let canvasWidth, canvasHeight;

let audioContext, analyser, dataArray, bufferLength, sourceNode;
let visualizationActive = false;

let timerInterval;
let timerMode = "stopwatch";
let timerRunning = false;
let timerValue = 0;
let countdownTotal = 0;

let isFullscreen = false;
let controlsTimeout;

const planets = [];
const numPlanets = 5;

const stars = [];
const numStars = 200;

function init() {
  resizeCanvas();

  audioPlayer.volume = 0.7;
  volumeSlider.value = audioPlayer.volume;
  audioPlayer.loop = true;

  durationElement.textContent = "4:35";

  document.body.classList.add("dark-mode");

  createStars(false);
  createPlanets();

  setupEventListeners();

  drawInitialVisualization();
}

function setupEventListeners() {
  audioPlayer.addEventListener("timeupdate", updateProgress);
  audioPlayer.addEventListener("loadedmetadata", updateDuration);
  audioPlayer.addEventListener("play", setupAudioContext);
  audioPlayer.addEventListener("ended", handleAudioEnd);

  playPauseBtn.addEventListener("click", togglePlayPause);
  progressContainer.addEventListener("click", seek);
  volumeSlider.addEventListener("input", updateVolume);
  muteBtn.addEventListener("click", toggleMute);
  fullscreenBtn.addEventListener("click", toggleFullscreen);

  timerToggleBtn.addEventListener("click", toggleTimerPanel);
  timerStartStopBtn.addEventListener("click", toggleTimer);
  timerResetBtn.addEventListener("click", resetTimer);
  timerModeBtn.addEventListener("click", toggleTimerMode);
  setCountdownBtn.addEventListener("click", setCountdown);

  window.addEventListener("resize", handleResize);
  themeToggle.addEventListener("click", toggleTheme);

  document.addEventListener("keydown", handleKeyDown);

  // 전체화면 마우스 이벤트 추가
  mediaPlayer.addEventListener("mousemove", showControlsTemporarily);
  mediaPlayer.addEventListener("mouseenter", showControlsTemporarily);

  // 컨트롤바에 마우스가 올라가면 자동 숨김 방지
  const customControls = document.querySelector(".custom-controls");
  customControls.addEventListener("mouseenter", () => {
    if (isFullscreen) {
      clearTimeout(controlsTimeout);
    }
  });
}

function handleResize() {
  resizeCanvas();

  // 타이머 패널이 표시되어 있다면 위치 재조정
  if (!timerPanel.classList.contains("hidden")) {
    toggleTimerPanel();
    toggleTimerPanel();
  }
}

function resizeCanvas() {
  if (isFullscreen) {
    canvasWidth = canvas.width = window.innerWidth;
    canvasHeight = canvas.height = window.innerHeight;
  } else {
    canvasWidth = canvas.width = canvas.offsetWidth;
    canvasHeight = canvas.height = canvas.offsetHeight;
  }

  // 전체화면으로 전환 시 별 갯수 조정
  if (isFullscreen && stars.length < numStars * 2) {
    createStars(true); // 전체화면용 별 생성
  } else if (!isFullscreen && stars.length > numStars) {
    createStars(false); // 일반 모드용 별 생성
  } else {
    // 기존 별 위치 조정
    stars.forEach((star) => {
      if (star.x > canvasWidth) star.x = Math.random() * canvasWidth;
      if (star.y > canvasHeight) star.y = Math.random() * canvasHeight;
    });
  }

  if (planets.length > 0) {
    adjustPlanetsForNewDesign();
  }

  if (!visualizationActive) {
    drawInitialVisualization();
  }
}

function createStars(fullscreenMode = false) {
  stars.length = 0;

  // 전체화면일 때는 별 수 2배로 증가
  const starCount = fullscreenMode ? numStars * 2 : numStars;

  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * canvasWidth,
      y: Math.random() * canvasHeight,
      size: Math.random() * 1.8, // 별 크기 약간 키움
      brightness: Math.random() * 0.5 + 0.5,
      blinkSpeed: 0.0005 + Math.random() * 0.001,
      blinkPhase: Math.random() * Math.PI * 2,
    });
  }
}

function createPlanets() {
  planets.length = 0;

  const planetTypes = [
    "small-dot",
    "medium-dot",
    "ring-dot",
    "crescent",
    "halfmoon",
  ];
  // 궤도 거리를 더 넓게 분포
  const orbitDistances = [0.3, 0.42, 0.54, 0.66, 0.78];
  const speedMultipliers = [1.5, 0.8, 1.2, 0.6, 1.0];

  const centerX = canvasWidth / 2;
  const centerY = canvasHeight / 2;
  const baseRadius = Math.min(canvasWidth, canvasHeight) * 0.6; // 기본 반경 0.6으로 증가

  for (let i = 0; i < numPlanets; i++) {
    const size = 7.5 + Math.random() * 12.5;
    const distance = baseRadius * orbitDistances[i];
    const startAngle = Math.random() * Math.PI * 2;

    planets.push({
      size,
      type: planetTypes[i],
      angle: startAngle,
      speed: (0.0002 + Math.random() * 0.0003) * speedMultipliers[i],
      rotationAngle: Math.random() * Math.PI * 2,
      rotationSpeed: 0.0001 + Math.random() * 0.0003,
      distance,
      glowIntensity: 0.3 + Math.random() * 0.3,
      glowSize: 1.1 + Math.random() * 0.2,
      orbitIndex: i,
    });
  }
}

function adjustPlanetsForNewDesign() {
  const centerX = canvasWidth / 2;
  const centerY = canvasHeight / 2;
  const baseRadius = Math.min(canvasWidth, canvasHeight) * 0.6; // 기본 반경 0.6으로 증가
  const orbitDistances = [0.3, 0.42, 0.54, 0.66, 0.78]; // 궤도 거리도 동일하게 조정

  planets.forEach((planet) => {
    planet.distance = baseRadius * orbitDistances[planet.orbitIndex];
  });
}

function drawInitialVisualization() {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  if (document.body.classList.contains("dark-mode")) {
    ctx.fillStyle = "#000811";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    drawStars();
  } else {
    ctx.fillStyle = "#f8f9fa";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  }

  const centerX = canvasWidth / 2;
  const centerY = canvasHeight / 2;

  drawOrbitalGrid(centerX, centerY);

  // 기본 웨이브 크기를 animateVisualization와 동일하게 설정
  drawInnerWave(centerX, centerY, 140, 0);
  drawOuterWave(centerX, centerY, 280, 0);

  drawPlanets();

  if (!visualizationActive) {
    requestAnimationFrame(drawInitialVisualization);
  }
}

function drawStars() {
  ctx.fillStyle = "#ffffff";

  stars.forEach((star) => {
    star.blinkPhase += star.blinkSpeed;
    const currentBrightness =
      star.brightness * (0.7 + 0.3 * Math.sin(star.blinkPhase));

    ctx.globalAlpha = currentBrightness;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.globalAlpha = 1.0;
}

function drawOrbitalGrid(centerX, centerY) {
  const baseRadius = Math.min(canvasWidth, canvasHeight) * 0.6; // 그리드 크기 0.6으로 증가

  ctx.save();

  // 원형 궤도
  const orbitDistances = [0.3, 0.42, 0.54, 0.66, 0.78];

  orbitDistances.forEach((distance, index) => {
    // 바깥쪽으로 갈수록 점점 투명해지게
    const opacity = document.body.classList.contains("dark-mode")
      ? 0.4 - index * 0.06
      : 0.4 - index * 0.06;

    ctx.strokeStyle = document.body.classList.contains("dark-mode")
      ? `rgba(255, 255, 255, ${opacity})`
      : `rgba(0, 0, 0, ${opacity})`;
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.arc(centerX, centerY, baseRadius * distance, 0, Math.PI * 2);
    ctx.stroke();
  });

  // 방사형 선 - 개수 유지 (12개)
  const numRadials = 12;
  for (let i = 0; i < numRadials; i++) {
    const angle = (i / numRadials) * Math.PI * 2;
    const opacity = document.body.classList.contains("dark-mode") ? 0.25 : 0.25; // 기본 투명도 조정

    ctx.strokeStyle = document.body.classList.contains("dark-mode")
      ? `rgba(255, 255, 255, ${opacity})`
      : `rgba(0, 0, 0, ${opacity})`;

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(
      centerX + Math.cos(angle) * baseRadius * 0.8,
      centerY + Math.sin(angle) * baseRadius * 0.8
    );
    ctx.stroke();
  }

  // 점선 외부 원
  ctx.setLineDash([5, 5]);
  ctx.strokeStyle = document.body.classList.contains("dark-mode")
    ? "rgba(255, 255, 255, 0.2)"
    : "rgba(0, 0, 0, 0.2)";
  ctx.beginPath();
  ctx.arc(centerX, centerY, baseRadius * 0.8, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.restore();
}

function drawInnerWave(centerX, centerY, radius, average) {
  ctx.save();

  // 중앙 원은 동일한 크기 유지
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius * 0.2, 0, Math.PI * 2);
  ctx.fillStyle = document.body.classList.contains("dark-mode")
    ? "rgba(255, 255, 255, 0.8)"
    : "rgba(0, 0, 0, 0.8)";
  ctx.fill();

  // 그라데이션 크기 조정
  const gradient = ctx.createRadialGradient(
    centerX,
    centerY,
    radius * 0.2,
    centerX,
    centerY,
    radius
  );
  gradient.addColorStop(
    0,
    document.body.classList.contains("dark-mode")
      ? "rgba(255, 255, 255, 0.7)"
      : "rgba(0, 0, 0, 0.7)"
  );
  gradient.addColorStop(
    1,
    document.body.classList.contains("dark-mode")
      ? "rgba(255, 255, 255, 0)"
      : "rgba(0, 0, 0, 0)"
  );

  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();

  ctx.restore();
}

function drawOuterWave(centerX, centerY, radius, average) {
  ctx.save();

  const rotationAngle = Date.now() * 0.0002;

  ctx.translate(centerX, centerY);
  ctx.rotate(rotationAngle);
  ctx.translate(-centerX, -centerY);

  const numLines = 120;
  const angleStep = (Math.PI * 2) / numLines;

  ctx.strokeStyle = document.body.classList.contains("dark-mode")
    ? "rgba(255, 255, 255, 0.4)"
    : "rgba(0, 0, 0, 0.4)";

  for (let i = 0; i < numLines; i++) {
    const angle = i * angleStep;

    const lineLength = radius * (1 + Math.random() * 0.1);

    ctx.beginPath();
    const startRadius = radius * 0.7;
    ctx.moveTo(
      centerX + Math.cos(angle) * startRadius,
      centerY + Math.sin(angle) * startRadius
    );
    ctx.lineTo(
      centerX + Math.cos(angle) * lineLength,
      centerY + Math.sin(angle) * lineLength
    );

    ctx.lineWidth = 0.8 + Math.random() * 0.4;
    ctx.globalAlpha = 0.6 + Math.random() * 0.3;
    ctx.stroke();
  }

  ctx.globalAlpha = 1.0;
  ctx.restore();
}

function drawPlanets() {
  const centerX = canvasWidth / 2;
  const centerY = canvasHeight / 2;

  planets.forEach((planet) => {
    planet.angle += planet.speed;
    planet.rotationAngle += planet.rotationSpeed;

    const x = centerX + Math.cos(planet.angle) * planet.distance;
    const y = centerY + Math.sin(planet.angle) * planet.distance;

    const centerAngle = Math.atan2(centerY - y, centerX - x);

    switch (planet.type) {
      case "small-dot":
        drawSimpleDot(x, y, planet, 0.7);
        break;
      case "medium-dot":
        drawSimpleDot(x, y, planet, 1);
        break;
      case "ring-dot":
        drawRingDot(x, y, planet, centerAngle);
        break;
      case "crescent":
        drawCrescentPlanet(x, y, planet, centerAngle);
        break;
      case "halfmoon":
        drawHalfMoonPlanet(x, y, planet, centerAngle);
        break;
    }
  });
}

function drawSimpleDot(x, y, planet, sizeMultiplier) {
  ctx.save();

  const finalSize = planet.size * sizeMultiplier;

  // Subtle glow
  if (document.body.classList.contains("dark-mode")) {
    const gradient = ctx.createRadialGradient(
      x,
      y,
      finalSize,
      x,
      y,
      finalSize * planet.glowSize
    );
    gradient.addColorStop(
      0,
      "rgba(255, 255, 255, " + 0.5 * planet.glowIntensity + ")"
    );
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

    ctx.beginPath();
    ctx.arc(x, y, finalSize * planet.glowSize, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
  }

  // Main dot
  ctx.beginPath();
  ctx.arc(x, y, finalSize, 0, Math.PI * 2);
  ctx.fillStyle = document.body.classList.contains("dark-mode")
    ? "rgba(255, 255, 255, 0.8)"
    : "rgba(0, 0, 0, 0.8)";
  ctx.fill();

  ctx.restore();
}

function drawRingDot(x, y, planet, centerAngle) {
  ctx.save();

  // Main dot
  ctx.beginPath();
  ctx.arc(x, y, planet.size * 0.7, 0, Math.PI * 2);
  ctx.fillStyle = document.body.classList.contains("dark-mode")
    ? "rgba(255, 255, 255, 0.8)"
    : "rgba(0, 0, 0, 0.8)";
  ctx.fill();

  // Ring
  ctx.beginPath();
  ctx.ellipse(
    x,
    y,
    planet.size * 1.5,
    planet.size * 1.5 * 0.4,
    centerAngle + Math.PI / 4,
    0,
    Math.PI * 2
  );

  ctx.strokeStyle = document.body.classList.contains("dark-mode")
    ? "rgba(255, 255, 255, 0.5)"
    : "rgba(0, 0, 0, 0.5)";
  ctx.lineWidth = planet.size * 0.15;
  ctx.stroke();

  ctx.restore();
}

function drawCrescentPlanet(x, y, planet, centerAngle) {
  ctx.save();

  // Planet base
  ctx.beginPath();
  ctx.arc(x, y, planet.size, 0, Math.PI * 2);
  ctx.fillStyle = document.body.classList.contains("dark-mode")
    ? "rgba(255, 255, 255, 0.8)"
    : "rgba(0, 0, 0, 0.8)";
  ctx.fill();

  // Shadow
  const shadowX = x + Math.cos(centerAngle) * (planet.size * 0.5);
  const shadowY = y + Math.sin(centerAngle) * (planet.size * 0.5);

  ctx.beginPath();
  ctx.arc(shadowX, shadowY, planet.size * 0.95, 0, Math.PI * 2);
  ctx.fillStyle = document.body.classList.contains("dark-mode")
    ? "#000811"
    : "#f8f9fa";
  ctx.fill();

  ctx.restore();
}

function drawHalfMoonPlanet(x, y, planet, centerAngle) {
  ctx.save();

  // Planet base
  ctx.beginPath();
  ctx.arc(x, y, planet.size, 0, Math.PI * 2);
  ctx.fillStyle = document.body.classList.contains("dark-mode")
    ? "rgba(255, 255, 255, 0.8)"
    : "rgba(0, 0, 0, 0.8)";
  ctx.fill();

  // Half shadow
  const perpendicularAngle = centerAngle + Math.PI / 2;

  ctx.beginPath();
  ctx.arc(
    x,
    y,
    planet.size * 1.1,
    perpendicularAngle,
    perpendicularAngle + Math.PI
  );
  ctx.lineTo(x, y);
  ctx.closePath();
  ctx.clip();

  ctx.beginPath();
  ctx.arc(x, y, planet.size, 0, Math.PI * 2);
  ctx.fillStyle = document.body.classList.contains("dark-mode")
    ? "#000811"
    : "#f8f9fa";
  ctx.fill();

  ctx.restore();
}

function togglePlayPause() {
  if (audioPlayer.paused) {
    audioPlayer
      .play()
      .then(() => {
        playPauseIcon.textContent = "⏸";
        if (!visualizationActive) {
          setupAudioContext();
        }
      })
      .catch((error) => {
        console.error("오디오 재생 에러:", error);
      });
  } else {
    audioPlayer.pause();
    playPauseIcon.textContent = "▶";
  }
}

function setupAudioContext() {
  if (visualizationActive) return;

  try {
    // 이미 AudioContext가 있는지 확인
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      bufferLength = analyser.frequencyBinCount;
      dataArray = new Uint8Array(bufferLength);

      // 소스 노드 연결
      sourceNode = audioContext.createMediaElementSource(audioPlayer);
      sourceNode.connect(analyser);
      analyser.connect(audioContext.destination);
    }

    visualizationActive = true;
    animateVisualization();
  } catch (error) {
    console.error("오디오 컨텍스트 생성 에러:", error);
  }
}

function animateVisualization() {
  if (!visualizationActive) return;

  analyser.getByteFrequencyData(dataArray);

  const average =
    dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
  const amplifiedAverage = Math.min(255, average * 1.5);

  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  if (document.body.classList.contains("dark-mode")) {
    ctx.fillStyle = "#000811";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    drawStars();
  } else {
    ctx.fillStyle = "#f8f9fa";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  }

  const centerX = canvasWidth / 2;
  const centerY = canvasHeight / 2;

  drawOrbitalGrid(centerX, centerY);

  // 내부 웨이브 크기 조정
  const innerRadius = 140 + (amplifiedAverage / 255) * 100;
  drawInnerWave(centerX, centerY, innerRadius, amplifiedAverage);

  // 외부 웨이브 크기 조정
  const outerRadius = 280 + (amplifiedAverage / 255) * 80;
  drawOuterWaveWithAudio(centerX, centerY, outerRadius, dataArray);

  drawPlanets();

  requestAnimationFrame(animateVisualization);
}

function drawOuterWaveWithAudio(centerX, centerY, radius, dataArray) {
  ctx.save();

  const rotationAngle = Date.now() * 0.0002;

  ctx.translate(centerX, centerY);
  ctx.rotate(rotationAngle);
  ctx.translate(-centerX, -centerY);

  const numLines = 120;
  const angleStep = (Math.PI * 2) / numLines;

  ctx.strokeStyle = document.body.classList.contains("dark-mode")
    ? "rgba(255, 255, 255, 0.5)"
    : "rgba(0, 0, 0, 0.5)";

  for (let i = 0; i < numLines; i++) {
    const angle = i * angleStep;

    const frequencyIndex = Math.floor((i / numLines) * bufferLength);
    const frequencyValue = dataArray[frequencyIndex];

    const lineBase = radius * 0.8;
    const lineVariation = radius * 0.3;
    const lineLength = lineBase + lineVariation * (frequencyValue / 255);

    ctx.beginPath();
    const startRadius = radius * 0.5;
    ctx.moveTo(
      centerX + Math.cos(angle) * startRadius,
      centerY + Math.sin(angle) * startRadius
    );
    ctx.lineTo(
      centerX + Math.cos(angle) * lineLength,
      centerY + Math.sin(angle) * lineLength
    );

    const lineOpacity = 0.3 + 0.6 * (frequencyValue / 255);
    ctx.globalAlpha = lineOpacity;
    ctx.lineWidth = 0.8 + (frequencyValue / 255) * 0.8;
    ctx.stroke();
  }

  ctx.globalAlpha = 1.0;
  ctx.restore();
}

function updateProgress() {
  const currentTime = audioPlayer.currentTime;
  const duration = audioPlayer.duration || 275;

  const progressPercent = (currentTime / duration) * 100;
  progressBar.style.width = `${progressPercent}%`;

  currentTimeElement.textContent = formatTime(currentTime);
}

function updateDuration() {
  if (audioPlayer.duration && !isNaN(audioPlayer.duration)) {
    durationElement.textContent = formatTime(audioPlayer.duration);
  } else {
    durationElement.textContent = "4:35";
  }
}

function formatTime(time) {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
}

function seek(e) {
  const percent = e.offsetX / progressContainer.offsetWidth;
  audioPlayer.currentTime = percent * (audioPlayer.duration || 275);
}

function updateVolume() {
  audioPlayer.volume = volumeSlider.value;
  updateVolumeIcon();
}

function toggleMute() {
  audioPlayer.muted = !audioPlayer.muted;
  updateVolumeIcon();
}

function updateVolumeIcon() {
  if (audioPlayer.muted || audioPlayer.volume === 0) {
    volumeIcon.textContent = "🔈";
  } else if (audioPlayer.volume < 0.5) {
    volumeIcon.textContent = "🔉";
  } else {
    volumeIcon.textContent = "🔊";
  }
}

function handleAudioEnd() {
  playPauseIcon.textContent = "▶";

  audioPlayer.currentTime = 0;
  audioPlayer
    .play()
    .then(() => {
      playPauseIcon.textContent = "⏸";
    })
    .catch((error) => {
      console.error("오디오 자동 반복 재생 오류:", error);
    });
}

function toggleTimerPanel() {
  timerPanel.classList.toggle("hidden");

  // 타이머 패널 위치 조정
  if (!timerPanel.classList.contains("hidden")) {
    const mainControls = document.querySelector(".main-controls");
    const playerControls = document.querySelector(".player-controls");
    const rect = playerControls.getBoundingClientRect();

    // 타이머가 보이지만 전체화면 모드가 아닐 경우 위치 조정
    if (!isFullscreen) {
      timerPanel.style.bottom = `${mainControls.offsetHeight + 20}px`;
      timerPanel.style.right = `${
        document.body.clientWidth - rect.right + 20
      }px`;
    } else {
      // 전체화면 모드일 경우 위치 조정
      timerPanel.style.bottom = `${mainControls.offsetHeight + 20}px`;
      timerPanel.style.right = "20px";
    }
  }
}

function toggleFullscreen() {
  isFullscreen = !isFullscreen;

  if (isFullscreen) {
    document.body.classList.add("fullscreen-mode");

    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
    } else if (document.documentElement.webkitRequestFullscreen) {
      document.documentElement.webkitRequestFullscreen();
    } else if (document.documentElement.msRequestFullscreen) {
      document.documentElement.msRequestFullscreen();
    }

    if (!timerPanel.classList.contains("hidden")) {
      setTimeout(() => toggleTimerPanel(), 100);
      setTimeout(() => toggleTimerPanel(), 200);
    }

    // 전체화면 모드에서 컨트롤바 초기 표시 후 숨김
    showControlsTemporarily();
  } else {
    document.body.classList.remove("fullscreen-mode");

    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }

    if (!timerPanel.classList.contains("hidden")) {
      setTimeout(() => toggleTimerPanel(), 100);
      setTimeout(() => toggleTimerPanel(), 200);
    }

    // 전체화면 모드가 아닐 때는 항상 컨트롤바 표시
    const customControls = document.querySelector(".custom-controls");
    customControls.style.opacity = "1";
    clearTimeout(controlsTimeout);
  }

  setTimeout(resizeCanvas, 100);
}

// 마우스 움직임에 따른 컨트롤바 표시/숨김 관리
function showControlsTemporarily() {
  if (isFullscreen) {
    const customControls = document.querySelector(".custom-controls");
    customControls.style.opacity = "1";

    // 이전 타이머 취소
    clearTimeout(controlsTimeout);

    // 3초 후 자동 숨김
    controlsTimeout = setTimeout(() => {
      if (isFullscreen) {
        customControls.style.opacity = "0";
      }
    }, 3000);
  }
}

function toggleTimer() {
  if (timerRunning) {
    stopTimer();
    timerStartStopIcon.textContent = "▶";
  } else {
    startTimer();
    timerStartStopIcon.textContent = "⏸";
  }
}

function startTimer() {
  if (timerRunning) return;
  timerRunning = true;

  timerInterval = setInterval(() => {
    if (timerMode === "stopwatch") {
      timerValue++;
      updateTimerDisplay();
    } else if (timerMode === "countdown") {
      if (timerValue > 0) {
        timerValue--;
        updateTimerDisplay();
      } else {
        stopTimer();
        timerEnd();
      }
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  timerRunning = false;
  timerStartStopIcon.textContent = "▶";
}

function resetTimer() {
  stopTimer();
  timerValue = 0;
  updateTimerDisplay();
  timerStartStopIcon.textContent = "▶";
}

function toggleTimerMode() {
  stopTimer();

  if (timerMode === "stopwatch") {
    timerMode = "countdown";
    timerModeLabel.textContent = "Mode: Countdown";
    countdownSettings.classList.remove("hidden");
  } else {
    timerMode = "stopwatch";
    timerModeLabel.textContent = "Mode: Stopwatch";
    countdownSettings.classList.add("hidden");
  }

  resetTimer();
}

function setCountdown() {
  const minutes = parseInt(countdownMinutesInput.value) || 25;
  timerValue = minutes * 60;
  updateTimerDisplay();
}

function updateTimerDisplay() {
  const minutes = Math.floor(timerValue / 60);
  const seconds = timerValue % 60;

  timerMinutes.textContent = minutes < 10 ? `0${minutes}` : minutes;
  timerSeconds.textContent = seconds < 10 ? `0${seconds}` : seconds;
}

function timerEnd() {
  mediaPlayer.classList.add("flash");

  audioPlayer.pause();
  playPauseIcon.textContent = "▶";

  setTimeout(() => {
    mediaPlayer.classList.remove("flash");
  }, 1500);
}

function toggleTheme() {
  document.body.classList.toggle("dark-mode");

  if (!visualizationActive) {
    drawInitialVisualization();
  }
}

function handleKeyDown(e) {
  if (e.code === "Space") {
    togglePlayPause();
    e.preventDefault();
  }

  if (e.code === "KeyF") {
    toggleFullscreen();
    e.preventDefault();
  }

  if (e.code === "KeyM") {
    toggleMute();
    e.preventDefault();
  }

  if (e.code === "KeyT") {
    toggleTimerPanel();
    e.preventDefault();
  }

  if (e.code === "ArrowLeft") {
    audioPlayer.currentTime = Math.max(0, audioPlayer.currentTime - 10);
    e.preventDefault();
  }

  if (e.code === "ArrowRight") {
    audioPlayer.currentTime = Math.min(
      audioPlayer.duration || 275,
      audioPlayer.currentTime + 10
    );
    e.preventDefault();
  }

  if (e.code === "ArrowUp") {
    audioPlayer.volume = Math.min(1, audioPlayer.volume + 0.1);
    volumeSlider.value = audioPlayer.volume;
    updateVolumeIcon();
    e.preventDefault();
  }

  if (e.code === "ArrowDown") {
    audioPlayer.volume = Math.max(0, audioPlayer.volume - 0.1);
    volumeSlider.value = audioPlayer.volume;
    updateVolumeIcon();
    e.preventDefault();
  }
}

document.addEventListener("fullscreenchange", handleFullscreenChange);
document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
document.addEventListener("mozfullscreenchange", handleFullscreenChange);
document.addEventListener("MSFullscreenChange", handleFullscreenChange);

function handleFullscreenChange() {
  if (
    !document.fullscreenElement &&
    !document.webkitFullscreenElement &&
    !document.mozFullScreenElement &&
    !document.msFullscreenElement
  ) {
    isFullscreen = false;
    document.body.classList.remove("fullscreen-mode");

    // 전체화면 모드가 아닐 때는 항상 컨트롤바 표시
    const customControls = document.querySelector(".custom-controls");
    customControls.style.opacity = "1";
    clearTimeout(controlsTimeout);

    setTimeout(resizeCanvas, 100);

    if (!timerPanel.classList.contains("hidden")) {
      setTimeout(() => toggleTimerPanel(), 100);
      setTimeout(() => toggleTimerPanel(), 200);
    }
  }
}

window.addEventListener("DOMContentLoaded", init);
