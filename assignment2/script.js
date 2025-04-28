// DOM 요소 선택
const video = document.querySelector("#custom-video-player");
const playPauseBtn = document.querySelector("#play-pause-btn");
const playPauseImg = document.querySelector("#play-pause-img");
const progressBar = document.querySelector("#progress-bar-fill");
const progressBarContainer = document.querySelector(".progress-bar");
const volumeSlider = document.querySelector("#volume-slider");
const muteBtn = document.querySelector("#mute-btn");
const volumeImg = document.querySelector("#volume-img");
const fullscreenBtn = document.querySelector("#fullscreen-btn");
const currentTimeElement = document.querySelector("#current-time");
const durationElement = document.querySelector("#duration");
const visualizerCanvas = document.querySelector("#visualizer");
const shuffleBtn = document.querySelector("#shuffle-btn");
const repeatBtn = document.querySelector("#repeat-btn");
const prevBtn = document.querySelector("#prev-btn");
const nextBtn = document.querySelector("#next-btn");
const likeBtn = document.querySelector("#like-btn");
const restartBtn = document.querySelector("#restart-btn");
const lyricsContainer = document.querySelector("#lyrics-container");
const lyricsText = document.querySelector("#lyrics-text");

// 기본 설정
video.removeAttribute("controls");
let isLiked = false;
let isVisualizerActive = false;
let isRepeat = false;
let isShuffle = false;
let audioContext;
let analyser;
let dataArray;
let source;

// 이벤트 리스너 설정
video.addEventListener("timeupdate", updateProgressAndTime);
playPauseBtn.addEventListener("click", togglePlayPause);
progressBarContainer.addEventListener("click", scrub);
volumeSlider.addEventListener("input", updateVolume);
muteBtn.addEventListener("click", toggleMute);
fullscreenBtn.addEventListener("click", toggleFullscreen);
video.addEventListener("loadedmetadata", setDuration);
visualizerCanvas.addEventListener("click", toggleVisualizer);
shuffleBtn.addEventListener("click", toggleShuffle);
repeatBtn.addEventListener("click", toggleRepeat);
likeBtn.addEventListener("click", toggleLike);
prevBtn.addEventListener("click", playPrevious);
nextBtn.addEventListener("click", playNext);
restartBtn.addEventListener("click", restartVideo);

// 가사 데이터 (시간별 가사 - 실제로는 맞는 가사로 업데이트 필요)
const lyrics = [
  { time: 0, text: "Music makes you lose control..." },
  { time: 5, text: "Music makes you lose control..." },
  { time: 10, text: "Makes you lose control..." },
  { time: 15, text: "Let the rhythm take over..." },
  { time: 20, text: "Feel the music in your soul..." },
  { time: 25, text: "Dancing all night long..." },
  { time: 30, text: "Music makes you lose control..." },
];

/**
 * 재생/일시정지 토글 함수
 * 비디오 재생 상태를 전환하고 버튼 이미지를 업데이트합니다.
 */
function togglePlayPause() {
  if (video.paused || video.ended) {
    video.play();
    playPauseImg.src = "Image 4"; // 일시정지 아이콘
  } else {
    video.pause();
    playPauseImg.src = "Image 5"; // 재생 아이콘
  }
}

/**
 * 진행 바와 시간 업데이트 함수
 * 비디오 재생 시간에 맞게 진행 바와 현재 시간을 업데이트합니다.
 */
function updateProgressAndTime() {
  // 진행 바 업데이트
  const percent = (video.currentTime / video.duration) * 100;
  progressBar.style.width = `${percent}%`;

  // 현재 시간 업데이트
  currentTimeElement.textContent = formatTime(video.currentTime);

  // 가사 업데이트
  if (!lyricsContainer.classList.contains("hidden")) {
    updateLyrics();
  }

  // 비주얼라이저 업데이트
  if (isVisualizerActive) {
    drawVisualizer();
  }
}

/**
 * 시간 형식 변환 함수
 * 초 단위 시간을 MM:SS 형식으로 변환합니다.
 */
function formatTime(timeInSeconds) {
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = Math.floor(timeInSeconds % 60);
  return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
}

/**
 * 총 시간 설정 함수
 * 비디오 메타데이터가 로드되면 총 시간을 표시합니다.
 */
function setDuration() {
  durationElement.textContent = formatTime(video.duration);
}

/**
 * 스크럽 함수
 * 진행 바 클릭 시 해당 위치로 비디오 시간을 이동합니다.
 */
function scrub(e) {
  const scrubTime =
    (e.offsetX / progressBarContainer.offsetWidth) * video.duration;
  video.currentTime = scrubTime;
}

/**
 * 볼륨 업데이트 함수
 * 볼륨 슬라이더 값에 맞게 비디오 볼륨을 설정합니다.
 */
function updateVolume() {
  video.volume = volumeSlider.value;
  updateVolumeIcon();
}

/**
 * 음소거 토글 함수
 * 비디오 음소거 상태를 전환합니다.
 */
