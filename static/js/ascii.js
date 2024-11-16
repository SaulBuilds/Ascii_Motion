class ASCIIArt {
    constructor() {
        this.canvas = document.getElementById('asciiCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.ascii_container = document.getElementById('ascii-container');
        this.ASCII_CHARS = '@#$%=+*:-. ';
        this.setupCanvas();
        this.setupCursor();
        this.setupFileUpload();
    }

    setupCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        window.addEventListener('resize', () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        });
    }

    setupCursor() {
        const cursor = document.createElement('div');
        cursor.className = 'custom-cursor';
        document.body.appendChild(cursor);

        document.addEventListener('mousemove', (e) => {
            cursor.style.transform = `translate(${e.clientX - 10}px, ${e.clientY - 10}px)`;
            this.handleMouseMove(e);
        });
    }

    setupFileUpload() {
        const fileInput = document.getElementById('imageUpload');
        document.querySelector('[data-action="upload-image"]').addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const img = new Image();
                    img.onload = () => this.convertImageToAscii(img);
                    img.src = event.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    }

    handleMouseMove(e) {
        const x = e.clientX;
        const y = e.clientY;
        
        // Create ripple effect
        this.ctx.fillStyle = 'rgba(51, 255, 51, 0.1)';
        this.ctx.beginPath();
        this.ctx.arc(x, y, 50, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Fade out effect
        setTimeout(() => {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }, 50);
    }

    convertImageToAscii(img) {
        const width = 100;
        const height = Math.floor(img.height * width / img.width / 2);
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(img, 0, 0, width, height);
        
        const imageData = this.ctx.getImageData(0, 0, width, height);
        let asciiArt = '';
        
        for (let i = 0; i < imageData.data.length; i += 4) {
            if (i % (width * 4) === 0) asciiArt += '\n';
            
            const brightness = (imageData.data[i] + imageData.data[i + 1] + imageData.data[i + 2]) / 3;
            const charIndex = Math.floor(brightness / 255 * (this.ASCII_CHARS.length - 1));
            asciiArt += this.ASCII_CHARS[charIndex];
        }
        
        this.ascii_container.textContent = asciiArt;
    }
}

// Initialize ASCII art when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const asciiArt = new ASCIIArt();
});
