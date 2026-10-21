const Config = {
width: 1200,
height: 800,
dotCount: 8,
dotRadius: 12,
maxUrgentRadius: 45,
expansionSpeed: 0.8,
urgentSpawnInterval: 0.7,
maxUrgentCount: 5,
penaltyDuration: 2.5,
justHover: true,
crossColor: '#00ff88'
};

const canvas = document.getElementById("aimCanvas");
const ctx = canvas.getContext("2d");

let mousePos = { x: 0, y: 0 };
let isMouseDown = false;
let dots = [];
let penaltyTimeLeft = 0;
let urgentSpawnTimer = 0;

let stats = { hits: 0, urgentHits: 0, penalties: 0 };

function initCanvas() {
canvas.width = Config.width;
canvas.height = Config.height;
spawnAllDots();
}

function spawnSingleDot() {
const margin = Config.maxUrgentRadius + 20;
let x, y, tooClose;
let attempts = 0;

do {
   tooClose = false;
   x = margin + Math.random() * (Config.width - 2 * margin);
   y = margin + Math.random() * (Config.height - 2 * margin);

   for (let d of dots) {
      if (Math.hypot(d.x - x, d.y - y) < Config.maxUrgentRadius * 2) {
         tooClose = true;
         break;
      }
   }
   attempts++;
} while (tooClose && attempts < 100);

return {
   x,
   y,
   radius: Config.dotRadius,
   isUrgent: false,
   urgentProgress: 0
};
}

function spawnAllDots() {
dots = [];
for (let i = 0; i < Config.dotCount; i++) {
   dots.push(spawnSingleDot());
}
urgentSpawnTimer = 0.5;
}

function tryMakeDotUrgent() {
const nonUrgent = dots.filter(d => !d.isUrgent);
const currentUrgentCount = dots.filter(d => d.isUrgent).length;

if (nonUrgent.length > 0 && currentUrgentCount < Config.maxUrgentCount) {
   const target = nonUrgent[Math.floor(Math.random() * nonUrgent.length)];
   target.isUrgent = true;
   target.urgentProgress = 0;
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
window.addEventListener("mousedown", () => isMouseDown = true);
window.addEventListener("mouseup", () => isMouseDown = false);

const menu = document.getElementById("settings");
const toggleMenu = () => menu.classList.toggle("hidden-settings");

document.getElementById("settings-toggle-btn").onclick = toggleMenu;

window.addEventListener("keydown", (e) => {
if (e.key === "Escape") toggleMenu();
});

function bindInput(id, key, parser = parseFloat, callback) {
const el = document.getElementById(id);
const valSpan = document.getElementById("val-" + id.replace("cfg-", ""));
el.addEventListener("input", (e) => {
   Config[key] = parser(e.target.value);
   if (valSpan) valSpan.innerText = Config[key];
   if (callback) callback();
});
}

bindInput("cfg-canvasWidth", "width", parseInt, initCanvas);
bindInput("cfg-canvasHeight", "height", parseInt, initCanvas);
bindInput("cfg-dotCount", "dotCount", parseInt, () => {
while (dots.length < Config.dotCount) dots.push(spawnSingleDot());
if (dots.length > Config.dotCount) dots = dots.slice(0, Config.dotCount);
});
bindInput("cfg-dotRadius", "dotRadius", parseInt, () => {
dots.forEach(d => { if (!d.isUrgent) d.radius = Config.dotRadius; });
});
bindInput("cfg-maxUrgentRadius", "maxUrgentRadius");
bindInput("cfg-expansionSpeed", "expansionSpeed");
bindInput("cfg-urgentSpawnInterval", "urgentSpawnInterval");
bindInput("cfg-maxUrgentCount", "maxUrgentCount", parseInt);
bindInput("cfg-penaltyDuration", "penaltyDuration");

document.getElementById("cfg-justHover").addEventListener("change", (e) => Config.justHover = e.target.checked);
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

const activeTrigger = Config.justHover ? true : isMouseDown;

if (penaltyTimeLeft > 0) {
   penaltyTimeLeft -= dt;
   
   ctx.fillStyle = "rgba(255, 0, 85, 0.15)";
   ctx.fillRect(0, 0, Config.width, Config.height);

   ctx.fillStyle = "#ff0055";
   ctx.font = "bold 24px sans-serif";
   ctx.textAlign = "center";
   ctx.fillText(`PENALTY COOLDOWN: ${penaltyTimeLeft.toFixed(1)}s`, Config.width / 2, Config.height / 2);

   if (penaltyTimeLeft <= 0) {
      spawnAllDots();
   }
} else {
   urgentSpawnTimer -= dt;
   if (urgentSpawnTimer <= 0) {
      tryMakeDotUrgent();
      urgentSpawnTimer = Config.urgentSpawnInterval;
   }

   for (let i = 0; i < dots.length; i++) {
      let dot = dots[i];

      if (dot.isUrgent) {
         dot.urgentProgress += (dt * Config.expansionSpeed) / 2;
         dot.radius = Config.dotRadius + dot.urgentProgress * (Config.maxUrgentRadius - Config.dotRadius);

         if (dot.urgentProgress >= 1) {
            stats.penalties++;
            penaltyTimeLeft = Config.penaltyDuration;
            break;
         }
      }

      const dotDist = Math.hypot(mousePos.x - dot.x, mousePos.y - dot.y);
      if (dotDist <= dot.radius && activeTrigger) {
         if (dot.isUrgent) {
            stats.urgentHits++;
         } else {
            stats.hits++;
         }

         dots[i] = spawnSingleDot();
         continue;
      }

      ctx.beginPath();
      ctx.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);

      if (dot.isUrgent) {
         ctx.fillStyle = "#ff3344";
         ctx.fill();
      } else {
         ctx.fillStyle = "#00ff88";
         ctx.fill();
      }
   }
}

document.getElementById("hud-fps").innerText = fps;
document.getElementById("hud-hits").innerText = stats.hits;
document.getElementById("hud-urgent-hits").innerText = stats.urgentHits;
document.getElementById("hud-penalties").innerText = stats.penalties;

requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