function toggleMute() {
  video.muted = !video.muted;
  updateVolumeIcon();
}

/**
 * 볼륨 아이콘 업데이트 함수
 * 현재 볼륨 상태에 맞게 아이콘을 변경합니다.
 */
function updateVolumeIcon() {
  if (video.muted || video.volume === 0) {
    volumeImg.src = "Image 3"; // 음소거 아이콘
  } else if (video.volume < 0.5) {
    volumeImg.src = "Image 2"; // 낮은 볼륨 아이콘
  } else {
    volumeImg.src = "Image 11"; // 높은 볼륨 아이콘
  }
}

/**
 * 전체 화면 토글 함수
 * 비디오 전체 화면 모드를 전환합니다.
 */
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    if (video.requestFullscreen) {
      video.requestFullscreen();
    } else if (video.webkitRequestFullscreen) {
      video.webkitRequestFullscreen();
    } else if (video.msRequestFullscreen) {
      video.msRequestFullscreen();
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
  }
}

/**
 * 가사 업데이트 함수
 * 현재 비디오 시간에 맞는 가사를 표시합니다.
 */
function updateLyrics() {
  // 현재 시간에 맞는 가사 찾기
  let currentLyric = lyrics[0].text;

  for (let i = 0; i < lyrics.length; i++) {
    if (video.currentTime >= lyrics[i].time) {
      currentLyric = lyrics[i].text;
    } else {
      break;
    }
  }

  lyricsText.textContent = currentLyric;
}

/**
 * 비주얼라이저 토글 함수
 * 오디오 비주얼라이저를 켜고 끕니다.
 */
function toggleVisualizer() {
  visualizerCanvas.classList.toggle("hidden");
  isVisualizerActive = !visualizerCanvas.classList.contains("hidden");

  if (isVisualizerActive && !audioContext) {
    setupVisualizer();
  }
}

/**
 * 비주얼라이저 설정 함수
 * Web Audio API를 사용하여 비주얼라이저를 설정합니다.
 */
function setupVisualizer() {
  try {
    // 오디오 컨텍스트 설정
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();

    // 비디오의 오디오를 오디오 컨텍스트에 연결
    source = audioContext.createMediaElementSource(video);
    source.connect(analyser);
    analyser.connect(audioContext.destination);

    // 분석기 설정
    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);

    // 캔버스 설정
    const canvasCtx = visualizerCanvas.getContext("2d");
    visualizerCanvas.width = visualizerCanvas.offsetWidth;
    visualizerCanvas.height = visualizerCanvas.offsetHeight;

    // 처음 그리기 시작
    drawVisualizer();
  } catch (error) {
    console.error("비주얼라이저 설정 오류:", error);
    isVisualizerActive = false;
    visualizerCanvas.classList.add("hidden");
  }
}

/**
 * 비주얼라이저 그리기 함수
 * 오디오 주파수에 따라 비주얼라이저를 그립니다.
 */
function drawVisualizer() {
  if (!isVisualizerActive) return;

  // 다음 애니메이션 프레임 요청
  requestAnimationFrame(drawVisualizer);

  // 오디오 데이터 가져오기
  analyser.getByteFrequencyData(dataArray);

  const canvasCtx = visualizerCanvas.getContext("2d");
  const WIDTH = visualizerCanvas.width;
  const HEIGHT = visualizerCanvas.height;

  // 캔버스 지우기
  canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

  // 바 너비 및 높이 계산
  const barWidth = (WIDTH / dataArray.length) * 2.5;
  let x = 0;

  // 각 주파수 바 그리기
  for (let i = 0; i < dataArray.length; i++) {
    // 바 높이 계산
    const barHeight = (dataArray[i] / 255) * HEIGHT;

    // 그라데이션 생성
    const gradient = canvasCtx.createLinearGradient(
      0,
      HEIGHT,
      0,
      HEIGHT - barHeight
    );
    gradient.addColorStop(0, "rgb(255, 51, 102)"); // 하단: 네온 핑크
    gradient.addColorStop(0.5, "rgb(255, 51, 255)"); // 중간: 보라색
    gradient.addColorStop(1, "rgb(0, 204, 255)"); // 상단: 네온 청록색

    canvasCtx.fillStyle = gradient;

    // 바 그리기
    canvasCtx.fillRect(x, HEIGHT - barHeight, barWidth, barHeight);

    // 다음 바 위치로 이동
    x += barWidth + 1;
  }
}

/**
 * 셔플 토글 함수
 * 셔플 모드를 켜고 끕니다.
 */
function toggleShuffle() {
  isShuffle = !isShuffle;
  if (isShuffle) {
    shuffleBtn.classList.add("active");
  } else {
    shuffleBtn.classList.remove("active");
  }
}

/**
 * 반복 토글 함수
 * 반복 모드를 켜고 끕니다.
 */
