/**
 * BREATHING CONSTELLATIONS - Interactive Star Field
 * Interactive Media Assignment - OART1013
 * Student: Wonjun Kim (S3938263)
 *
 * PERSONAL STORY & DESIGN CONTEXT:
 * This interactive experience is born from childhood memories of lying under
 * the vast night sky, wondering what would happen if I could connect all those
 * countless stars with invisible lines. As I grew older, I learned about
 * constellations - those ancient patterns humans have traced in the heavens
 * for millennia.
 *
 * But what fascinated me most was the impermanence. I would create my own
 * personal constellations, connecting stars in ways that made sense to me,
 * only to find them changed the next night. Stars would move, fade, or new
 * ones would appear. Each night required new acts of creative connection.
 *
 * This piece embodies that childhood wonder and the acceptance of cosmic
 * impermanence. Users become cosmic architects, continuously creating
 * constellation patterns in an ever-evolving universe that mirrors the
 * dynamic nature of the real night sky.
 *
 * INTERACTION DESIGN RATIONALE:
 * - HOVER: Represents the focused attention and wonder that accelerates
 *   our ability to perceive and create meaning in the cosmos
 * - CLICK: Embodies that moment of recognition when scattered points
 *   suddenly resolve into meaningful patterns
 *
 * TECHNICAL APPROACH:
 * Canvas-based rendering provides smooth 60fps animations while maintaining
 * performance across devices. Object-oriented design allows for complex
 * star behaviors and lifecycle management that mirror natural phenomena.
 *
 * WEBSITES CONSULTED:
 * ChatGPT, YouTube, and Gemini were instrumental in helping me complete my assignment.
 */

// Global variables for application state
let canvas, ctx;
let starCountElement, constellationCountElement;
let mouseX = 0,
  mouseY = 0,
  isMouseInCanvas = false;
let totalStarsCreated = 0,
  activeConstellations = 0;
let universe = null;

/**
 * STAR CLASS - Individual Star Entity
 * Each star represents a point of light with its own lifecycle,
 * mirroring how real stars are born, live, and eventually fade away.
 * The organic movement and twinkling effects capture that sense of
 * aliveness I always felt when watching the night sky as a child.
 */
class Star {
  constructor(x, y, maxSize) {
    // Position and movement properties
    this.x = x;
    this.y = y;
    this.originalX = x;
    this.originalY = y;

    // Growth and lifecycle properties - each star has its own destiny
    this.size = 0;
    this.maxSize = maxSize || Math.random() * 2 + 1;
    this.growthRate = Math.random() * 0.03 + 0.01;
    this.opacity = 0;
    this.isActive = true;

    // Twinkling properties - the gentle pulse that makes stars feel alive
    this.twinkleSpeed = Math.random() * 0.02 + 0.01;
    this.twinkleTimer = Math.random() * Math.PI * 2;

    // Organic movement - stars drift gently like they're floating in cosmic winds
    this.moveSpeed =
      (Math.random() * 0.08 + 0.02) * (this.maxSize < 1.5 ? 1.5 : 1);
    this.moveAngle = Math.random() * Math.PI * 2;
    this.moveRange = Math.max(1.5, 5 / this.maxSize);

    // Lifespan properties - every star has its time, just like in the real universe
    this.lifespan = Math.random() * 15000 + 15000;
    this.birthTime = Date.now();
    this.fadeOutTime = this.birthTime + this.lifespan * 0.8;

    // Visual properties
    this.color = { r: 255, g: 255, b: 255 };

    // Constellation properties - connection with other stars
    this.connections = [];
    this.isPartOfConstellation = false;
    this.constellationColor = null;
  }

  /**
   * Star growth and lifecycle management
   * This method handles the natural evolution of each star,
   * from birth through maturity to eventual fading.
   * The accelerated growth represents how focused attention
   * can make us more aware of cosmic beauty.
   */
  grow(accelerated = false) {
    if (!this.isActive) return;

    const now = Date.now();

    // Handle end-of-life fade out - like watching a star disappear over time
    if (now > this.fadeOutTime) {
      const fadeOutDuration = this.lifespan * 0.2;
      const fadeOutElapsed = now - this.fadeOutTime;
      const fadeOutProgress = fadeOutElapsed / fadeOutDuration;

      if (fadeOutProgress >= 1) {
        this.isActive = false;
        this.size = 0;
        this.opacity = 0;
        return;
      }

      this.opacity = Math.max(0, 1 - fadeOutProgress);
    } else {
      // Normal growth phase - accelerated when user pays attention (hover)
      const growthMultiplier = accelerated ? 5 : 1;
      this.size += this.growthRate * growthMultiplier;

      if (this.size >= this.maxSize) {
        this.size = this.maxSize;
      }

      this.opacity = Math.min(1, this.size / this.maxSize);
    }

    // Organic movement - stars drift gently in cosmic currents
    this.moveAngle += this.moveSpeed * 0.01;
    this.x = this.originalX + Math.cos(this.moveAngle) * this.moveRange;
    this.y = this.originalY + Math.sin(this.moveAngle) * this.moveRange;

    // Twinkling effect - the gentle pulse that brings stars to life
    this.twinkleTimer += this.twinkleSpeed;
    const twinkleFactor = Math.sin(this.twinkleTimer) * 0.2 + 0.8;
    this.displayOpacity = this.opacity * twinkleFactor;
  }

