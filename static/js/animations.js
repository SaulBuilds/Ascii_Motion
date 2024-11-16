class ASCIIAnimations {
    constructor() {
        this.patterns = [
            this.rainPattern,
            this.wavePattern,
            this.spiralPattern
        ];
        this.currentPattern = 0;
        this.isAnimating = true;
        this.setupEventListeners();
        this.animate();
    }

    setupEventListeners() {
        document.querySelector('[data-action="toggle-animation"]').addEventListener('click', (e) => {
            e.preventDefault();
            this.isAnimating = !this.isAnimating;
            if (this.isAnimating) this.animate();
        });

        document.querySelector('[data-action="change-pattern"]').addEventListener('click', (e) => {
            e.preventDefault();
            this.currentPattern = (this.currentPattern + 1) % this.patterns.length;
        });
    }

    rainPattern(x, y, time) {
        const density = Math.sin(y * 0.05 + time * 0.0002) * 0.2;
        return Math.random() > (0.97 - density) ? '▓' : 
               Math.random() > (0.92 - density) ? '▒' : 
               Math.random() > (0.85 - density) ? '░' :
               Math.random() > (0.80 - density) ? '≋' :
               Math.random() > (0.75 - density) ? '≈' :
               Math.random() > (0.70 - density) ? '˜' :
               Math.random() > (0.65 - density) ? '~' : ' ';
    }

    wavePattern(x, y, time) {
        const scale = 0.08;
        const timeScale = 0.003;
        const value = Math.sin(x * scale + time * timeScale) * 
                     Math.cos(y * scale + time * timeScale) +
                     Math.sin((x + y) * scale * 0.5 + time * timeScale);
        const chars = '˜~:≈≋≣░▒▓ ';
        const index = Math.floor(((value + 2) / 4) * chars.length);
        return chars[Math.max(0, Math.min(chars.length - 1, index))];
    }

    spiralPattern(x, y, time) {
        const centerX = window.innerWidth / 16;
        const centerY = window.innerHeight / 32;
        const dx = x - centerX;
        const dy = y - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);
        const spiral = Math.sin(distance * 0.1 - time * 0.002 + angle * 2);
        const wave = Math.cos(x * 0.05 + y * 0.05 + time * 0.002);
        const value = (spiral + wave) * 0.5;
        const chars = '.·˜~:≈≋≣░▒▓';
        return chars[Math.floor((value + 1) * chars.length / 2)];
    }

    animate() {
        if (!this.isAnimating) return;

        const container = document.getElementById('ascii-container');
        const width = Math.floor(window.innerWidth / 8);
        const height = Math.floor(window.innerHeight / 16);
        let output = '';

        const time = Date.now();
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                output += this.patterns[this.currentPattern](x, y, time);
            }
            output += '\n';
        }

        container.textContent = output;
        requestAnimationFrame(() => this.animate());
    }
}

// Initialize animations when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const animations = new ASCIIAnimations();
});
