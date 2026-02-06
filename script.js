const canvas = document.getElementById('canvas1');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const input = document.getElementById('userInput');

let particles = [];
let envParticles = []; 
let mouse = { x: null, y: null, radius: 150 };
let flowTimer = 0;
let hueRotate = 0;

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    mouse.radius = canvas.width < 600 ? 80 : 150;
    initEnv(); 
    init(input.value); 
}

window.addEventListener('resize', resize);
window.addEventListener('mousemove', (e) => { mouse.x = e.x; mouse.y = e.y; });
window.addEventListener('touchstart', (e) => { 
    mouse.x = e.touches[0].clientX; 
    mouse.y = e.touches[0].clientY; 
}, {passive: false});
window.addEventListener('touchmove', (e) => { 
    mouse.x = e.touches[0].clientX; 
    mouse.y = e.touches[0].clientY; 
}, {passive: false});
window.addEventListener('touchend', () => { mouse.x = null; mouse.y = null; });

class Particle {
    constructor(x, y, color, isRain = false) {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.baseX = x;
        this.baseY = y;
        this.size = (Math.random() * 2) + 1;
        this.color = color; 
        this.vx = 0;
        this.vy = 0;
        this.isRain = isRain;
        this.offset = Math.random() * 100;
        this.speed = 0.03 + Math.random() * 0.04;
        this.friction = 0.92;
        this.rainWeight = 1 + Math.random() * 3;
    }

    draw() {
        let currentHue = (this.color + hueRotate) % 360;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsl(${currentHue}, 100%, 60%)`;
        ctx.fill();
    }

    update() {
        if (this.isRain) {
            this.vy += this.rainWeight * 0.1;
            if (this.y > canvas.height) {
                this.y = -10;
                this.x = Math.random() * canvas.width;
                this.vy = 0;
            }
        } else {
            let targetX = this.baseX + Math.cos(flowTimer * 2 + this.offset) * 2;
            let targetY = this.baseY + Math.sin(flowTimer * 2 + this.offset) * 2;
            let dx = targetX - this.x;
            let dy = targetY - this.y;
            this.vx += dx * this.speed;
            this.vy += dy * this.speed;
        }

        if (mouse.x != null) {
            let mdx = mouse.x - this.x;
            let mdy = mouse.y - this.y;
            let dist = Math.sqrt(mdx * mdx + mdy * mdy);
            if (dist < mouse.radius) {
                let force = (mouse.radius - dist) / mouse.radius;
                let angle = Math.atan2(mdy, mdx);
                let push = force * 15; 
                this.vx -= Math.cos(angle) * push;
                this.vy -= Math.sin(angle) * push;
            }
        }

        this.vx *= this.friction;
        this.vy *= this.friction;
        this.x += this.vx;
        this.y += this.vy;
    }
}

function initEnv() {
    envParticles = [];
    for (let i = 0; i < 120; i++) {
        envParticles.push(new Particle(0, 0, Math.random() * 360, true));
    }
    const drawHeart = (ox, oy) => {
        for (let t = 0; t < Math.PI * 2; t += 0.25) {
            const x = 16 * Math.pow(Math.sin(t), 3);
            const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
            envParticles.push(new Particle(ox + x * 5, oy + y * 5, 340, false));
        }
    };
    drawHeart(80, 80);
    drawHeart(canvas.width - 80, 80);
}

function init(text) {
    particles = [];
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const isMobile = canvas.width < 600;

    if (!text || text.trim() === "") {
        const particleCount = isMobile ? 600 : 1500;
        for (let i = 0; i < particleCount; i++) {
            let a = Math.random() * Math.PI * 2;
            let r = Math.random() * (isMobile ? 80 : 150);
            particles.push(new Particle(cx + Math.cos(a) * r, cy - 80 + Math.sin(a) * r, 180 + Math.random() * 60));
        }
    } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Split text into two lines if it contains a space or exceeds 7 chars
        let words = text.includes(" ") ? text.split(" ") : [text.slice(0, 8), text.slice(8)];
        let line1 = words[0].toUpperCase();
        let line2 = (words[1] || "").toUpperCase();

        let fontSize = Math.min(canvas.width * 0.15, isMobile ? 80 : 120);
        ctx.font = `900 ${fontSize}px "Rajdhani"`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Draw Line 1 (Slightly above center)
        ctx.fillText(line1, cx, cy - (line2 ? fontSize * 0.6 : 50));
        
        // Draw Line 2 (Slightly below center)
        if (line2) {
            ctx.fillText(line2, cx, cy + (fontSize * 0.6));
        }

        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const scanSkip = isMobile ? 5 : 4;
        for (let y = 0; y < canvas.height; y += scanSkip) {
            for (let x = 0; x < canvas.width; x += scanSkip) {
                if (data[(y * canvas.width + x) * 4 + 3] > 128) {
                    let hue = Math.floor(180 + (x / canvas.width) * 100);
                    particles.push(new Particle(x, y, hue, false));
                }
            }
        }
    }
}

function animate() {
    ctx.fillStyle = 'rgba(5, 5, 5, 0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    hueRotate += 0.5;
    flowTimer += 0.04;
    ctx.globalCompositeOperation = 'lighter';
    const all = [...envParticles, ...particles];
    for (let i = 0; i < all.length; i++) {
        all[i].update();
        all[i].draw();
    }
    ctx.globalCompositeOperation = 'source-over';
    requestAnimationFrame(animate);
}

input.addEventListener('input', (e) => init(e.target.value));
resize();
animate();

