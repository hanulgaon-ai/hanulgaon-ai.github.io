// DOM 요소 선택
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

// 캔버스 컨텍스트 및 크기 설정
const ctx = canvas.getContext("2d");
let canvasWidth, canvasHeight;

// 오디오 컨텍스트 및 분석기 설정
let audioContext, analyser, dataArray, bufferLength, sourceNode;
let visualizationActive = false;

// 타이머 변수
let timerInterval;
let timerMode = "stopwatch"; // 'stopwatch' 또는 'countdown'
let timerRunning = false;
let timerValue = 0;
let countdownTotal = 0;

// 전체화면 상태
let isFullscreen = false;

// 행성 객체 배열
const planets = [];
const numPlanets = 5; // 행성 개수

// 별 객체 배열
const stars = [];
const numStars = 200; // 별 개수

// 초기화 함수
function init() {
  // 캔버스 크기 설정
  resizeCanvas();

  // 오디오 초기 설정
  audioPlayer.volume = 0.7;
  volumeSlider.value = audioPlayer.volume;
  audioPlayer.loop = true; // 무한 반복 확인

  // 총 시간 설정 (4분 35초)
  durationElement.textContent = "4:35";

  // 테마 초기화 (기본 다크 모드)
  document.body.classList.add("dark-mode");

  // 별 생성
  createStars();

  // 행성 생성
  createPlanets();

  // 이벤트 리스너 설정
  setupEventListeners();

  // 처음 시각화 그리기
  drawInitialVisualization();
}

// 이벤트 리스너 설정
function setupEventListeners() {
  // 오디오 이벤트
  audioPlayer.addEventListener("timeupdate", updateProgress);
  audioPlayer.addEventListener("loadedmetadata", updateDuration);
  audioPlayer.addEventListener("play", setupAudioContext);
  audioPlayer.addEventListener("ended", handleAudioEnd);

  // 컨트롤 이벤트
  playPauseBtn.addEventListener("click", togglePlayPause);
  progressContainer.addEventListener("click", seek);
  volumeSlider.addEventListener("input", updateVolume);
  muteBtn.addEventListener("click", toggleMute);
  fullscreenBtn.addEventListener("click", toggleFullscreen);

  // 타이머 이벤트
  timerToggleBtn.addEventListener("click", toggleTimerPanel);
  timerStartStopBtn.addEventListener("click", toggleTimer);
  timerResetBtn.addEventListener("click", resetTimer);
  timerModeBtn.addEventListener("click", toggleTimerMode);
  setCountdownBtn.addEventListener("click", setCountdown);

  // 기타 이벤트
  window.addEventListener("resize", resizeCanvas);
  themeToggle.addEventListener("click", toggleTheme);

  // 키보드 이벤트
  document.addEventListener("keydown", handleKeyDown);
}

// 캔버스 크기 조정
function resizeCanvas() {
  // 현재 컨테이너 크기에 맞게 캔버스 크기 조정
  if (isFullscreen) {
    canvasWidth = canvas.width = window.innerWidth;
    canvasHeight = canvas.height = window.innerHeight;
  } else {
    canvasWidth = canvas.width = canvas.offsetWidth;
    canvasHeight = canvas.height = canvas.offsetHeight;
  }

  // 별 및 행성 재조정
  if (stars.length > 0) {
    stars.forEach((star) => {
      if (star.x > canvasWidth) star.x = Math.random() * canvasWidth;
      if (star.y > canvasHeight) star.y = Math.random() * canvasHeight;
    });
  }

  if (planets.length > 0) {
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    const minDistance = Math.min(canvasWidth, canvasHeight) * 0.25;

    planets.forEach((planet) => {
      planet.distance =
        minDistance +
        Math.random() * (Math.min(canvasWidth, canvasHeight) * 0.3);
    });
  }

  // 시각화 다시 그리기
  if (!visualizationActive) {
    drawInitialVisualization();
  }
}

// 별 생성
function createStars() {
  stars.length = 0; // 초기화

  for (let i = 0; i < numStars; i++) {
    // 별 속성: 위치, 크기, 밝기, 깜박임 속도
    stars.push({
      x: Math.random() * canvasWidth,
      y: Math.random() * canvasHeight,
      size: Math.random() * 1.5,
      brightness: Math.random() * 0.5 + 0.5, // 50-100% 밝기
      blinkSpeed: 0.0005 + Math.random() * 0.001, // 깜박임 속도 감소
      blinkPhase: Math.random() * Math.PI * 2, // 랜덤한 초기 위상
    });
  }
}

