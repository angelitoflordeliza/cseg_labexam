// ==============================
// GAME VARIABLES
// ==============================
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let player = { x: 380, y: 420, size: 40, speed: 6, img: new Image() };
player.img.src = "player.png";

let obstacles = [];
let gameRunning = false;
let decisionPending = false;
let decisionIndex = 0;
let worldColor = "#f0e4c2"; // Cuphead-style sand

let keys = { left: false, right: false };
let score = 0;
let speedMultiplier = 1;
let lastSpawn = 0;

// Score thresholds for blessings
const decisionTriggers = [500, 1500, 3000, 5000, 8000];

// ==============================
// DECISION EVENTS / BLESSINGS
// ==============================
const decisionEvents = [
    { text: "A spirit of the dunes whispers. Choose a boon:", A: "Windform: Move Faster", B: "Stoneform: Smaller Hitbox" },
    { text: "Lightning crackles in the sands. Pick your blessing:", A: "Giantstride: Bigger but Slower", B: "Needleform: Faster but Smaller" },
    { text: "Mystical light shimmers. Select your boon:", A: "Shadow Step: Dodge Obstacles More Easily", B: "Ironhide: Become Tougher" },
    { text: "A vortex appears. Choose your fate:", A: "Chaos Flux: Random speed & size", B: "Blazeform: Faster & Brighter aura" }
];

let choicesMade = [];
let bgY = 0;

// ==============================
// INPUT
// ==============================
document.addEventListener("keydown", e => {
    if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") keys.left = true;
    if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") keys.right = true;
});
document.addEventListener("keyup", e => {
    if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") keys.left = false;
    if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") keys.right = false;
});

// ==============================
// START GAME
// ==============================
document.getElementById("start-btn").onclick = () => {
    document.getElementById("intro-screen").style.display = "none";
    canvas.style.display = "block";
    startGame();
};

function startGame() {
    gameRunning = true;
    gameLoop();
}

