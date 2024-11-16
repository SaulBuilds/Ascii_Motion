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
        return Math.random() > 0.95 ? '@' : 
               Math.random() > 0.9 ? '#' : 
               Math.random() > 0.8 ? '$' : ' ';
    }

    wavePattern(x, y, time) {
        const value = Math.sin(x * 0.1 + time * 0.01) + Math.cos(y * 0.1 + time * 0.01);
        const chars = '@#$%=+*:-. ';
        const index = Math.floor(((value + 2) / 4) * chars.length);
        return chars[Math.max(0, Math.min(chars.length - 1, index))];
    }

    spiralPattern(x, y, time) {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const dx = x - centerX;
        const dy = y - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);
        const value = Math.sin(distance * 0.1 - time * 0.01 + angle);
        const chars = '@#$%=+*:-. ';
        return chars[Math.floor((value + 1) * chars.length / 2)];
    }

    animate() {
        if (!this.isAnimating) return;

        const container = document.getElementById('ascii-container');
        const width = Math.floor(window.innerWidth / 10);
        const height = Math.floor(window.innerHeight / 20);
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