// 행성 생성
function createPlanets() {
  planets.length = 0; // 초기화

  // 행성 유형 다양화
  const planetTypes = ["eclipse", "corona", "crescent", "ring", "halfmoon"];

  for (let i = 0; i < numPlanets; i++) {
    const size = 20 + Math.random() * 40; // 20px ~ 60px

    // 중앙 영역을 피하고 고르게 분포
    let x, y;
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    const minDistance = Math.min(canvasWidth, canvasHeight) * 0.25;

    do {
      x = Math.random() * canvasWidth;
      y = Math.random() * canvasHeight;
    } while (Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2) < minDistance);

    planets.push({
      x,
      y,
      size,
      type: planetTypes[i], // 각 행성마다 다른 유형
      angle: Math.random() * Math.PI * 2, // 초기 각도
      speed: 0.0001 + Math.random() * 0.0003, // 회전 속도 (각 행성마다 다름)
      rotationAngle: Math.random() * Math.PI * 2, // 자체 회전 각도
      rotationSpeed: 0.0001 + Math.random() * 0.0005, // 자체 회전 속도
      distance:
        minDistance +
        Math.random() * (Math.min(canvasWidth, canvasHeight) * 0.3),
      glowIntensity: 0.5 + Math.random() * 0.5, // 행성 빛남 강도
      glowSize: 1.2 + Math.random() * 0.4, // 빛남 크기
    });
  }
}

// 초기 시각화 그리기 (오디오 재생 전)
function drawInitialVisualization() {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  // 배경 (다크 모드일 때는 우주 배경처럼)
  if (document.body.classList.contains("dark-mode")) {
    ctx.fillStyle = "#000811";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // 별 그리기
    drawStars();
  } else {
    ctx.fillStyle = "#f8f9fa";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  }

  // 중앙 좌표
  const centerX = canvasWidth / 2;
  const centerY = canvasHeight / 2;

  // 내부 웨이브 (초기 상태)
  drawInnerWave(centerX, centerY, 50, 0);

  // 외부 웨이브 (초기 상태)
  drawOuterWave(centerX, centerY, 150, 0);

  // 행성 그리기
  drawPlanets();

  // 애니메이션 반복
  if (!visualizationActive) {
    requestAnimationFrame(drawInitialVisualization);
  }
}

// 별 그리기
function drawStars() {
  ctx.fillStyle = "#ffffff";

  // 각 별 업데이트 및 그리기
  stars.forEach((star) => {
    // 별 깜박임 업데이트 (매우 느리게)
    star.blinkPhase += star.blinkSpeed;
    // 사인 함수로 0.7~1.0 사이의 밝기 변화
    const currentBrightness =
      star.brightness * (0.7 + 0.3 * Math.sin(star.blinkPhase));

    // 별 그리기
    ctx.globalAlpha = currentBrightness;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    ctx.fill();
  });

  // 알파값 재설정
  ctx.globalAlpha = 1.0;
}