// ==============================
// GAME LOOP
// ==============================
function gameLoop() {
    if (!gameRunning) return;
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// ==============================
// UPDATE
// ==============================
function update() {
    if (!gameRunning) return;

    score += 1;
    speedMultiplier = 1 + score / 2000;

    // Update player
    if (keys.left) player.x -= player.speed;
    if (keys.right) player.x += player.speed;
    player.x = Math.max(0, Math.min(canvas.width - player.size, player.x));

    // Spawn obstacles
    if (score - lastSpawn > 30) {
        spawnObstacle();
        lastSpawn = score;
    }

    // Move obstacles
    obstacles.forEach(o => o.y += o.speed * speedMultiplier);

    // Collision detection
    for (let o of obstacles) {
        if (o.y < player.y + player.size &&
            o.y + o.size > player.y &&
            o.x < player.x + player.size &&
            o.x + o.size > player.x) {
            endGame("Game Over",
                `Final Score: ${score}\nThe Runner's spark fades into the dunes...`);
        }
    }

    obstacles = obstacles.filter(o => o.y < canvas.height + 40);

    // Trigger blessings based on score
    if (!decisionPending) {
        let triggerIndex = decisionTriggers.findIndex(threshold => score >= threshold && !choicesMade[threshold]);
        if (triggerIndex !== -1) {
            triggerDecision();
            choicesMade[decisionTriggers[triggerIndex]] = true;
        }
    }

    // Move background
    bgY += 2 * speedMultiplier;
    if (bgY >= 60) bgY = 0;
}

// ==============================
// DRAW
// ==============================
function draw() {
    // Draw hand-painted dunes
    ctx.fillStyle = worldColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw wavy inked dunes
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    for (let i = -60; i < canvas.height; i += 60) {
        let y = i + (bgY % 60);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.quadraticCurveTo(canvas.width / 2, y + 15, canvas.width, y);
        ctx.stroke();
    }

    // Draw player with original ratio
    if (player.img.complete) {
        const aspectRatio = player.img.width / player.img.height;
        const drawWidth = player.size;
        const drawHeight = player.size / aspectRatio;
        ctx.drawImage(player.img, player.x, player.y, drawWidth, drawHeight);
    } else {
        ctx.fillStyle = "#fff";
        ctx.fillRect(player.x, player.y, player.size, player.size);
    }

    // Draw obstacles
    obstacles.forEach(o => {
        if (o.img && o.img.complete) {
            const aspect = o.img.width / o.img.height;
            ctx.drawImage(o.img, o.x, o.y, o.size, o.size / aspect);
        } else {
            ctx.fillStyle = "#ff4444";
            ctx.strokeStyle = "#000";
            ctx.lineWidth = 2;
            ctx.fillRect(o.x, o.y, o.size, o.size);
            ctx.strokeRect(o.x, o.y, o.size, o.size);
        }
    });

    // Draw score
    ctx.fillStyle = "#fff8e7";
    ctx.font = "20px 'Press Start 2P'";
    ctx.fillText("Score: " + score, 10, 30);
}

// ==============================
// SPAWN OBSTACLES
// ==============================
function spawnObstacle() {
    const imgFiles = ["obstacle1.png", "obstacle2.png", "obstacle3.png"];
    const img = new Image();
    const file = imgFiles[Math.floor(Math.random() * imgFiles.length)];
    img.src = file;

    obstacles.push({
        x: Math.random() * (canvas.width - 40),
        y: -40,
        size: 40,
        speed: 3 + Math.random() * 2,
        img: img
    });
}

// ==============================
// DECISION EVENTS
// ==============================
function triggerDecision() {
    gameRunning = false;
    decisionPending = true;

    const box = document.getElementById("decision-box");
    let event = decisionEvents[Math.floor(Math.random() * decisionEvents.length)];

    document.getElementById("decision-text").innerText = event.text;
    document.getElementById("choiceA").innerText = event.A;
    document.getElementById("choiceB").innerText = event.B;

    box.classList.remove("hidden");

    document.getElementById("choiceA").onclick = () => makeChoice("A", event);
    document.getElementById("choiceB").onclick = () => makeChoice("B", event);
}

// ==============================
// APPLY BLESSINGS
// ==============================
function makeChoice(choice, event) {
    choicesMade.push(choice);

    switch (event.text) {
        case decisionEvents[0].text:
            if (choice === "A") { player.speed += 2; worldColor = "#3af"; }
            if (choice === "B") { player.size = Math.max(20, player.size - 10); worldColor = "#7f3"; }
            break;
        case decisionEvents[1].text:
            if (choice === "A") { player.size += 8; player.speed = Math.max(3, player.speed - 2); worldColor = "#fa3"; }
            if (choice === "B") { player.speed += 1; player.size = Math.max(15, player.size - 6); worldColor = "#f3f"; }
            break;
        case decisionEvents[2].text:
            if (choice === "A") { player.speed += 1.5; worldColor = "#09f"; }
            if (choice === "B") { player.size += 4; worldColor = "#f90"; }
            break;
        case decisionEvents[3].text:
            if (choice === "A") { 
                player.speed = 3 + Math.random() * 6;
                player.size = 20 + Math.random() * 20;
                worldColor = "#f0f";
            }
            if (choice === "B") {
                player.speed += 2;
                worldColor = "#fa0";
            }
            break;
    }

    decisionPending = false;
    document.getElementById("decision-box").classList.add("hidden");
    gameRunning = true;
    gameLoop();
}

// ==============================
// END GAME
// ==============================
function endGame(title, text) {
    gameRunning = false;
    canvas.style.display = "none";

    const end = document.getElementById("ending-screen");
    document.getElementById("ending-title").innerText = title;
    document.getElementById("ending-text").innerText = text;

    end.classList.remove("hidden");
}
