/*
 * Silent Trajectory - Interactive Media Project
 * A cosmic-themed study and relaxation media player
 *
 * This application creates an immersive space environment for focused study and relaxation,
 * featuring audio-reactive visualization, timer functionality, and a distraction-free interface.
 *
 * From personal experience, I've found that ambient sound can significantly enhance
 * concentration rather than hindering it. The provided audio track has qualities that
 * help establish a flow state - neither too distracting nor too bland. By pairing this
 * audio with a complementary cosmic visualization, the application creates an environment
 * that supports deep concentration and relaxation.
 *
 * Created by Wonjun Kim (s3938263)
 * For Interactive Media Course (OART1013) - Assignment 2
 */

// Wait for DOM to fully load before initializing
document.addEventListener("DOMContentLoaded", () => {
  // DOM element references
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

  // Canvas setup
  let ctx;
  if (canvas) {
    ctx = canvas.getContext("2d");
  }
  let canvasWidth, canvasHeight;

  // Audio visualization variables
  let audioContext = null;
  let analyser = null;
  let dataArray = null;
  let bufferLength = 128; // Default value for initialization
  let sourceNode = null;
  let visualizationActive = false;
  let audioContextCreated = false;

  // Initialize a mock dataArray for non-audio visualization state
  const mockDataArray = new Uint8Array(bufferLength);
  // Fill with initial values
  for (let i = 0; i < bufferLength; i++) {
    mockDataArray[i] = 50 + Math.random() * 50; // Random initial values
  }

  // Timer variables
  let timerInterval;
  let timerMode = "stopwatch";
  let timerRunning = false;
  let timerValue = 0;
  let countdownTotal = 0;

  // UI state variables
  let isFullscreen = false;
  let controlsTimeout;

  // Visualization elements
  const planets = [];
  const numPlanets = 5;

  const stars = [];
  const numStars = 200;

  /**
   * Initialize the application
   * This function sets up the initial state, creates visualization elements,
   * and establishes event listeners for user interaction.
   */
  function init() {
    // Safety check for canvas
    if (!canvas || !ctx) {
      console.error("Canvas or context not available");
      return;
    }

    resizeCanvas();

    // Set initial audio volume
    if (audioPlayer) {
      audioPlayer.volume = 0.7;
      volumeSlider.value = audioPlayer.volume;
      audioPlayer.loop = true;
    }

    // Set default duration for display
    if (durationElement) {
      durationElement.textContent = "4:35";
    }

    // Set dark mode as default theme for cosmic experience
    document.body.classList.add("dark-mode");

    // Create initial visualization elements
    createStars(false);
    createPlanets();

    // Establish event listeners
    setupEventListeners();

    // Start the initial visualization animation
    requestAnimationFrame(drawInitialVisualization);
  }

  /**
   * Set up all event listeners for the application
   */
  function setupEventListeners() {
    if (audioPlayer) {
      // Audio event listeners
      audioPlayer.addEventListener("timeupdate", updateProgress);
      audioPlayer.addEventListener("loadedmetadata", updateDuration);
      audioPlayer.addEventListener("play", handlePlay);
      audioPlayer.addEventListener("ended", handleAudioEnd);
    }

    // Control event listeners
    if (playPauseBtn) playPauseBtn.addEventListener("click", togglePlayPause);
    if (progressContainer) progressContainer.addEventListener("click", seek);
    if (volumeSlider) volumeSlider.addEventListener("input", updateVolume);
    if (muteBtn) muteBtn.addEventListener("click", toggleMute);
    if (fullscreenBtn)
      fullscreenBtn.addEventListener("click", toggleFullscreen);

    // Timer event listeners
    if (timerToggleBtn)
      timerToggleBtn.addEventListener("click", toggleTimerPanel);
    if (timerStartStopBtn)
      timerStartStopBtn.addEventListener("click", toggleTimer);
    if (timerResetBtn) timerResetBtn.addEventListener("click", resetTimer);
    if (timerModeBtn) timerModeBtn.addEventListener("click", toggleTimerMode);
    if (setCountdownBtn)
      setCountdownBtn.addEventListener("click", setCountdown);

    // System event listeners
    window.addEventListener("resize", handleResize);
    if (themeToggle) themeToggle.addEventListener("click", toggleTheme);

    // Keyboard controls enhance usability without requiring mouse interaction
    document.addEventListener("keydown", handleKeyDown);

    // Fullscreen mouse events for control visibility
    if (mediaPlayer) {
      mediaPlayer.addEventListener("mousemove", showControlsTemporarily);
      mediaPlayer.addEventListener("mouseenter", showControlsTemporarily);
    }

    // Prevent automatic control hiding when mouse is over controls
    const customControls = document.querySelector(".custom-controls");
    if (customControls) {
      customControls.addEventListener("mouseenter", () => {
        if (isFullscreen) {
          clearTimeout(controlsTimeout);
        }
      });
    }
  }

  /**
   * Handle play event for audio
   * Sets up the audio context and starts visualization when audio starts playing
   */
  function handlePlay() {
    if (!visualizationActive) {
      // Start visualization regardless of whether audio context works
      startVisualization();

      // Try to set up audio context if not already done
      if (!audioContextCreated) {
        try {
          setupAudioContext();
        } catch (error) {
          console.error("Error setting up audio context:", error);
        }
      }
    }
  }

  /**
   * Start visualization either with or without audio reactivity
   */
  function startVisualization() {
    if (!visualizationActive) {
      visualizationActive = true;
      requestAnimationFrame(animateVisualization);
    }
  }

  /**
   * Handle window resize events
   * This function ensures the visualization adapts to different screen sizes
   * and maintains proper element positioning.
   */
  function handleResize() {
    resizeCanvas();

    // Reposition timer panel if visible
    if (timerPanel && !timerPanel.classList.contains("hidden")) {
      toggleTimerPanel();
      toggleTimerPanel();
    }
  }

  /**
   * Resize the canvas to match container dimensions
   * This function adjusts the visualization size and star count based on screen size,
   * ensuring a consistent visual density across different devices.
   */
  function resizeCanvas() {
    if (!canvas) return;

    if (isFullscreen) {
      canvasWidth = canvas.width = window.innerWidth;
      canvasHeight = canvas.height = window.innerHeight;
    } else {
      canvasWidth = canvas.width = canvas.offsetWidth;
      canvasHeight = canvas.height = canvas.offsetHeight;
    }

    // Adjust star count based on screen size for proper visual density
    if (isFullscreen && stars.length < numStars * 2) {
      createStars(true); // Create stars for fullscreen mode
    } else if (!isFullscreen && stars.length > numStars) {
      createStars(false); // Create stars for normal mode
    } else {
      // Adjust existing star positions
      stars.forEach((star) => {
        if (star.x > canvasWidth) star.x = Math.random() * canvasWidth;
        if (star.y > canvasHeight) star.y = Math.random() * canvasHeight;
      });
    }

    // Adjust planet orbits for new canvas dimensions
    if (planets.length > 0) {
      adjustPlanetsForNewDesign();
    }
  }

  /**
   * Create star field for visualization background
   * Stars are a key element of the cosmic theme, creating depth and movement in the background.
   * The twinkling effect adds subtle animation without being distracting.
   *
   * @param {boolean} fullscreenMode - Whether to create stars for fullscreen mode
   */
  function createStars(fullscreenMode = false) {
    stars.length = 0;

    // Double the star count in fullscreen for a more immersive experience
    const starCount = fullscreenMode ? numStars * 2 : numStars;

    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * canvasWidth,
        y: Math.random() * canvasHeight,
        size: Math.random() * 1.8, // Slightly larger stars for better visibility
        brightness: Math.random() * 0.5 + 0.5,
        blinkSpeed: 0.0005 + Math.random() * 0.001,
        blinkPhase: Math.random() * Math.PI * 2,
      });
    }
  }

  /**
   * Create planets for the visualization
   * The planets orbit around the center point, creating a mesmerizing yet non-distracting
   * motion that enhances the cosmic experience without pulling focus from studying.
   */
  function createPlanets() {
    planets.length = 0;

    // Different planet types create visual variety in the cosmic scene
    const planetTypes = [
      "small-dot",
      "medium-dot",
      "ring-dot",
      "crescent",
      "halfmoon",
    ];

    // Distribute orbits across different distances to create depth
    const orbitDistances = [0.3, 0.42, 0.54, 0.66, 0.78];

    // Varying speeds create a more natural, organic orbital movement
    const speedMultipliers = [1.5, 0.8, 1.2, 0.6, 1.0];

    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    const baseRadius = Math.min(canvasWidth, canvasHeight) * 0.6;

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

  /**
   * Adjust planet orbits when canvas size changes
   * This ensures the visualization remains proportional and visually balanced
   * across different screen sizes and orientations.
   */
  function adjustPlanetsForNewDesign() {
    const baseRadius = Math.min(canvasWidth, canvasHeight) * 0.6;
    const orbitDistances = [0.3, 0.42, 0.54, 0.66, 0.78];

    planets.forEach((planet, index) => {
      if (index < orbitDistances.length) {
        planet.distance = baseRadius * orbitDistances[index];
      }
    });
  }

  /**
   * Draw the initial visualization before audio playback
   * This creates a static but still engaging cosmic scene that invites
   * the user to start the audio and begin their study session.
   */
  function drawInitialVisualization() {
    if (visualizationActive || !ctx) return;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Different background based on theme
    if (document.body.classList.contains("dark-mode")) {
      ctx.fillStyle = "#000811"; // Deep space blue-black for dark mode
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      drawStars();
    } else {
      ctx.fillStyle = "#f8f9fa"; // Light background for light mode
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }

    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;

    // Draw structural elements
    drawOrbitalGrid(centerX, centerY);

    // Draw waves with default size
    drawInnerWave(centerX, centerY, 140, 0);
    drawOuterWave(centerX, centerY, 280, 0);

    // Draw planets in their orbits
    drawPlanets();

    // Continue animation if visualization is not yet active
    if (!visualizationActive) {
      requestAnimationFrame(drawInitialVisualization);
    }
  }

  /**
   * Draw the star field background
   * Stars twinkle subtly to create a living cosmic environment without
   * being distracting.
   */
  function drawStars() {
    if (!ctx) return;

    ctx.fillStyle = "#ffffff";

    stars.forEach((star) => {
      // Update star twinkle phase
      star.blinkPhase += star.blinkSpeed;

      // Calculate current brightness based on sine wave
      const currentBrightness =
        star.brightness * (0.7 + 0.3 * Math.sin(star.blinkPhase));

      ctx.globalAlpha = currentBrightness;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.globalAlpha = 1.0;
  }

  /**
   * Draw the orbital grid that provides structure to the visualization
   * The grid consists of concentric circles and radiating lines that create
   * a sense of space and structure without being visually dominant.
   *
   * @param {number} centerX - X coordinate of the center point
   * @param {number} centerY - Y coordinate of the center point
   */
  function drawOrbitalGrid(centerX, centerY) {
    if (!ctx) return;

    const baseRadius = Math.min(canvasWidth, canvasHeight) * 0.6;

    ctx.save();

    // Circular orbits with decreasing opacity as they move outward
    const orbitDistances = [0.3, 0.42, 0.54, 0.66, 0.78];

    orbitDistances.forEach((distance, index) => {
      // Decrease opacity for outer orbits to create depth
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

    // Radial lines create a compass-like structure
    const numRadials = 12;
    for (let i = 0; i < numRadials; i++) {
      const angle = (i / numRadials) * Math.PI * 2;
      const opacity = document.body.classList.contains("dark-mode")
        ? 0.25
        : 0.25;

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

    // Outer dashed circle to define the boundary of the cosmic area
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

  /**
   * Draw the inner wave that emanates from the center
   * This creates a glowing core that pulses with the audio.
   *
   * @param {number} centerX - X coordinate of the center point
   * @param {number} centerY - Y coordinate of the center point
   * @param {number} radius - Radius of the inner wave
   * @param {number} average - Average audio frequency value (used for reactivity)
   */
  function drawInnerWave(centerX, centerY, radius, average) {
    if (!ctx) return;

    ctx.save();

    // Central glowing orb creates a focal point
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.2, 0, Math.PI * 2);
    ctx.fillStyle = document.body.classList.contains("dark-mode")
      ? "rgba(255, 255, 255, 0.8)"
      : "rgba(0, 0, 0, 0.8)";
    ctx.fill();

    // Gradient creates a soft glow that fades outward
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

  /**
   * Draw the outer wave that responds to audio
   * This creates radiating lines that emanate from the center.
   *
   * @param {number} centerX - X coordinate of the center point
   * @param {number} centerY - Y coordinate of the center point
   * @param {number} radius - Radius of the outer wave
   * @param {number} average - Average audio frequency value (used for reactivity)
   */
  function drawOuterWave(centerX, centerY, radius, average) {
    if (!ctx) return;

    ctx.save();

    // Rotating effect creates dynamic movement
    const rotationAngle = Date.now() * 0.0002;

    ctx.translate(centerX, centerY);
    ctx.rotate(rotationAngle);
    ctx.translate(-centerX, -centerY);

    // Lines radiating outward create a wave-like effect
    const numLines = 120;
    const angleStep = (Math.PI * 2) / numLines;

    ctx.strokeStyle = document.body.classList.contains("dark-mode")
      ? "rgba(255, 255, 255, 0.4)"
      : "rgba(0, 0, 0, 0.4)";

    for (let i = 0; i < numLines; i++) {
      const angle = i * angleStep;

      // Add slight randomness to line length for organic feel
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

      // Vary line width and opacity for visual texture
      ctx.lineWidth = 0.8 + Math.random() * 0.4;
      ctx.globalAlpha = 0.6 + Math.random() * 0.3;
      ctx.stroke();
    }

    ctx.globalAlpha = 1.0;
    ctx.restore();
  }

  /**
   * Draw the outer wave with audio reactivity
   * This function creates audio-responsive lines that emanate from the center,
   * with length, opacity, and width all influenced by frequency data.
   *
   * @param {number} centerX - X coordinate of the center point
   * @param {number} centerY - Y coordinate of the center point
   * @param {number} radius - Base radius of the outer wave
   * @param {Uint8Array} dataArray - Audio frequency data
   */
  function drawOuterWaveWithAudio(centerX, centerY, radius, dataArray) {
    if (!ctx) return;

    ctx.save();

    // Rotating effect creates dynamic movement
    const rotationAngle = Date.now() * 0.0002;

    ctx.translate(centerX, centerY);
    ctx.rotate(rotationAngle);
    ctx.translate(-centerX, -centerY);

    // Lines radiating outward create a wave-like effect
    const numLines = 120;
    const angleStep = (Math.PI * 2) / numLines;

    ctx.strokeStyle = document.body.classList.contains("dark-mode")
      ? "rgba(255, 255, 255, 0.5)"
      : "rgba(0, 0, 0, 0.5)";

    for (let i = 0; i < numLines; i++) {
      const angle = i * angleStep;

      // Map line index to frequency data index
      const frequencyIndex = Math.floor((i / numLines) * dataArray.length);
      const frequencyValue = dataArray[frequencyIndex] || 50; // Fallback to 50 if data is undefined

      // Calculate line length based on frequency value
      // Base line has consistent length with audio-reactive variation
      const lineBase = radius * 0.8;
      const lineVariation = radius * 0.3;
      const lineLength = lineBase + lineVariation * (frequencyValue / 255);

      // Draw line from inner radius to calculated length
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

      // Opacity and width also respond to frequency value
      // creating more prominent lines for stronger frequencies
      const lineOpacity = 0.3 + 0.6 * (frequencyValue / 255);
      ctx.globalAlpha = lineOpacity;
      ctx.lineWidth = 0.8 + (frequencyValue / 255) * 0.8;
      ctx.stroke();
    }

    ctx.globalAlpha = 1.0;
    ctx.restore();
  }

  /**
   * Animate the audio-reactive visualization
   * This is the core animation loop that creates the responsive cosmic environment.
   * Audio frequency data directly influences the size and behavior of visual elements.
   */
  function animateVisualization() {
    if (!visualizationActive || !ctx) return;

    // Update mock data array for non-reactive visualization
    if (!analyser || !dataArray) {
      const time = Date.now() * 0.001;
      for (let i = 0; i < mockDataArray.length; i++) {
        // Create different frequencies with various phase shifts
        mockDataArray[i] = 100 + 100 * Math.sin(time * 0.5 + i * 0.1);
      }
    }

    // Use either real or mock audio data
    let currentDataArray = mockDataArray;
    let average = 0;

    // Try to get real audio data if available
    if (analyser && dataArray) {
      try {
        analyser.getByteFrequencyData(dataArray);
        currentDataArray = dataArray;
        average =
          Array.from(dataArray).reduce((sum, value) => sum + value, 0) /
          dataArray.length;
      } catch (error) {
        console.error("Error getting frequency data:", error);
        // Fall back to mock data
        currentDataArray = mockDataArray;
        average =
          Array.from(mockDataArray).reduce((sum, value) => sum + value, 0) /
          mockDataArray.length;
      }
    } else {
      // Use average of mock data
      average =
        Array.from(mockDataArray).reduce((sum, value) => sum + value, 0) /
        mockDataArray.length;
    }

    // Clear canvas for new frame
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Draw theme-appropriate background
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

    // Draw structural elements
    drawOrbitalGrid(centerX, centerY);

    const amplifiedAverage = Math.min(255, average * 1.5);

    // Inner wave size responds to average audio intensity
    const innerRadius = 140 + (amplifiedAverage / 255) * 100;
    drawInnerWave(centerX, centerY, innerRadius, amplifiedAverage);

    // Outer wave responds to individual frequency bands
    const outerRadius = 280 + (amplifiedAverage / 255) * 80;
    drawOuterWaveWithAudio(centerX, centerY, outerRadius, currentDataArray);

    // Draw planets in their orbits
    drawPlanets();

    // Continue animation loop
    requestAnimationFrame(animateVisualization);
  }

  /**
   * Draw all planets in their orbits
   * Each planet has its own characteristics, orbit, and behavior,
   * creating visual variety while maintaining the cosmic theme.
   */
  function drawPlanets() {
    if (!ctx) return;

    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;

    planets.forEach((planet) => {
      // Update planet position and rotation
      planet.angle += planet.speed;
      planet.rotationAngle += planet.rotationSpeed;

      // Calculate position based on orbital parameters
      const x = centerX + Math.cos(planet.angle) * planet.distance;
      const y = centerY + Math.sin(planet.angle) * planet.distance;

      // Calculate angle to center for proper shadow orientation
      const centerAngle = Math.atan2(centerY - y, centerX - x);

      // Draw different planet types
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

  /**
   * Draw a simple dot planet
   * These basic circular planets vary in size and glow intensity,
   * creating visual hierarchy in the cosmic scene.
   *
   * @param {number} x - X coordinate of the planet
   * @param {number} y - Y coordinate of the planet
   * @param {Object} planet - Planet data object
   * @param {number} sizeMultiplier - Multiplier for planet size
   */
  function drawSimpleDot(x, y, planet, sizeMultiplier) {
    if (!ctx) return;

    ctx.save();

    const finalSize = planet.size * sizeMultiplier;

    // Subtle glow effect for dark mode
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

    // Main planet body
    ctx.beginPath();
    ctx.arc(x, y, finalSize, 0, Math.PI * 2);
    ctx.fillStyle = document.body.classList.contains("dark-mode")
      ? "rgba(255, 255, 255, 0.8)"
      : "rgba(0, 0, 0, 0.8)";
    ctx.fill();

    ctx.restore();
  }

  /**
   * Draw a planet with rings
   * This planet type has a Saturn-like ring system that adds
   * visual interest and reinforces the cosmic theme.
   *
   * @param {number} x - X coordinate of the planet
   * @param {number} y - Y coordinate of the planet
   * @param {Object} planet - Planet data object
   * @param {number} centerAngle - Angle to the center point
   */
  function drawRingDot(x, y, planet, centerAngle) {
    if (!ctx) return;

    ctx.save();

    // Main planet body
    ctx.beginPath();
    ctx.arc(x, y, planet.size * 0.7, 0, Math.PI * 2);
    ctx.fillStyle = document.body.classList.contains("dark-mode")
      ? "rgba(255, 255, 255, 0.8)"
      : "rgba(0, 0, 0, 0.8)";
    ctx.fill();

    // Ring system using ellipse for proper perspective
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

  /**
   * Draw a crescent planet
   * This planet type has a shadow that creates a crescent shape,
   * similar to moon phases, adding variety to the cosmic scene.
   *
   * @param {number} x - X coordinate of the planet
   * @param {number} y - Y coordinate of the planet
   * @param {Object} planet - Planet data object
   * @param {number} centerAngle - Angle to the center point
   */
  function drawCrescentPlanet(x, y, planet, centerAngle) {
    if (!ctx) return;

    ctx.save();

    // Planet base
    ctx.beginPath();
    ctx.arc(x, y, planet.size, 0, Math.PI * 2);
    ctx.fillStyle = document.body.classList.contains("dark-mode")
      ? "rgba(255, 255, 255, 0.8)"
      : "rgba(0, 0, 0, 0.8)";
    ctx.fill();

    // Shadow creating crescent effect
    // Shadow position is calculated based on angle to center,
    // creating a realistic lighting effect
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

  /**
   * Draw a half-moon planet
   * This planet has a straight shadow line creating a half-moon effect,
   * adding another variant to the celestial bodies in the visualization.
   *
   * @param {number} x - X coordinate of the planet
   * @param {number} y - Y coordinate of the planet
   * @param {Object} planet - Planet data object
   * @param {number} centerAngle - Angle to the center point
   */
  function drawHalfMoonPlanet(x, y, planet, centerAngle) {
    if (!ctx) return;

    ctx.save();

    // Planet base
    ctx.beginPath();
    ctx.arc(x, y, planet.size, 0, Math.PI * 2);
    ctx.fillStyle = document.body.classList.contains("dark-mode")
      ? "rgba(255, 255, 255, 0.8)"
      : "rgba(0, 0, 0, 0.8)";
    ctx.fill();

    // Half shadow creating half-moon effect
    // Shadow is perpendicular to the center angle for realistic lighting
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

  /**
   * Set up the Web Audio API for visualization
   * The audio context processes frequency data that drives the visualization,
   * creating a direct connection between sound and visuals that enhances
   * the immersive experience.
   */
  function setupAudioContext() {
    if (audioContextCreated || !audioPlayer) return;

    try {
      // Create Audio Context
      audioContext = new (window.AudioContext || window.webkitAudioContext)();

      // Set up analyzer node with error handling
      try {
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
      } catch (error) {
        console.error("Error creating analyzer:", error);
        return;
      }

      // Connect audio nodes safely
      try {
        sourceNode = audioContext.createMediaElementSource(audioPlayer);
        sourceNode.connect(analyser);
        analyser.connect(audioContext.destination);
        audioContextCreated = true;
      } catch (error) {
        console.error("Error connecting audio nodes:", error);
        // Reset audio context to prevent future errors
        audioContext = null;
        analyser = null;
      }
    } catch (error) {
      console.error("Audio context creation error:", error);
    }
  }

  /**
   * Toggle play/pause for the audio player
   * The play/pause functionality is the primary interaction for starting
   * the immersive experience. When audio begins playing, the visualization
   * is activated to create a responsive cosmic environment.
   */
  function togglePlayPause() {
    if (!audioPlayer) return;

    if (audioPlayer.paused) {
      // Start visualization regardless of audio playback
      if (!visualizationActive) {
        startVisualization();
      }

      // Play audio and handle any errors
      audioPlayer
        .play()
        .then(() => {
          if (playPauseIcon) playPauseIcon.textContent = "⏸";
        })
        .catch((error) => {
          console.error("Audio playback error:", error);
        });
    } else {
      audioPlayer.pause();
      if (playPauseIcon) playPauseIcon.textContent = "▶";
    }
  }

  /**
   * Update progress bar during audio playback
   * The progress bar provides visual feedback on playback position,
   * enhancing usability while maintaining the cosmic aesthetic.
   */
  function updateProgress() {
    if (!audioPlayer || !progressBar) return;

    const currentTime = audioPlayer.currentTime;
    const duration = audioPlayer.duration || 275;

    const progressPercent = (currentTime / duration) * 100;
    progressBar.style.width = `${progressPercent}%`;

    if (currentTimeElement) {
      currentTimeElement.textContent = formatTime(currentTime);
    }
  }

  /**
   * Update duration display when audio metadata is loaded
   * Ensures accurate time display for the audio track.
   */
  function updateDuration() {
    if (!audioPlayer || !durationElement) return;

    if (audioPlayer.duration && !isNaN(audioPlayer.duration)) {
      durationElement.textContent = formatTime(audioPlayer.duration);
    } else {
      durationElement.textContent = "4:35";
    }
  }

  /**
   * Format time in minutes:seconds
   * Creates a clean, readable time display for the audio player.
   *
   * @param {number} time - Time in seconds
   * @returns {string} Formatted time string (MM:SS)
   */
  function formatTime(time) {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  }

  /**
   * Handle seek interaction on progress bar
   * Allows users to jump to different parts of the audio track,
   * providing direct control over the experience.
   *
   * @param {Event} e - Click event on progress bar
   */
  function seek(e) {
    if (!audioPlayer || !progressContainer) return;

    const percent = e.offsetX / progressContainer.offsetWidth;
    audioPlayer.currentTime = percent * (audioPlayer.duration || 275);
  }

  /**
   * Update volume based on slider position
   * Provides precise volume control for optimal audio level.
   */
  function updateVolume() {
    if (!audioPlayer || !volumeSlider) return;

    audioPlayer.volume = volumeSlider.value;
    updateVolumeIcon();
  }

  /**
   * Toggle mute state for audio
   * Allows quick silencing without losing volume setting.
   */
  function toggleMute() {
    if (!audioPlayer) return;

    audioPlayer.muted = !audioPlayer.muted;
    updateVolumeIcon();
  }

  /**
   * Update volume icon based on current state
   * Provides visual feedback on volume/mute state.
   */
  function updateVolumeIcon() {
    if (!audioPlayer || !volumeIcon) return;

    if (audioPlayer.muted || audioPlayer.volume === 0) {
      volumeIcon.textContent = "🔈";
    } else if (audioPlayer.volume < 0.5) {
      volumeIcon.textContent = "🔉";
    } else {
      volumeIcon.textContent = "🔊";
    }
  }

  /**
   * Handle audio track end
   * Ensures continuous playback for uninterrupted study sessions.
   */
  function handleAudioEnd() {
    if (!audioPlayer || !playPauseIcon) return;

    playPauseIcon.textContent = "▶";

    audioPlayer.currentTime = 0;
    audioPlayer
      .play()
      .then(() => {
        playPauseIcon.textContent = "⏸";
      })
      .catch((error) => {
        console.error("Auto repeat playback error:", error);
      });
  }

  /**
   * Toggle timer panel visibility
   * The timer is a key feature for study sessions, helping users
   * track their focus periods without needing external tools.
   */
  function toggleTimerPanel() {
    if (!timerPanel) return;

    timerPanel.classList.toggle("hidden");

    // Adjust timer panel position based on current layout
    if (!timerPanel.classList.contains("hidden")) {
      const mainControls = document.querySelector(".main-controls");
      const playerControls = document.querySelector(".player-controls");

      if (!mainControls || !playerControls) return;

      const rect = playerControls.getBoundingClientRect();

      // Position adjustment differs between normal and fullscreen modes
      if (!isFullscreen) {
        timerPanel.style.bottom = `${mainControls.offsetHeight + 20}px`;
        timerPanel.style.right = `${
          document.body.clientWidth - rect.right + 20
        }px`;
      } else {
        // Fullscreen mode positioning
        timerPanel.style.bottom = `${mainControls.offsetHeight + 20}px`;
        timerPanel.style.right = "20px";
      }
    }
  }

  /**
   * Toggle fullscreen mode
   * Fullscreen mode creates a completely immersive experience by removing
   * all browser UI and website elements, focusing entirely on the visualization.
   */
  function toggleFullscreen() {
    isFullscreen = !isFullscreen;

    if (isFullscreen) {
      document.body.classList.add("fullscreen-mode");

      // Use appropriate fullscreen API based on browser
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
      } else if (document.documentElement.webkitRequestFullscreen) {
        document.documentElement.webkitRequestFullscreen();
      } else if (document.documentElement.msRequestFullscreen) {
        document.documentElement.msRequestFullscreen();
      }

      // Ensure canvas resizes properly after fullscreen transition
      setTimeout(() => {
        resizeCanvas();
        // Show controls initially then start auto-hide timer
        showControlsTemporarily();

        // Reposition timer panel if visible
        if (timerPanel && !timerPanel.classList.contains("hidden")) {
          toggleTimerPanel();
          setTimeout(() => toggleTimerPanel(), 100);
        }
      }, 100);
    } else {
      document.body.classList.remove("fullscreen-mode");

      // Exit fullscreen mode using appropriate API
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }

      // Ensure canvas resizes properly after fullscreen exit
      setTimeout(() => {
        resizeCanvas();

        // Always show controls in normal mode
        const customControls = document.querySelector(".custom-controls");
        if (customControls) {
          customControls.style.opacity = "1";
        }
        clearTimeout(controlsTimeout);

        // Reposition timer panel if visible
        if (timerPanel && !timerPanel.classList.contains("hidden")) {
          toggleTimerPanel();
          setTimeout(() => toggleTimerPanel(), 100);
        }
      }, 100);
    }
  }

  /**
   * Show controls temporarily in fullscreen mode
   * In fullscreen mode, controls automatically hide after inactivity to provide
   * an uninterrupted cosmic experience, reappearing with mouse movement.
   */
  function showControlsTemporarily() {
    if (!isFullscreen) return;

    const customControls = document.querySelector(".custom-controls");
    if (!customControls) return;

    customControls.style.opacity = "1";

    // Cancel any existing hide timer
    clearTimeout(controlsTimeout);

    // Set new timer to hide controls after 3 seconds of inactivity
    controlsTimeout = setTimeout(() => {
      if (isFullscreen && customControls) {
        customControls.style.opacity = "0";
      }
    }, 3000);
  }

  /**
   * Toggle timer between running and paused states
   * Provides simple control for the timer functionality.
   */
  function toggleTimer() {
    if (!timerStartStopIcon) return;

    if (timerRunning) {
      stopTimer();
      timerStartStopIcon.textContent = "▶";
    } else {
      startTimer();
      timerStartStopIcon.textContent = "⏸";
    }
  }

  /**
   * Start the timer
   * Begins counting based on selected mode (stopwatch or countdown).
   * The timer provides a structured approach to study sessions,
   * supporting techniques like the Pomodoro method.
   */
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

  /**
   * Stop the timer
   * Pauses the current timer without resetting its value.
   */
  function stopTimer() {
    clearInterval(timerInterval);
    timerRunning = false;
    if (timerStartStopIcon) {
      timerStartStopIcon.textContent = "▶";
    }
  }

  /**
   * Reset the timer
   * Returns the timer to zero, ready for a new session.
   */
  function resetTimer() {
    stopTimer();
    timerValue = 0;
    updateTimerDisplay();
    if (timerStartStopIcon) {
      timerStartStopIcon.textContent = "▶";
    }
  }

  /**
   * Toggle between stopwatch and countdown timer modes
   * Supports different study techniques with appropriate timing methods.
   * Stopwatch is useful for tracking total study time, while countdown
   * supports timed sessions like the Pomodoro technique.
   */
  function toggleTimerMode() {
    if (!timerModeLabel || !countdownSettings) return;

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

  /**
   * Set countdown timer duration
   * Allows customization of countdown study sessions.
   * Default value of 25 minutes aligns with standard Pomodoro technique.
   */
  function setCountdown() {
    if (!countdownMinutesInput) return;

    const minutes = parseInt(countdownMinutesInput.value) || 25;
    timerValue = minutes * 60;
    updateTimerDisplay();
  }

  /**
   * Update timer display with current time value
   * Formats time into minutes:seconds for easy reading.
   */
  function updateTimerDisplay() {
    if (!timerMinutes || !timerSeconds) return;

    const minutes = Math.floor(timerValue / 60);
    const seconds = timerValue % 60;

    timerMinutes.textContent = minutes < 10 ? `0${minutes}` : minutes;
    timerSeconds.textContent = seconds < 10 ? `0${seconds}` : seconds;
  }

  /**
   * Handle timer end event
   * Provides visual notification when countdown completes.
   * The flashing effect is subtle yet noticeable, avoiding harsh
   * interruptions while still effectively signaling session end.
   */
  function timerEnd() {
    if (!mediaPlayer || !audioPlayer || !playPauseIcon) return;

    mediaPlayer.classList.add("flash");

    audioPlayer.pause();
    playPauseIcon.textContent = "▶";

    setTimeout(() => {
      mediaPlayer.classList.remove("flash");
    }, 1500);
  }

  /**
   * Toggle between dark and light themes
   * While the dark theme is optimized for the cosmic experience,
   * the light theme option provides flexibility for different
   * lighting conditions and user preferences.
   */
  function toggleTheme() {
    document.body.classList.toggle("dark-mode");

    // Redraw visualization with new theme colors
    if (!visualizationActive && canvas && ctx) {
      drawInitialVisualization();
    }
  }

  /**
   * Handle keyboard shortcuts
   * Keyboard shortcuts enhance usability by providing quick access
   * to common functions without requiring mouse interaction.
   *
   * @param {KeyboardEvent} e - Keyboard event
   */
  function handleKeyDown(e) {
    if (e.code === "Space") {
      togglePlayPause();
      e.preventDefault();
    }

    if (e.code === "KeyF") {
      toggleFullscreen();
      e.preventDefault();
    }

    if (e.code === "KeyM" && audioPlayer) {
      toggleMute();
      e.preventDefault();
    }

    if (e.code === "KeyT") {
      toggleTimerPanel();
      e.preventDefault();
    }

    if (e.code === "ArrowLeft" && audioPlayer) {
      audioPlayer.currentTime = Math.max(0, audioPlayer.currentTime - 10);
      e.preventDefault();
    }

    if (e.code === "ArrowRight" && audioPlayer) {
      audioPlayer.currentTime = Math.min(
        audioPlayer.duration || 275,
        audioPlayer.currentTime + 10
      );
      e.preventDefault();
    }

    if (e.code === "ArrowUp" && audioPlayer && volumeSlider) {
      audioPlayer.volume = Math.min(1, audioPlayer.volume + 0.1);
      volumeSlider.value = audioPlayer.volume;
      updateVolumeIcon();
      e.preventDefault();
    }

    if (e.code === "ArrowDown" && audioPlayer && volumeSlider) {
      audioPlayer.volume = Math.max(0, audioPlayer.volume - 0.1);
      volumeSlider.value = audioPlayer.volume;
      updateVolumeIcon();
      e.preventDefault();
    }
  }

  /**
   * Add event listeners for fullscreen change
   * These handlers ensure proper state management when fullscreen mode
   * is exited using browser controls rather than application buttons.
   */
  document.addEventListener("fullscreenchange", handleFullscreenChange);
  document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
  document.addEventListener("mozfullscreenchange", handleFullscreenChange);
  document.addEventListener("MSFullscreenChange", handleFullscreenChange);

  /**
   * Handle fullscreen change events
   * Ensures application state remains consistent when fullscreen mode changes,
   * particularly when exited through browser controls rather than app buttons.
   */
  function handleFullscreenChange() {
    if (
      !document.fullscreenElement &&
      !document.webkitFullscreenElement &&
      !document.mozFullScreenElement &&
      !document.msFullscreenElement
    ) {
      if (isFullscreen) {
        isFullscreen = false;
        document.body.classList.remove("fullscreen-mode");

        // Always show controls in normal mode
        const customControls = document.querySelector(".custom-controls");
        if (customControls) {
          customControls.style.opacity = "1";
        }
        clearTimeout(controlsTimeout);

        // Resize the canvas to match the new dimensions
        setTimeout(resizeCanvas, 100);

        // Reposition timer panel if visible
        if (timerPanel && !timerPanel.classList.contains("hidden")) {
          setTimeout(() => toggleTimerPanel(), 100);
          setTimeout(() => toggleTimerPanel(), 200);
        }
      }
    }
  }

  // Initialize the application
  init();
});
