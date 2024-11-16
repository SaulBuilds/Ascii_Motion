class ASCIIArt {
    constructor() {
        this.canvas = document.getElementById('asciiCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.ascii_container = document.getElementById('ascii-container');
        this.ASCII_CHARS = '@#$%=+*:-. ';
        this.setupCanvas();
        this.setupCursor();
        this.setupFileUpload();
        this.videoToASCII = new VideoToASCII(this);
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
        const imageInput = document.getElementById('imageUpload');
        const videoInput = document.getElementById('videoUpload');

        document.querySelector('[data-action="upload-image"]').addEventListener('click', () => {
            imageInput.click();
        });

        document.querySelector('[data-action="upload-video"]').addEventListener('click', () => {
            videoInput.click();
        });

        imageInput.addEventListener('change', (e) => {
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

        videoInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.videoToASCII.processVideo(file);
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

class VideoToASCII {
    constructor(asciiArt) {
        this.asciiArt = asciiArt;
        this.frameBuffer = [];
        this.isPlaying = false;
        this.currentFrame = 0;
        this.setupControls();
    }

    setupControls() {
        const controls = document.getElementById('video-controls');
        document.querySelector('[data-action="play-video"]').addEventListener('click', () => this.playASCII());
        document.querySelector('[data-action="pause-video"]').addEventListener('click', () => this.pauseASCII());
        document.querySelector('[data-action="stop-video"]').addEventListener('click', () => this.stopASCII());
    }

    processVideo(videoFile) {
        const video = document.createElement('video');
        video.src = URL.createObjectURL(videoFile);
        
        // Show loading indicator
        const loadingIndicator = document.querySelector('.loading-indicator');
        const controls = document.getElementById('video-controls');
        loadingIndicator.style.display = 'block';
        controls.style.display = 'block';

        video.addEventListener('loadeddata', () => {
            this.extractFrames(video).then(() => {
                loadingIndicator.style.display = 'none';
                this.playASCII();
            });
        });
    }

    async extractFrames(video) {
        this.frameBuffer = [];
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const frameCount = Math.floor(video.duration * 24); // 24 fps
        
        canvas.width = 100;
        canvas.height = Math.floor(video.videoHeight * 100 / video.videoWidth / 2);

        for (let i = 0; i < frameCount; i++) {
            video.currentTime = i / 24;
            await new Promise(resolve => {
                video.addEventListener('seeked', () => {
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    const frame = this.convertFrameToASCII(ctx, canvas.width, canvas.height);
                    this.frameBuffer.push(frame);
                    resolve();
                }, { once: true });
            });
        }
    }

    convertFrameToASCII(ctx, width, height) {
        const imageData = ctx.getImageData(0, 0, width, height);
        let asciiFrame = '';
        
        for (let i = 0; i < imageData.data.length; i += 4) {
            if (i % (width * 4) === 0) asciiFrame += '\n';
            
            const brightness = (imageData.data[i] + imageData.data[i + 1] + imageData.data[i + 2]) / 3;
            const charIndex = Math.floor(brightness / 255 * (this.asciiArt.ASCII_CHARS.length - 1));
            asciiFrame += this.asciiArt.ASCII_CHARS[charIndex];
        }
        
        return asciiFrame;
    }

    playASCII() {
        if (!this.isPlaying && this.frameBuffer.length > 0) {
            this.isPlaying = true;
            this.playNextFrame();
        }
    }

    playNextFrame() {
        if (!this.isPlaying) return;
        
        if (this.currentFrame >= this.frameBuffer.length) {
            this.currentFrame = 0;
        }
        
        this.asciiArt.ascii_container.textContent = this.frameBuffer[this.currentFrame];
        this.currentFrame++;
        
        setTimeout(() => requestAnimationFrame(() => this.playNextFrame()), 1000 / 24);
    }

    pauseASCII() {
        this.isPlaying = false;
    }

    stopASCII() {
        this.isPlaying = false;
        this.currentFrame = 0;
        this.asciiArt.ascii_container.textContent = '';
    }
}

// Initialize ASCII art when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const asciiArt = new ASCIIArt();
});