function toggleRepeat() {
  isRepeat = !isRepeat;
  if (isRepeat) {
    repeatBtn.classList.add("active");
    video.loop = true;
  } else {
    repeatBtn.classList.remove("active");
    video.loop = false;
  }
}

/**
 * 비디오 다시 시작 함수
 * 비디오를 처음부터 다시 재생합니다.
 */
function restartVideo() {
  video.currentTime = 0;
  if (video.paused) {
    video.play();
    playPauseImg.src = "Image 4"; // 일시정지 아이콘
  }
}

/**
 * 좋아요 토글 함수
 * 좋아요 상태를 전환합니다.
 */
function toggleLike() {
  isLiked = !isLiked;
  if (isLiked) {
    likeBtn.classList.add("active");
    // 좋아요 아이콘 스타일 변경
    likeBtn.querySelector("img").style.filter = "brightness(1.2) saturate(1.5)";
  } else {
    likeBtn.classList.remove("active");
    // 좋아요 아이콘 원래대로
    likeBtn.querySelector("img").style.filter = "none";
  }
}

/**
 * 이전 비디오 재생 함수
 * 현재는 하나의 비디오만 있으므로 처음으로 이동합니다.
 */
function playPrevious() {
  video.currentTime = 0;
  if (video.paused) {
    video.play();
    playPauseImg.src = "Image 4"; // 일시정지 아이콘
  }
}

/**
 * 다음 비디오 재생 함수
 * 현재는 하나의 비디오만 있으므로 처음으로 이동합니다.
 */
function playNext() {
  video.currentTime = 0;
  if (video.paused) {
    video.play();
    playPauseImg.src = "Image 4"; // 일시정지 아이콘
  }
}

/**
 * 비디오 종료 이벤트 처리
 * 비디오가 끝나면 반복 모드에 따라 처리합니다.
 */
video.addEventListener("ended", function () {
  if (isRepeat) {
    // 반복 모드라면 다시 시작
    video.play();
  } else {
    // 아니라면 일시 정지 상태로 변경
    playPauseImg.src = "Image 5"; // 재생 아이콘
  }
});

/**
 * 키보드 단축키 설정
 * 스페이스바 - 재생/일시정지
 * 화살표 좌/우 - 10초 앞/뒤로 이동
 * 화살표 위/아래 - 볼륨 증가/감소
 * M - 음소거
 * F - 전체 화면
 */
document.addEventListener("keydown", function (e) {
  switch (e.code) {
    case "Space":
      togglePlayPause();
      e.preventDefault();
      break;
    case "ArrowLeft":
      video.currentTime = Math.max(video.currentTime - 10, 0);
      e.preventDefault();
      break;
    case "ArrowRight":
      video.currentTime = Math.min(video.currentTime + 10, video.duration);
      e.preventDefault();
      break;
    case "ArrowUp":
      video.volume = Math.min(video.volume + 0.1, 1);
      volumeSlider.value = video.volume;
      updateVolumeIcon();
      e.preventDefault();
      break;
    case "ArrowDown":
      video.volume = Math.max(video.volume - 0.1, 0);
      volumeSlider.value = video.volume;
      updateVolumeIcon();
      e.preventDefault();
      break;
    case "KeyM":
      toggleMute();
      e.preventDefault();
      break;
    case "KeyF":
      toggleFullscreen();
      e.preventDefault();
      break;
  }
});

/**
 * 플레이리스트 아이템 클릭 이벤트
 * 현재는 단일 비디오만 있으므로 처음으로 재설정합니다.
 */
document.querySelectorAll(".video-item").forEach((item) => {
  item.addEventListener("click", function () {
    // 활성 클래스 제거
    document
      .querySelectorAll(".video-item")
      .forEach((i) => i.classList.remove("active"));
    // 클릭한 아이템에 활성 클래스 추가
    this.classList.add("active");

    // 비디오 재설정
    video.currentTime = 0;
    video.play();
    playPauseImg.src = "Image 4"; // 일시정지 아이콘
  });
});

/**
 * 초기화 함수
 * 페이지 로드 시 초기 상태를 설정합니다.
 */
function init() {
  // 볼륨 초기값 설정
  video.volume = 0.7;
  volumeSlider.value = video.volume;
  updateVolumeIcon();

  // 비디오 로드 이벤트
  video.addEventListener("loadeddata", function () {
    // 비디오가 로드되면 로딩 표시 제거
    console.log("비디오 로드 완료");
  });

  // 비디오 오류 처리
  video.addEventListener("error", function (e) {
    console.error("비디오 로드 오류:", e);
  });
}

// 가사 토글 기능 (추가)
document.addEventListener("dblclick", function (e) {
  // 비디오 영역에서 더블 클릭 시 가사 토글
  if (e.target === video) {
    lyricsContainer.classList.toggle("hidden");
    if (!lyricsContainer.classList.contains("hidden")) {
      updateLyrics();
    }
  }
});

// 페이지 로드 시 초기화 실행
window.addEventListener("load", init);
