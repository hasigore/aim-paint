const Config = {
    width: 1200,
    height: 800,
    dotCount: 6,
    dotRadius: 25,
    centerDotRadius: 3,
    requiredHoldTime: 0.8,
    crossColor: '#00ff88'
};

const canvas = document.getElementById("aimCanvas");
const ctx = canvas.getContext("2d");

let mousePos = { x: 0, y: 0 };
let dots = [];
let stats = { hits: 0, resets: 0 };

function initCanvas() {
    canvas.width = Config.width;
    canvas.height = Config.height;
    spawnAllDots();
}

function spawnSingleDot() {
    const margin = Config.dotRadius + 30;
    let x, y, tooClose;
    let attempts = 0;

    do {
        tooClose = false;
        x = margin + Math.random() * (Config.width - 2 * margin);
        y = margin + Math.random() * (Config.height - 2 * margin);

        for (let d of dots) {
            if (Math.hypot(d.x - x, d.y - y) < Config.dotRadius * 3) {
                tooClose = true;
                break;
            }
        }
        attempts++;
    } while (tooClose && attempts < 100);

    return {
        x,
        y,
        holdProgress: 0
    };
}

function spawnAllDots() {
    dots = [];
    for (let i = 0; i < Config.dotCount; i++) {
        dots.push(spawnSingleDot());
    }
}

function updateCursor() {
    const rawSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><circle cx="16" cy="16" r="2.5" fill="${Config.crossColor}"/><line x1="16" y1="2" x2="16" y2="7" stroke="${Config.crossColor}" stroke-width="2"/><line x1="16" y1="25" x2="16" y2="30" stroke="${Config.crossColor}" stroke-width="2"/><line x1="2" y1="16" x2="7" y2="16" stroke="${Config.crossColor}" stroke-width="2"/><line x1="25" y1="16" x2="30" y2="16" stroke="${Config.crossColor}" stroke-width="2"/></svg>`;
    canvas.style.cursor = `url("data:image/svg+xml;base64,${btoa(rawSvg)}") 16 16, crosshair`;
}
updateCursor();

window.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    mousePos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
});

const menu = document.getElementById("settings");
const toggleMenu = () => menu.classList.toggle("hidden-settings");

document.getElementById("settings-toggle-btn").onclick = toggleMenu;

window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") toggleMenu();
});

function bindInput(id, key, parser = parseFloat, callback) {
    const el = document.getElementById(id);
    const valSpan = document.getElementById("val-" + id.replace("cfg-", ""));
    if (el) {
        el.addEventListener("input", (e) => {
            Config[key] = parser(e.target.value);
            if (valSpan) valSpan.innerText = Config[key];
            if (callback) callback();
        });
    }
}

bindInput("cfg-canvasWidth", "width", parseInt, initCanvas);
bindInput("cfg-canvasHeight", "height", parseInt, initCanvas);
bindInput("cfg-dotCount", "dotCount", parseInt, () => {
    while (dots.length < Config.dotCount) dots.push(spawnSingleDot());
    if (dots.length > Config.dotCount) dots = dots.slice(0, Config.dotCount);
});
bindInput("cfg-dotRadius", "dotRadius", parseInt);
bindInput("cfg-requiredHoldTime", "requiredHoldTime");

document.getElementById("cross-color").addEventListener("input", (e) => {
    Config.crossColor = e.target.value;
    updateCursor();
});

initCanvas();

let lastTime = performance.now();
let fps = 60;

function animate(now) {
    const dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;
    fps = Math.round(1 / dt);

    ctx.clearRect(0, 0, Config.width, Config.height);

    for (let i = 0; i < dots.length; i++) {
        let dot = dots[i];
        const dist = Math.hypot(mousePos.x - dot.x, mousePos.y - dot.y);
        const inside = dist <= Config.dotRadius;

        if (inside) {
            dot.holdProgress += dt / Config.requiredHoldTime;
            if (dot.holdProgress >= 1) {
                stats.hits++;
                dots[i] = spawnSingleDot();
                continue;
            }
        } else {
            if (dot.holdProgress > 0) {
                stats.resets++;
                dots[i] = spawnSingleDot();
                continue;
            }
        }

        // Render base dot boundary
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, Config.dotRadius, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0, 255, 136, 0.2)";
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#00ff88";
        ctx.stroke();

        // Render hold progress fill
        if (dot.holdProgress > 0) {
            ctx.beginPath();
            ctx.arc(dot.x, dot.y, Config.dotRadius * dot.holdProgress, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(0, 255, 136, 0.6)";
            ctx.fill();
        }

        // Render center conformation dot
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, Config.centerDotRadius, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();
    }

    document.getElementById("hud-fps").innerText = fps;
    document.getElementById("hud-hits").innerText = stats.hits;
    document.getElementById("hud-resets").innerText = stats.resets;

    requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