// 내부 웨이브 그리기
function drawInnerWave(centerX, centerY, radius, average) {
  ctx.save();

  // 중앙 작은 원
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius * 0.3, 0, Math.PI * 2);
  ctx.fillStyle = document.body.classList.contains("dark-mode")
    ? "#ffffff"
    : "#000000";
  ctx.fill();

  // 내부 빛 효과
  const gradient = ctx.createRadialGradient(
    centerX,
    centerY,
    radius * 0.3,
    centerX,
    centerY,
    radius
  );
  gradient.addColorStop(
    0,
    document.body.classList.contains("dark-mode")
      ? "rgba(255, 255, 255, 0.8)"
      : "rgba(0, 0, 0, 0.8)"
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

// 외부 웨이브 그리기
function drawOuterWave(centerX, centerY, radius, average) {
  ctx.save();

  // 회전 각도 계산 (시계 방향 회전)
  const rotationAngle = Date.now() * 0.0002; // 시간에 따라 회전

  ctx.translate(centerX, centerY);
  ctx.rotate(rotationAngle);
  ctx.translate(-centerX, -centerY);

  const numLines = 120; // 선 개수 증가
  const angleStep = (Math.PI * 2) / numLines;

  ctx.strokeStyle = document.body.classList.contains("dark-mode")
    ? "#ffffff"
    : "#000000";

  for (let i = 0; i < numLines; i++) {
    const angle = i * angleStep;

    // 선 길이 계산 (기본 길이 + 주파수 기반 변화)
    const lineLength = radius * (1 + Math.random() * 0.2); // 약간의 변동

    ctx.beginPath();
    // 선의 시작점을 중심에서 약간 떨어지게 설정
    const startRadius = radius * 0.6;
    ctx.moveTo(
      centerX + Math.cos(angle) * startRadius,
      centerY + Math.sin(angle) * startRadius
    );
    ctx.lineTo(
      centerX + Math.cos(angle) * lineLength,
      centerY + Math.sin(angle) * lineLength
    );

    ctx.lineWidth = 0.8 + Math.random() * 0.6;
    ctx.globalAlpha = 0.7 + Math.random() * 0.3;
    ctx.stroke();
  }

  ctx.globalAlpha = 1.0;
  ctx.restore();
}

// 행성 그리기
function drawPlanets() {
  const centerX = canvasWidth / 2;
  const centerY = canvasHeight / 2;

  planets.forEach((planet) => {
    // 행성 각도 업데이트 (일정한 속도로 회전, 음악에 반응하지 않음)
    planet.angle += planet.speed;
    planet.rotationAngle += planet.rotationSpeed;

    // 행성 위치 계산
    const x = centerX + Math.cos(planet.angle) * planet.distance;
    const y = centerY + Math.sin(planet.angle) * planet.distance;

    // 가운데 방향의 각도 계산 (행성에서 중앙을 바라보는 방향)
    const centerAngle = Math.atan2(centerY - y, centerX - x);

    // 행성 유형에 따라 다르게 그리기
    switch (planet.type) {
      case "eclipse":
        // 일식형 행성 (이미지 1과 유사)
        drawEclipsePlanet(x, y, planet, centerAngle);
        break;

      case "corona":
        // 코로나형 행성 (태양과 같은 발광 효과)
        drawCoronaPlanet(x, y, planet);
        break;

      case "crescent":
        // 초승달형 행성
        drawCrescentPlanet(x, y, planet, centerAngle);
        break;

      case "ring":
        // 토성형 행성 (고리 있음)
        drawRingPlanet(x, y, planet, centerAngle);
        break;

      case "halfmoon":
        // 반달형 행성
        drawHalfMoonPlanet(x, y, planet, centerAngle);
        break;
    }
  });
}

// 일식형 행성 그리기
function drawEclipsePlanet(x, y, planet, centerAngle) {
  ctx.save();

  // 발광 효과
  const gradient = ctx.createRadialGradient(
    x,
    y,
    planet.size,
    x,
    y,
    planet.size * planet.glowSize
  );
  gradient.addColorStop(
    0,
    document.body.classList.contains("dark-mode")
      ? "rgba(255, 255, 255, 0.8)"
      : "rgba(0, 0, 0, 0.8)"
  );
  gradient.addColorStop(
    1,
    document.body.classList.contains("dark-mode")
      ? "rgba(255, 255, 255, 0)"
      : "rgba(0, 0, 0, 0)"
  );

  ctx.beginPath();
  ctx.arc(x, y, planet.size * planet.glowSize, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();

  // 행성 본체
  ctx.beginPath();
  ctx.arc(x, y, planet.size, 0, Math.PI * 2);
  ctx.fillStyle = document.body.classList.contains("dark-mode")
    ? "#000000"
    : "#ffffff";
  ctx.fill();

  // 중앙 발광점
  const innerGlow = ctx.createRadialGradient(x, y, 0, x, y, planet.size * 0.1);
  innerGlow.addColorStop(
    0,
    document.body.classList.contains("dark-mode")
      ? "rgba(255, 255, 255, 1)"
      : "rgba(0, 0, 0, 1)"
  );
  innerGlow.addColorStop(
    1,
    document.body.classList.contains("dark-mode")
      ? "rgba(255, 255, 255, 0)"
      : "rgba(0, 0, 0, 0)"
  );

  ctx.beginPath();
  ctx.arc(x, y, planet.size * 0.1, 0, Math.PI * 2);
  ctx.fillStyle = innerGlow;
  ctx.fill();

  ctx.restore();
}

// 코로나형 행성 그리기
function drawCoronaPlanet(x, y, planet) {
  ctx.save();

  // 코로나 효과 (태양과 같은 외곽 발광)
  const outerRadius = planet.size * 1.8;
  const coronaGradient = ctx.createRadialGradient(
    x,
    y,
    planet.size * 0.8,
    x,
    y,
    outerRadius
  );
  coronaGradient.addColorStop(
    0,
    document.body.classList.contains("dark-mode")
      ? "rgba(255, 255, 255, 0.8)"
      : "rgba(0, 0, 0, 0.8)"
  );
  coronaGradient.addColorStop(
    1,
    document.body.classList.contains("dark-mode")
      ? "rgba(255, 255, 255, 0)"
      : "rgba(0, 0, 0, 0)"
  );

  ctx.beginPath();
  ctx.arc(x, y, outerRadius, 0, Math.PI * 2);
  ctx.fillStyle = coronaGradient;
  ctx.fill();

  // 내부 발광 효과
  const innerGradient = ctx.createRadialGradient(x, y, 0, x, y, planet.size);
  innerGradient.addColorStop(
    0,
    document.body.classList.contains("dark-mode")
      ? "rgba(255, 255, 255, 1)"
      : "rgba(0, 0, 0, 1)"
  );
  innerGradient.addColorStop(
    1,
    document.body.classList.contains("dark-mode")
      ? "rgba(255, 255, 255, 0.6)"
      : "rgba(0, 0, 0, 0.6)"
  );

  ctx.beginPath();
  ctx.arc(x, y, planet.size, 0, Math.PI * 2);
  ctx.fillStyle = innerGradient;
  ctx.fill();

  // 불꽃 효과 (코로나 돌기)
  const numFlares = 12;
  const flareAngleStep = (Math.PI * 2) / numFlares;

  for (let i = 0; i < numFlares; i++) {
    const flareAngle = i * flareAngleStep + planet.rotationAngle;
    const flareLength = planet.size * (1 + Math.random() * 0.5);

    ctx.beginPath();
    ctx.moveTo(x, y);

    // 곡선 제어점
    const cp1x = x + Math.cos(flareAngle - 0.2) * planet.size * 1.5;
    const cp1y = y + Math.sin(flareAngle - 0.2) * planet.size * 1.5;
    const cp2x = x + Math.cos(flareAngle + 0.2) * planet.size * 1.5;
    const cp2y = y + Math.sin(flareAngle + 0.2) * planet.size * 1.5;

    // 끝점
    const endX = x + Math.cos(flareAngle) * flareLength * 2;
    const endY = y + Math.sin(flareAngle) * flareLength * 2;

    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY);

    const flareGradient = ctx.createLinearGradient(x, y, endX, endY);
    flareGradient.addColorStop(
      0,
      document.body.classList.contains("dark-mode")
        ? "rgba(255, 255, 255, 0.8)"
        : "rgba(0, 0, 0, 0.8)"
    );
    flareGradient.addColorStop(
      1,
      document.body.classList.contains("dark-mode")
        ? "rgba(255, 255, 255, 0)"
        : "rgba(0, 0, 0, 0)"
    );

    ctx.strokeStyle = flareGradient;
    ctx.lineWidth = 2 + Math.random() * 3;
    ctx.stroke();
  }

  ctx.restore();
}

// 초승달형 행성 그리기
function drawCrescentPlanet(x, y, planet, centerAngle) {
  ctx.save();

  // 행성 본체
  ctx.beginPath();
  ctx.arc(x, y, planet.size, 0, Math.PI * 2);
  ctx.fillStyle = document.body.classList.contains("dark-mode")
    ? "#ffffff"
    : "#000000";
  ctx.fill();

  // 그림자 부분 (중앙에서 멀어지는 방향)
  const shadowX = x + Math.cos(centerAngle) * (planet.size * 0.6);
  const shadowY = y + Math.sin(centerAngle) * (planet.size * 0.6);

  ctx.beginPath();
  ctx.arc(shadowX, shadowY, planet.size * 0.9, 0, Math.PI * 2);
  ctx.fillStyle = document.body.classList.contains("dark-mode")
    ? "#000811"
    : "#f8f9fa";
  ctx.fill();

  // 가장자리 빛 효과
  const edgeGradient = ctx.createRadialGradient(
    x,
    y,
    planet.size * 0.85,
    x,
    y,
    planet.size
  );
  edgeGradient.addColorStop(0, "rgba(0, 0, 0, 0)");
  edgeGradient.addColorStop(
    1,
    document.body.classList.contains("dark-mode")
      ? "rgba(255, 255, 255, 0.5)"
      : "rgba(0, 0, 0, 0.5)"
  );

  ctx.beginPath();
  ctx.arc(x, y, planet.size, 0, Math.PI * 2);
  ctx.fillStyle = edgeGradient;
  ctx.fill();

  ctx.restore();
}

// 토성형 행성 그리기
function drawRingPlanet(x, y, planet, centerAngle) {
  ctx.save();

  // 행성 본체
  ctx.beginPath();
  ctx.arc(x, y, planet.size, 0, Math.PI * 2);
  ctx.fillStyle = document.body.classList.contains("dark-mode")
    ? "#000000"
    : "#ffffff";
  ctx.fill();
  ctx.strokeStyle = document.body.classList.contains("dark-mode")
    ? "#ffffff"
    : "#000000";
  ctx.lineWidth = 1;
  ctx.stroke();

  // 고리 그리기
  ctx.beginPath();
  // 타원 그리기
  ctx.ellipse(
    x,
    y,
    planet.size * 2, // x 반경
    planet.size * 2 * 0.3, // y 반경 (타원형)
    centerAngle, // 회전 각도 (중앙을 향함)
    0,
    Math.PI * 2
  );

  // 고리 그라데이션
  const ringGradient = ctx.createLinearGradient(
    x - planet.size * 2,
    y,
    x + planet.size * 2,
    y
  );
  ringGradient.addColorStop(0, "rgba(0, 0, 0, 0)");
  ringGradient.addColorStop(
    0.2,
    document.body.classList.contains("dark-mode")
      ? "rgba(255, 255, 255, 0.7)"
      : "rgba(0, 0, 0, 0.7)"
  );
  ringGradient.addColorStop(0.5, "rgba(0, 0, 0, 0)");
  ringGradient.addColorStop(
    0.8,
    document.body.classList.contains("dark-mode")
      ? "rgba(255, 255, 255, 0.7)"
      : "rgba(0, 0, 0, 0.7)"
  );
  ringGradient.addColorStop(1, "rgba(0, 0, 0, 0)");

  ctx.strokeStyle = ringGradient;
  ctx.lineWidth = planet.size * 0.3;
  ctx.stroke();

  // 행성이 고리 앞에 있는 효과 (마스킹)
  ctx.globalCompositeOperation = "destination-out";
  ctx.beginPath();
  ctx.arc(x, y, planet.size, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = "source-over";

  // 행성 테두리 복원
  ctx.beginPath();
  ctx.arc(x, y, planet.size, 0, Math.PI * 2);
  ctx.strokeStyle = document.body.classList.contains("dark-mode")
    ? "#ffffff"
    : "#000000";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.restore();
}

// 반달형 행성 그리기
function drawHalfMoonPlanet(x, y, planet, centerAngle) {
  ctx.save();

  // 행성 본체
  ctx.beginPath();
  ctx.arc(x, y, planet.size, 0, Math.PI * 2);
  ctx.fillStyle = document.body.classList.contains("dark-mode")
    ? "#ffffff"
    : "#000000";
  ctx.fill();

  // 그림자 부분 (중앙을 바라보는 방향 기준 90도 회전)
  const perpendicularAngle = centerAngle + Math.PI / 2;
  const clipX = x + Math.cos(perpendicularAngle) * planet.size;
  const clipY = y + Math.sin(perpendicularAngle) * planet.size;

  // 클리핑 경로 설정 (반원)
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

  // 그림자 그리기
  ctx.beginPath();
  ctx.arc(x, y, planet.size, 0, Math.PI * 2);
  ctx.fillStyle = document.body.classList.contains("dark-mode")
    ? "#000811"
    : "#f8f9fa";
  ctx.fill();

  ctx.restore();

  // 테두리
  ctx.beginPath();
  ctx.arc(x, y, planet.size, 0, Math.PI * 2);
  ctx.strokeStyle = document.body.classList.contains("dark-mode")
    ? "rgba(255, 255, 255, 0.3)"
    : "rgba(0, 0, 0, 0.3)";
  ctx.lineWidth = 1;
  ctx.stroke();
}

// 오디오 재생/일시정지 토글
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

// 오디오 컨텍스트 설정
function setupAudioContext() {
  if (visualizationActive) return;

  try {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();

    sourceNode = audioContext.createMediaElementSource(audioPlayer);
    sourceNode.connect(analyser);
    analyser.connect(audioContext.destination);

    // FFT 크기 설정 (파워 값이어야 함: 32, 64, 128, 256, 512, 1024, 2048, 4096)
    analyser.fftSize = 256;
    bufferLength = analyser.frequencyBinCount; // fftSize의 절반
    dataArray = new Uint8Array(bufferLength);

    visualizationActive = true;
    animateVisualization();
  } catch (error) {
    console.error("오디오 컨텍스트 생성 에러:", error);
  }
}

// 시각화 애니메이션
function animateVisualization() {
  if (!visualizationActive) return;

  // 데이터 가져오기
  analyser.getByteFrequencyData(dataArray);

  // 평균 진폭 계산
  const average =
    dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
  const amplifiedAverage = Math.min(255, average * 1.5); // 반응성 증가

  // 캔버스 초기화
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  // 배경 (다크 모드일 때는 우주 배경처럼)
  if (document.body.classList.contains("dark-mode")) {
    ctx.fillStyle = "#000811";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // 별 그리기
    drawStars();
  } else {
    ctx.fillStyle = "#f8f9fa";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  }

  // 중앙 좌표
  const centerX = canvasWidth / 2;
  const centerY = canvasHeight / 2;

  // 내부 웨이브 (음악에 반응, 크기 변화)
  const innerRadius = 30 + (amplifiedAverage / 255) * 40;
  drawInnerWave(centerX, centerY, innerRadius, amplifiedAverage);

  // 외부 웨이브 (음악에 반응, 회전)
  const outerRadius = 120 + (amplifiedAverage / 255) * 80;
  drawOuterWaveWithAudio(centerX, centerY, outerRadius, dataArray);

  // 행성 그리기 (음악에 반응하지 않음)
  drawPlanets();

  // 애니메이션 반복
  requestAnimationFrame(animateVisualization);
}

// 오디오에 반응하는 외부 웨이브 그리기
function drawOuterWaveWithAudio(centerX, centerY, radius, dataArray) {
  ctx.save();

  // 회전 각도 계산 (시계 방향 회전)
  const rotationAngle = Date.now() * 0.0002; // 시간에 따라 회전

  ctx.translate(centerX, centerY);
  ctx.rotate(rotationAngle);
  ctx.translate(-centerX, -centerY);

  const numLines = 120; // 선 개수 증가
  const angleStep = (Math.PI * 2) / numLines;

  ctx.strokeStyle = document.body.classList.contains("dark-mode")
    ? "#ffffff"
    : "#000000";

  for (let i = 0; i < numLines; i++) {
    const angle = i * angleStep;

    // 주파수 값을 기반으로 변화
    const frequencyIndex = Math.floor((i / numLines) * bufferLength);
    const frequencyValue = dataArray[frequencyIndex];

    // 선 길이 계산 (기본 길이 + 주파수 기반 변화)
    const lineBase = radius * 0.8;
    const lineVariation = radius * 0.4;
    const lineLength = lineBase + lineVariation * (frequencyValue / 255);

    ctx.beginPath();
    // 선의 시작점을 중심에서 약간 떨어지게 설정
    const startRadius = radius * 0.4;
    ctx.moveTo(
      centerX + Math.cos(angle) * startRadius,
      centerY + Math.sin(angle) * startRadius
    );
    ctx.lineTo(
      centerX + Math.cos(angle) * lineLength,
      centerY + Math.sin(angle) * lineLength
    );

    // 주파수에 따른 선 두께 및 투명도
    const lineOpacity = 0.3 + 0.7 * (frequencyValue / 255);
    ctx.globalAlpha = lineOpacity;
    ctx.lineWidth = 1 + frequencyValue / 255;
    ctx.stroke();
  }

  ctx.globalAlpha = 1.0;
  ctx.restore();
}

// 재생 진행 상태 업데이트
function updateProgress() {
  const currentTime = audioPlayer.currentTime;
  const duration = audioPlayer.duration || 275; // 4:35 = 275초

  // 진행 바 업데이트
  const progressPercent = (currentTime / duration) * 100;
  progressBar.style.width = `${progressPercent}%`;

  // 시간 표시 업데이트
  currentTimeElement.textContent = formatTime(currentTime);
}

// 총 시간 업데이트
function updateDuration() {
  // 오디오의 실제 지속 시간이 있을 경우만 업데이트
  if (audioPlayer.duration && !isNaN(audioPlayer.duration)) {
    durationElement.textContent = formatTime(audioPlayer.duration);
  } else {
    durationElement.textContent = "4:35"; // 기본값 설정
  }
}

// 시간 형식 변환 (초 -> MM:SS)
function formatTime(time) {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
}

// 클릭 위치로 재생 위치 이동
function seek(e) {
  const percent = e.offsetX / progressContainer.offsetWidth;
  audioPlayer.currentTime = percent * (audioPlayer.duration || 275); // 4:35 = 275초
}

// 볼륨 업데이트
function updateVolume() {
  audioPlayer.volume = volumeSlider.value;
  updateVolumeIcon();
}

// 음소거 토글
function toggleMute() {
  audioPlayer.muted = !audioPlayer.muted;
  updateVolumeIcon();
}

// 볼륨 아이콘 업데이트
function updateVolumeIcon() {
  if (audioPlayer.muted || audioPlayer.volume === 0) {
    volumeIcon.textContent = "🔈";
  } else if (audioPlayer.volume < 0.5) {
    volumeIcon.textContent = "🔉";
  } else {
    volumeIcon.textContent = "🔊";
  }
}

// 오디오 종료 처리
function handleAudioEnd() {
  // 이미 loop 속성으로 무한 반복이 설정되어 있지만, 추가 확인
  playPauseIcon.textContent = "▶";

  // 만약 무한 반복이 작동하지 않을 경우를 대비한 백업 코드
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

// 타이머 패널 토글
function toggleTimerPanel() {
  timerPanel.classList.toggle("hidden");
}

// 전체화면 토글
function toggleFullscreen() {
  isFullscreen = !isFullscreen;

  if (isFullscreen) {
    container.classList.add("fullscreen-mode");
    // 실제 브라우저 전체화면 모드
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
    } else if (document.documentElement.webkitRequestFullscreen) {
      document.documentElement.webkitRequestFullscreen();
    } else if (document.documentElement.msRequestFullscreen) {
      document.documentElement.msRequestFullscreen();
    }
  } else {
    container.classList.remove("fullscreen-mode");
    // 전체화면 종료
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
  }

  // 캔버스 크기 재조정
  setTimeout(resizeCanvas, 100); // 전체화면 전환 후 약간의 지연시간을 두고 리사이즈
}

// 타이머 시작/정지 토글
function toggleTimer() {
  if (timerRunning) {
    stopTimer();
    timerStartStopIcon.textContent = "▶";
  } else {
    startTimer();
    timerStartStopIcon.textContent = "⏸";
  }
}

// 타이머 시작
function startTimer() {
  if (timerRunning) return;
  timerRunning = true;

  timerInterval = setInterval(() => {
    if (timerMode === "stopwatch") {
      // 스톱워치 모드 - 시간 증가
      timerValue++;
      updateTimerDisplay();
    } else if (timerMode === "countdown") {
      // 카운트다운 모드 - 시간 감소
      if (timerValue > 0) {
        timerValue--;
        updateTimerDisplay();
      } else {
        // 타이머 종료
        stopTimer();
        timerEnd();
      }
    }
  }, 1000);
}

// 타이머 정지
function stopTimer() {
  clearInterval(timerInterval);
  timerRunning = false;
  timerStartStopIcon.textContent = "▶";
}

// 타이머 재설정
function resetTimer() {
  stopTimer();
  timerValue = 0;
  updateTimerDisplay();
  timerStartStopIcon.textContent = "▶";
}

// 타이머 모드 전환
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

// 카운트다운 설정
function setCountdown() {
  const minutes = parseInt(countdownMinutesInput.value) || 25;
  timerValue = minutes * 60;
  updateTimerDisplay();
}

// 타이머 표시 업데이트
function updateTimerDisplay() {
  const minutes = Math.floor(timerValue / 60);
  const seconds = timerValue % 60;

  timerMinutes.textContent = minutes < 10 ? `0${minutes}` : minutes;
  timerSeconds.textContent = seconds < 10 ? `0${seconds}` : seconds;
}

// 타이머 종료 처리
function timerEnd() {
  // 화면 깜빡임 효과
  mediaPlayer.classList.add("flash");

  // 오디오 일시정지
  audioPlayer.pause();
  playPauseIcon.textContent = "▶";

  // 깜빡임 효과 제거
  setTimeout(() => {
    mediaPlayer.classList.remove("flash");
  }, 1500);
}

// 테마 토글
function toggleTheme() {
  document.body.classList.toggle("dark-mode");

  // 시각화 업데이트
  if (!visualizationActive) {
    drawInitialVisualization();
  }
}

// 키보드 이벤트 처리
function handleKeyDown(e) {
  // 스페이스바: 재생/일시정지
  if (e.code === "Space") {
    togglePlayPause();
    e.preventDefault();
  }

  // F키: 전체화면 전환
  if (e.code === "KeyF") {
    toggleFullscreen();
    e.preventDefault();
  }

  // M키: 음소거 전환
  if (e.code === "KeyM") {
    toggleMute();
    e.preventDefault();
  }

  // T키: 타이머 패널 토글
  if (e.code === "KeyT") {
    toggleTimerPanel();
    e.preventDefault();
  }

  // 왼쪽/오른쪽 화살표: 뒤로/앞으로 이동
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

  // 위/아래 화살표: 볼륨 조절
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

// 브라우저 전체화면 이벤트 처리
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
    // 사용자가 Esc 키 등으로 전체화면을 종료한 경우
    isFullscreen = false;
    container.classList.remove("fullscreen-mode");
    setTimeout(resizeCanvas, 100);
  }
}

// 페이지 로드 시 초기화
window.addEventListener("DOMContentLoaded", init);

/**
 * 코드 설명 및 디자인 의도
 *
 * 이 미디어 플레이어는 "휴식/공부를 위한 음악" 컨텍스트에 맞춰 특별히 설계되었습니다.
 * 우주 공간을 모티프로 한 시각화는 사용자가 음악에 몰입하고 집중할 수 있는 환경을 제공합니다.
 *
 * 디자인 결정:
 *
 * 1. 우주 테마 - 제공된 이미지와 같이 우주를 모티프로 한 디자인을 채택했습니다.
 *    중앙에서 동심원 형태로 구성된 시각화와 다양한 형태의 행성들은
 *    사용자에게 깊이 있는 우주 공간의 느낌을 전달합니다.
 *
 * 2. 이중 사운드 웨이브 구조 - 중앙의 작은 웨이브는 음악의 진폭에 따라 크기가 변하고,
 *    바깥쪽의 큰 웨이브는 주파수 스펙트럼에 반응하면서 시계 방향으로 회전합니다.
 *    이는 마치 블랙홀이나 태양과 같은 천체의 아름다움을 시각적으로 표현합니다.
 *
 * 3. 다양한 행성 디자인 - 일식형, 코로나형, 초승달형, 토성형, 반달형 등
 *    다양한 유형의 행성을 구현하여 시각적 다양성을 제공합니다.
 *    각 행성은 중앙을 향하고 있으며, 독립적인 속도로 회전합니다.
 *
 * 4. 흑백 대비 - 색상을 최소화하고 흑백의 강한 대비만을 사용하여 시각적 간결함을
 *    유지했습니다. 다크/라이트 모드 전환을 통해 사용자 선호에 맞게 조정 가능합니다.
 *
 * 5. 타이머 UI 개선 - 헤더 중앙에 타이머 토글 버튼을 배치하고, 패널은 팝업 형태로
 *    구현하여 필요할 때만 표시되도록 했습니다. 이는 시각적 산만함을 줄이고
 *    사용자 경험을 단순화합니다.
 *
 * 기술적 구현:
 *
 * 1. Canvas API - HTML5 Canvas를 사용하여 복잡한 시각화 효과를 구현했습니다.
 *    그라데이션, 복합 연산, 회전 변환 등의 고급 기능을 활용하여 아름다운
 *    천체 효과를 구현했습니다.
 *
 * 2. Web Audio API - 오디오 분석기를 사용하여 음악의 주파수와 진폭을 실시간으로
 *    분석하고, 이를 시각적 요소에 반영합니다. 낮은 진폭을 가진 음악에서도
 *    시각적 효과가 잘 드러나도록 증폭 계수를 적용했습니다.
 *
 * 3. 반응형 전체화면 - 브라우저의 전체화면 API를 활용하여 어떤 화면 크기에서도
 *    최적의 시각화 경험을 제공합니다. 특히 1920x1080 해상도에서 완벽하게
 *    화면을 채우도록 최적화했습니다.
 *
 * 4. 사용자 인터페이스 개선 - 타이머 컨트롤을 직관적인 방식으로 재설계하고,
 *    토글 방식의 UI로 화면 공간을 효율적으로 활용했습니다.
 *
 * 이 미디어 플레이어는 단순히 음악을 재생하는 도구를 넘어, 시각적으로 매력적인
 * 경험을 통해 사용자의 집중력과 휴식의 질을 향상시키는 것을 목표로 합니다.
 * 우주를 테마로 한 시각화는 사용자가 일상에서 벗어나 음악에 완전히 몰입할 수 있는
 * 가상의 공간을 제공합니다.
 */