  /**
   * Star rendering with glow effects
   * The visual representation captures the luminous quality of real stars,
   * with soft glows that extend beyond their physical boundaries.
   */
  draw() {
    if (this.size <= 0 || !this.isActive) return;

    // Determine color based on constellation membership
    let colorStr;
    if (this.isPartOfConstellation && this.constellationColor) {
      colorStr = `rgba(${this.constellationColor.r}, ${this.constellationColor.g}, ${this.constellationColor.b}, ${this.displayOpacity})`;
    } else {
      colorStr = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${this.displayOpacity})`;
    }

    // Draw the main star body
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = colorStr;
    ctx.fill();

    // Draw the glow effect for larger stars - mimics atmospheric scintillation
    if (this.size > 1) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * 2, 0, Math.PI * 2);

      let glowColor;
      if (this.isPartOfConstellation && this.constellationColor) {
        glowColor = `rgba(${this.constellationColor.r}, ${
          this.constellationColor.g
        }, ${this.constellationColor.b}, ${this.displayOpacity * 0.3})`;
      } else {
        glowColor = `rgba(255, 255, 255, ${this.displayOpacity * 0.3})`;
      }

      const gradient = ctx.createRadialGradient(
        this.x,
        this.y,
        this.size * 0.5,
        this.x,
        this.y,
        this.size * 3
      );
      gradient.addColorStop(0, glowColor);
      gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = gradient;
      ctx.fill();
    }

    // Draw constellation connections
    this.drawConnections();
  }

  /**
   * Constellation connection rendering
   * These lines represent the human impulse to find patterns and meaning
   * in seemingly random distributions of light - the essence of constellation-making.
   */
  drawConnections() {
    if (this.connections.length === 0) return;

    for (const connection of this.connections) {
      if (!connection.star.isActive || !this.isActive) continue;

      // Gradual fade-in/out of connections creates organic feeling
      const fadeStep = 0.006;
      if (connection.opacity < connection.targetOpacity) {
        connection.opacity = Math.min(
          connection.targetOpacity,
          connection.opacity + Math.max(connection.fadeSpeed, fadeStep)
        );
      } else if (connection.opacity > connection.targetOpacity) {
        connection.opacity = Math.max(
          connection.targetOpacity,
          connection.opacity - Math.max(connection.fadeSpeed * 0.8, fadeStep)
        );
      }

      if (connection.opacity <= 0) continue;

      // Draw the connection line
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(connection.star.x, connection.star.y);

      const lineOpacity =
        Math.min(this.displayOpacity, connection.star.displayOpacity) *
        connection.opacity *
        0.7;
      const lineWidth = 1 + connection.opacity * 1.2;

      ctx.strokeStyle = `rgba(${connection.color.r}, ${connection.color.g}, ${connection.color.b}, ${lineOpacity})`;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = "round";
      ctx.stroke();
    }

    // Clean up faded connections
    this.connections = this.connections.filter(
      (connection) => connection.opacity > 0 || connection.targetOpacity > 0
    );
  }

  /**
   * Calculate distance to another star
   * Used for constellation formation algorithms
   */
  distanceTo(otherStar) {
    const dx = this.x - otherStar.x;
    const dy = this.y - otherStar.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Add connection to another star
   * This represents the moment of pattern recognition -
   * when separate points suddenly become part of a larger design.
   */
  addConnection(star, color) {
    const existingConnection = this.connections.find(
      (conn) => conn.star === star && conn.color === color
    );

    if (!existingConnection) {
      const fadeSpeed = 0.08;
      const targetOpacity = 0.5;

      this.connections.push({
        star,
        color,
        opacity: 0,
        targetOpacity: targetOpacity,
        fadeSpeed: fadeSpeed,
        maxOpacity: targetOpacity,
      });

      this.isPartOfConstellation = true;
      this.constellationColor = color;
    }
  }
}

/**
 * Canvas resize handler
 * Ensures the universe expands to fill any viewing window
 */
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

/**
 * Mouse and Touch event setup
 * These interactions transform the user into a cosmic force,
 * able to influence star formation and pattern creation.
 * Mobile touch support ensures the cosmic experience is accessible
 * across all devices, just like stars can be appreciated anywhere.
 */
function setupMouseEvents() {
  // Mouse events for desktop
  canvas.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    isMouseInCanvas = true;
  });

  canvas.addEventListener("mouseenter", () => {
    isMouseInCanvas = true;
  });

  canvas.addEventListener("mouseleave", () => {
    isMouseInCanvas = false;
  });

  canvas.addEventListener("click", (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (universe && universe.handleClick) {
      universe.handleClick(x, y);
    }
  });

  // Touch events for mobile devices
  // Touch move simulates hover - creates stars where finger moves
  canvas.addEventListener("touchmove", (e) => {
    e.preventDefault(); // Prevent scrolling
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    mouseX = touch.clientX;
    mouseY = touch.clientY;
    isMouseInCanvas = true;

    // Create stars along touch path for dramatic effect
    if (universe && Math.random() < 0.7) {
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      universe.createStarNearPosition(x, y);
    }
  });

  // Touch start simulates mouse enter
  canvas.addEventListener("touchstart", (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    mouseX = touch.clientX;
    mouseY = touch.clientY;
    isMouseInCanvas = true;
  });

  // Touch end creates constellation and simulates mouse leave
  canvas.addEventListener("touchend", (e) => {
    e.preventDefault();

    // Create constellation at last touch position
    if (universe && universe.handleClick && mouseX && mouseY) {
      const rect = canvas.getBoundingClientRect();
      const x = mouseX - rect.left;
      const y = mouseY - rect.top;
      universe.handleClick(x, y);
    }

    // Simulate mouse leave after a brief delay
    setTimeout(() => {
      isMouseInCanvas = false;
    }, 1000);
  });

  // Handle touch cancel (when touch is interrupted)
  canvas.addEventListener("touchcancel", (e) => {
    e.preventDefault();
    isMouseInCanvas = false;
  });

  // Prevent default touch behaviors that might interfere
  document.addEventListener(
    "touchstart",
    (e) => {
      if (e.target === canvas) {
        e.preventDefault();
      }
    },
    { passive: false }
  );

  document.addEventListener(
    "touchend",
    (e) => {
      if (e.target === canvas) {
        e.preventDefault();
      }
    },
    { passive: false }
  );

  document.addEventListener(
    "touchmove",
    (e) => {
      if (e.target === canvas) {
        e.preventDefault();
      }
    },
    { passive: false }
  );
}

/**
 * Main animation loop
 * The heartbeat of the universe, continuously updating and rendering
 */
function animate() {
  if (universe) {
    universe.update();
    universe.render();
  }
  requestAnimationFrame(animate);
}

/**
 * Application initialization
 * Sets up the cosmic playground where wonder can unfold
 */
function initializeApp() {
  console.log("Initializing Breathing Constellations...");

  canvas = document.getElementById("canvas");
  ctx = canvas.getContext("2d");
  starCountElement = document.getElementById("star-count");
  constellationCountElement = document.getElementById("constellation-count");

  if (!canvas) {
    console.error("Canvas element not found!");
    return;
  }

  if (!ctx) {
    console.error("Canvas context not available!");
    return;
  }

  console.log("Canvas found and context created");

  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);
  setupMouseEvents();

  // Initialize the universe object - the container for all cosmic phenomena
  universe = {
    stars: [],
    maxStars: 500,
    starGenerationRate: 3,
    starGenerationTimer: 0,

    // Color palette for constellations - each represents different cosmic emotions
    constellationColors: [
      { r: 100, g: 200, b: 255 }, // Celestial blue
      { r: 255, g: 150, b: 100 }, // Warm orange
      { r: 200, g: 100, b: 255 }, // Mystic purple
      { r: 100, g: 255, b: 150 }, // Aurora green
      { r: 255, g: 100, b: 150 }, // Cosmic pink
      { r: 255, g: 255, b: 100 }, // Solar yellow
      { r: 150, g: 150, b: 255 }, // Nebula violet
    ],

    /**
     * Universe initialization
     * Creates the initial stellar population
     */
    init: function () {
      console.log("Initializing universe with stars...");
      for (let i = 0; i < 150; i++) {
        this.createRandomStar();
      }
      this.updateUI();
      console.log(`Created ${this.stars.length} initial stars`);
    },

    /**
     * Create a new star at random position
     * Each star birth represents infinite potential
     */
    createRandomStar: function () {
      if (this.stars.length >= this.maxStars) return;

      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const maxSize =
        Math.random() < 0.05
          ? Math.random() * 2 + 2
          : Math.random() * 1.5 + 0.5;

      const newStar = new Star(x, y, maxSize);
      this.stars.push(newStar);
      totalStarsCreated++;
    },

    /**
     * Create star near user's attention point
     * User focus accelerates cosmic creation - attention manifests reality
     */
    createStarNearPosition: function (x, y) {
      if (this.stars.length >= this.maxStars) return;

      const radius = Math.random() * 100;
      const angle = Math.random() * Math.PI * 2;
      const starX = x + Math.cos(angle) * radius;
      const starY = y + Math.sin(angle) * radius;

      if (
        starX < 0 ||
        starX > canvas.width ||
        starY < 0 ||
        starY > canvas.height
      )
        return;

      const maxSize =
        Math.random() < 0.1 ? Math.random() * 2 + 2 : Math.random() * 1.5 + 0.5;

      const newStar = new Star(starX, starY, maxSize);
      this.stars.push(newStar);
      totalStarsCreated++;
    },

    /**
     * Find stars within constellation-forming distance
     * The foundation of pattern recognition
     */
    findNearbyStars: function (x, y, radius) {
      return this.stars.filter((star) => {
        const dx = star.x - x;
        const dy = star.y - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return (
          distance <= radius && star.size > star.maxSize * 0.7 && star.isActive
        );
      });
    },

    /**
     * Get random constellation color
     * Each color represents a different cosmic mood or meaning
     */
    getRandomConstellationColor: function () {
      return this.constellationColors[
        Math.floor(Math.random() * this.constellationColors.length)
      ];
    },

    /**
     * Handle user click - the moment of pattern creation
     * This represents that instant when scattered stars suddenly resolve
     * into meaningful patterns, just like my childhood constellation-making
     */
    handleClick: function (x, y) {
      const nearbyStars = this.findNearbyStars(x, y, 150);

      if (nearbyStars.length >= 1) {
        const constellationColor = this.getRandomConstellationColor();

        // Find the closest star to click point as constellation seed
        let closestStar = nearbyStars[0];
        let minDistance = Math.sqrt(
          (closestStar.x - x) ** 2 + (closestStar.y - y) ** 2
        );

        for (const star of nearbyStars) {
          const distance = Math.sqrt((star.x - x) ** 2 + (star.y - y) ** 2);
          if (distance < minDistance) {
            minDistance = distance;
            closestStar = star;
          }
        }

        // Create the constellation recursively, spreading like recognition itself
        this.createRecursiveConstellation(
          closestStar,
          constellationColor,
          new Set(),
          0
        );
        activeConstellations++;
        this.updateUI();
      }
    },

    /**
     * Recursive constellation creation algorithm
     * This mirrors how pattern recognition spreads - one connection leads to another,
     * building complex meaning from simple relationships, just like how I would
     * trace patterns across the night sky as a child.
     */
    createRecursiveConstellation: function (
      startStar,
      color,
      visitedStars,
      depth
    ) {
      if (depth > 15 || visitedStars.has(startStar)) return;

      visitedStars.add(startStar);

      // Find potential connection targets
      const nearbyStars = this.stars.filter((star) => {
        if (star === startStar || visitedStars.has(star) || !star.isActive)
          return false;
        const distance = startStar.distanceTo(star);
        return distance < 140;
      });

      // Determine number of connections - decreases with depth for organic spread
      const baseConnections = Math.max(1, 4 - Math.floor(depth / 3));
      const connectionCount = Math.min(
        nearbyStars.length,
        Math.floor(Math.random() * 2) + baseConnections
      );

      // Prioritize closer stars for more natural constellation shapes
      nearbyStars.sort(
        (a, b) => startStar.distanceTo(a) - startStar.distanceTo(b)
      );

      // Create connections with staggered timing for organic growth
      for (let i = 0; i < connectionCount; i++) {
        const targetStar = nearbyStars[i];
        const connectionDelay = depth * 80 + Math.random() * 60;

        setTimeout(() => {
          if (startStar.isActive && targetStar.isActive) {
            startStar.addConnection(targetStar, color);
            targetStar.addConnection(startStar, color);

            // Recursive spread with decreasing probability
            const continueProbability = Math.max(0.3, 0.9 - depth * 0.05);
            if (Math.random() < continueProbability) {
              setTimeout(() => {
                this.createRecursiveConstellation(
                  targetStar,
                  color,
                  visitedStars,
                  depth + 1
                );
              }, Math.random() * 40 + 20);
            }
          }
        }, connectionDelay);
      }

      // Schedule constellation fade-out - impermanence like real star patterns
      const fadeDelay = Math.random() * 10000 + 8000;
      setTimeout(() => {
        this.fadeOutConstellation(startStar, color);
      }, fadeDelay);
    },

    /**
     * Fade out constellation connections
     * This represents the transient nature of patterns - they exist,
     * bring meaning and beauty, then fade to make room for new discoveries.
     * Just like how my childhood constellations would disappear and require
     * constant recreation.
     */
    fadeOutConstellation: function (star, color) {
      if (!star.isActive) return;

      // Begin fade-out process for this star's connections
      star.connections.forEach((connection) => {
        if (connection.color === color) {
          connection.targetOpacity = 0;
          connection.fadeSpeed = 0.015;

          // Fade reciprocal connections
          if (connection.star.isActive) {
            const reciprocalConnection = connection.star.connections.find(
              (conn) => conn.star === star && conn.color === color
            );
            if (reciprocalConnection) {
              reciprocalConnection.targetOpacity = 0;
              reciprocalConnection.fadeSpeed = 0.015;
            }
          }
        }
      });

      // Cascade the fade-out to connected stars with organic timing
      const connectedStars = star.connections.filter(
        (conn) => conn.color === color && conn.targetOpacity > 0
      );

      connectedStars.forEach((connection, index) => {
        const baseDelay = 300;
        const randomDelay = Math.random() * 600;
        const cascadeDelay = index * 80;

        setTimeout(() => {
          this.fadeOutConstellation(connection.star, color);
        }, baseDelay + randomDelay + cascadeDelay);
      });

      // Clean up empty connections after fade
      setTimeout(() => {
        star.connections = star.connections.filter(
          (connection) => connection.opacity > 0 || connection.targetOpacity > 0
        );

        if (star.connections.length === 0) {
          star.isPartOfConstellation = false;
          star.constellationColor = null;
        }
      }, 4000);

      // Update constellation count
      setTimeout(() => {
        activeConstellations = Math.max(0, activeConstellations - 1);
        this.updateUI();
      }, 6000);
    },

    /**
     * Update UI statistics
     * Provides feedback on the cosmic creation process
     */
    updateUI: function () {
      if (starCountElement) {
        starCountElement.textContent = totalStarsCreated;
      }
      if (constellationCountElement) {
        constellationCountElement.textContent = activeConstellations;
      }
    },

    /**
     * Main universe update loop
     * Handles star generation, growth, and lifecycle management.
     * This continuous process mirrors the eternal cycle of stellar
     * birth and death that fascinated me during those childhood nights
     * spent stargazing.
     */
    update: function () {
      // Regular star generation - the universe is always creating
      this.starGenerationTimer++;
      if (this.starGenerationTimer >= 15 / this.starGenerationRate) {
        this.createRandomStar();
        this.starGenerationTimer = 0;
      }

      // Accelerated creation near user attention - focus manifests reality
      if (isMouseInCanvas && Math.random() < 0.5) {
        this.createStarNearPosition(mouseX, mouseY);
      }

      // Random stellar events - the universe has its own rhythm
      if (Math.random() < 0.15) {
        this.createRandomStar();
      }

      // Remove inactive stars - natural cosmic recycling
      this.stars = this.stars.filter((star) => star.isActive);

      // Maintain healthy stellar population
      if (this.stars.length < this.maxStars * 0.6 && Math.random() < 0.4) {
        this.createRandomStar();
      }

      // Update all active stars
      for (const star of this.stars) {
        if (isMouseInCanvas) {
          // Check if star is near mouse cursor for acceleration
          const dx = star.x - mouseX;
          const dy = star.y - mouseY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const isAccelerated = distance < 180;
          star.grow(isAccelerated);
        } else {
          star.grow();
        }
      }

      // Periodic UI updates
      if (Math.random() < 0.01) {
        this.updateUI();
      }
    },

    /**
     * Render the universe
     * Draws all stars and their connections to create the visual experience.
     * Each frame is a new moment in cosmic time, capturing the ever-changing
     * beauty of the stellar dance.
     */
    render: function () {
      // Clear previous frame - each moment is fresh
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw all active stars
      for (const star of this.stars) {
        star.draw();
      }
    },
  };

  // Initialize and start the cosmic experience
  console.log("Starting universe initialization...");
  universe.init();
  console.log("Starting animation loop...");
  animate();
}

// Begin the experience when the page loads
document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM loaded, starting app...");
  initializeApp();
});
