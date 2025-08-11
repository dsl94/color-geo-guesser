document.addEventListener("DOMContentLoaded", () => {
    // Elements
    const startBtn = document.getElementById("startBtn");
    const resetBtn = document.getElementById("resetBtn");
    const player1NameInput = document.getElementById("player1");
    const player2NameInput = document.getElementById("player2");
    const roundCountInput = document.getElementById("rounds");
    const roundNumberDisplay = document.getElementById("roundNumber");
    const totalRoundsDisplay = document.getElementById("totalRounds");
    const targetColorBox = document.getElementById("target");
    const player1ScoreDisplay = document.getElementById("p1Score");
    const player2ScoreDisplay = document.getElementById("p2Score");
    const scoreTableBody = document.querySelector("#scoreTable tbody");

    // Tutorial
    const tutorialBtn = document.getElementById("tutorialBtn");
    const tutorialSection = document.getElementById("tutorial");
    const closeTutorialBtn = document.getElementById("closeTutorial");

    tutorialBtn.addEventListener("click", () => tutorialSection.classList.remove("hidden"));
    closeTutorialBtn.addEventListener("click", () => tutorialSection.classList.add("hidden"));

    // Canvas setup
    const wheelCanvas = document.getElementById("wheel");
    const ctx = wheelCanvas.getContext("2d");

    // Game state
    let roundsToPlay = 0;
    let currentTurn = 0;       // increments every player guess
    let currentPlayer = 1;     // 1 or 2
    let p1Total = 0;
    let p2Total = 0;
    let targetHSL = null;

    // Draw color wheel (same as your original)
    function drawColorWheel() {
        const radius = wheelCanvas.width / 2;
        const img = ctx.createImageData(wheelCanvas.width, wheelCanvas.height);
        const data = img.data;
        for (let y = -radius; y < radius; y++) {
            for (let x = -radius; x < radius; x++) {
                const dx = x / radius;
                const dy = y / radius;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if (dist <= 1) {
                    let angle = Math.atan2(dy, dx);
                    if (angle < 0) angle += 2 * Math.PI;
                    const hue = angle * 180 / Math.PI;
                    const sat = dist;
                    const light = 0.5;
                    const [r,g,b] = hslToRgb(hue/360, sat, light);
                    const px = ((y+radius)*wheelCanvas.width + (x+radius)) * 4;
                    data[px] = r; data[px+1] = g; data[px+2] = b; data[px+3] = 255;
                }
            }
        }
        ctx.putImageData(img, 0, 0);
    }

    // HSL to RGB converter (same as your original)
    function hslToRgb(h, s, l) {
        let r, g, b;
        if (s === 0) r = g = b = l;
        else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };
            const q = l < 0.5 ? l * (1 + s) : l + s - l*s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }
        return [Math.round(r*255), Math.round(g*255), Math.round(b*255)];
    }

    // Generate random target color in HSL space
    function randomColor() {
        return { h: Math.random()*360, s: 1, l: 0.5 };
    }

    // Set the current target color and update the target box
    function setTarget() {
        targetHSL = randomColor();
        const [r,g,b] = hslToRgb(targetHSL.h/360, targetHSL.s, targetHSL.l);
        targetColorBox.style.backgroundColor = `rgb(${r},${g},${b})`;
    }

    // Euclidean distance in RGB space (score)
    function colorDistance(c1, c2){
        return Math.sqrt((c1[0]-c2[0])**2 + (c1[1]-c2[1])**2 + (c1[2]-c2[2])**2);
    }

    // Start the game
    function startGame() {
        roundsToPlay = parseInt(roundCountInput.value) || 5;
        currentTurn = 1;
        currentPlayer = 1;
        p1Total = 0;
        p2Total = 0;
        scoreTableBody.innerHTML = "";
        totalRoundsDisplay.textContent = roundsToPlay;
        roundNumberDisplay.textContent = 1;
        player1ScoreDisplay.textContent = `${player1NameInput.value || "Player 1"}: 0`;
        player2ScoreDisplay.textContent = `${player2NameInput.value || "Player 2"}: 0`;
        setTarget();
    }

    // Reset game (reload page)
    function resetGame() {
        location.reload();
    }

    // Handle click on color wheel for guessing
    wheelCanvas.addEventListener("click", (e) => {
        if (!roundsToPlay) return;

        const rect = wheelCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left - wheelCanvas.width / 2;
        const y = e.clientY - rect.top - wheelCanvas.height / 2;
        const dist = Math.sqrt(x*x + y*y);
        if (dist > wheelCanvas.width / 2) return;

        // Convert click pos to HSL guess
        let angle = Math.atan2(y, x);
        if (angle < 0) angle += 2 * Math.PI;
        const hue = angle * 180 / Math.PI;
        const sat = dist / (wheelCanvas.width / 2);
        const light = 0.5;
        const guessRGB = hslToRgb(hue/360, sat, light);
        const targetRGB = hslToRgb(targetHSL.h/360, targetHSL.s, targetHSL.l);
        const score = +colorDistance(guessRGB, targetRGB).toFixed(2);

        // Player names
        const pName = currentPlayer === 1 ? (player1NameInput.value || "Player 1") : (player2NameInput.value || "Player 2");

        // Color swatches for table
        const targetSwatch = `<div class="color-box" style="background: rgb(${targetRGB.join(',')})"></div>`;
        const guessSwatch = `<div class="color-box" style="background: rgb(${guessRGB.join(',')})"></div>`;

        // Append row to scoreboard table
        const roundNum = Math.ceil(currentTurn / 2);
        const row = `<tr>
      <td>${roundNum}</td>
      <td>${pName}</td>
      <td>${targetSwatch}</td>
      <td>${guessSwatch}</td>
      <td>${score}</td>
    </tr>`;
        scoreTableBody.insertAdjacentHTML('beforeend', row);

        // Update totals
        if (currentPlayer === 1) p1Total += score; else p2Total += score;
        player1ScoreDisplay.textContent = `${player1NameInput.value || "Player 1"}: ${p1Total.toFixed(2)}`;
        player2ScoreDisplay.textContent = `${player2NameInput.value || "Player 2"}: ${p2Total.toFixed(2)}`;

        // Switch player and possibly next round
        if (currentPlayer === 2) {
            if (roundNum >= roundsToPlay) {
                // End game, announce winner
                const winner = p1Total < p2Total ? player1NameInput.value || "Player 1" : player2NameInput.value || "Player 2";
                const winScore = p1Total < p2Total ? p1Total.toFixed(2) : p2Total.toFixed(2);
                Swal.fire({
                    title: "Game Over!",
                    html: `<p>Winner: <strong>${winner}</strong></p><p>Score: ${winScore}</p>`,
                    confirmButtonText: "OK"
                });
                roundsToPlay = 0;
                return;
            }
            roundNumberDisplay.textContent = roundNum + 1;
        }
        currentPlayer = currentPlayer === 1 ? 2 : 1;
        currentTurn++;
        setTarget();
    });

    // Bind buttons
    startBtn.addEventListener("click", startGame);
    resetBtn.addEventListener("click", resetGame);

    // Draw the wheel on load
    drawColorWheel();
});
