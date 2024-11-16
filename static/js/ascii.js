class ASCIIArt {
    constructor() {
        this.canvas = document.getElementById('asciiCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.ascii_container = document.getElementById('ascii-container');
        this.config = {
            charSets: {
                default: '@#$%=+*:-. ',
                blocks: '█▓▒░ ',
                simple: '.:-=+*#%@',
                complex: '╋╋┫┣╭╮╯╰'
            },
            currentCharSet: 'default',
            fgColor: '#33ff33',
            bgColor: '#000000',
            density: 100,
            frameRate: 12
        };
        this.setupCanvas();
        this.setupCursor();
        this.setupFileUpload();
        this.setupConfigPanel();
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

    setupConfigPanel() {
        // Toggle config panel
        document.querySelector('[data-action="toggle-config"]').addEventListener('click', (e) => {
            e.preventDefault();
            const panel = document.getElementById('config-panel');
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        });

        // Color pickers
        document.getElementById('fgColor').addEventListener('change', (e) => {
            this.config.fgColor = e.target.value;
            this.ascii_container.style.color = this.config.fgColor;
        });

        document.getElementById('bgColor').addEventListener('change', (e) => {
            this.config.bgColor = e.target.value;
            document.body.style.backgroundColor = this.config.bgColor;
        });

        // Character density
        document.getElementById('charDensity').addEventListener('input', (e) => {
            this.config.density = parseInt(e.target.value);
        });

        // Character set
        document.getElementById('charSet').addEventListener('change', (e) => {
            this.config.currentCharSet = e.target.value;
        });

        // Frame rate
        document.getElementById('frameRate').addEventListener('input', (e) => {
            this.config.frameRate = parseInt(e.target.value);
            document.getElementById('frameRateValue').textContent = `${this.config.frameRate} FPS`;
        });
    }

    setupFileUpload() {
        const imageInput = document.getElementById('imageUpload');
        const videoInput = document.getElementById('videoUpload');
        
        videoInput.style.display = 'none';
        videoInput.setAttribute('accept', 'video/*');

        document.querySelector('[data-action="upload-image"]').addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            imageInput.click();
        });

        document.querySelector('[data-action="upload-video"]').addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const videoInput = document.getElementById('videoUpload');
            videoInput.value = ''; // Reset the input before clicking
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

        videoInput.addEventListener('change', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const file = e.target.files[0];
            if (file) {
                try {
                    const loadingIndicator = document.querySelector('.loading-indicator');
                    loadingIndicator.style.display = 'block';
                    await this.videoToASCII.processVideo(file);
                } catch (error) {
                    console.error('Error processing video:', error);
                    alert('Error processing video. Please try again.');
                }
            }
            videoInput.value = ''; // Reset after processing
        });
    }

    handleMouseMove(e) {
        const x = e.clientX;
        const y = e.clientY;
        
        this.ctx.fillStyle = 'rgba(51, 255, 51, 0.1)';
        this.ctx.beginPath();
        this.ctx.arc(x, y, 50, 0, Math.PI * 2);
        this.ctx.fill();
        
        setTimeout(() => {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }, 50);
    }

    convertImageToAscii(img) {
        const width = this.config.density;
        const height = Math.floor(img.height * width / img.width / 2);
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(img, 0, 0, width, height);
        
        const imageData = this.ctx.getImageData(0, 0, width, height);
        let asciiArt = '';
        
        const chars = this.config.charSets[this.config.currentCharSet];
        
        for (let i = 0; i < imageData.data.length; i += 4) {
            if (i % (width * 4) === 0) asciiArt += '\n';
            
            const brightness = (imageData.data[i] + imageData.data[i + 1] + imageData.data[i + 2]) / 3;
            const charIndex = Math.floor(brightness / 255 * (chars.length - 1));
            asciiArt += chars[charIndex];
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
        this.originalVideo = null;
        this.setupControls();
    }

    setupControls() {
        const controls = document.getElementById('video-controls');
        document.querySelector('[data-action="play-video"]').addEventListener('click', () => this.playASCII());
        document.querySelector('[data-action="pause-video"]').addEventListener('click', () => this.pauseASCII());
        document.querySelector('[data-action="stop-video"]').addEventListener('click', () => this.stopASCII());
        
        // Export controls
        document.querySelector('[data-action="export-txt"]').addEventListener('click', () => this.exportAsTXT());
        document.querySelector('[data-action="export-json"]').addEventListener('click', () => this.exportAsJSON());
        document.querySelector('[data-action="export-video"]').addEventListener('click', () => this.exportVideo());
    }

    async processVideo(videoFile) {
        if (!videoFile.type.startsWith('video/')) {
            alert('Please upload a valid video file');
            return;
        }

        this.originalVideo = videoFile;
        const video = document.createElement('video');
        video.src = URL.createObjectURL(videoFile);
        
        video.onerror = () => {
            alert('Error loading video. Please try a different file.');
            const loadingIndicator = document.querySelector('.loading-indicator');
            loadingIndicator.style.display = 'none';
        };

        const loadingIndicator = document.querySelector('.loading-indicator');
        const controls = document.getElementById('video-controls');
        loadingIndicator.style.display = 'block';
        controls.style.display = 'block';

        const loadTimeout = setTimeout(() => {
            alert('Video loading timed out. Please try a smaller file.');
            loadingIndicator.style.display = 'none';
        }, 30000);

        video.addEventListener('loadeddata', () => {
            clearTimeout(loadTimeout);
            this.extractFrames(video).then(() => {
                loadingIndicator.style.display = 'none';
                this.playASCII();
            }).catch(err => {
                alert('Error processing video: ' + err.message);
                loadingIndicator.style.display = 'none';
            });
        });
    }

    async extractFrames(video) {
        this.frameBuffer = [];
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        const frameRate = this.asciiArt.config.frameRate;
        const frameCount = Math.floor(video.duration * frameRate);
        
        canvas.width = this.asciiArt.config.density;
        canvas.height = Math.floor(video.videoHeight * canvas.width / video.videoWidth / 2);

        for (let i = 0; i < frameCount; i++) {
            video.currentTime = i / frameRate;
            try {
                await new Promise((resolve, reject) => {
                    const timeoutId = setTimeout(() => {
                        reject(new Error('Frame extraction timed out'));
                    }, 5000);

                    video.addEventListener('seeked', () => {
                        clearTimeout(timeoutId);
                        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                        const frame = this.convertFrameToASCII(ctx, canvas.width, canvas.height);
                        this.frameBuffer.push({
                            ascii: frame,
                            timestamp: i / frameRate
                        });
                        resolve();
                    }, { once: true });
                });
            } catch (error) {
                console.error('Error extracting frame:', error);
                throw error;
            }
        }
    }

    convertFrameToASCII(ctx, width, height) {
        const imageData = ctx.getImageData(0, 0, width, height);
        let asciiFrame = '';
        
        const chars = this.asciiArt.config.charSets[this.asciiArt.config.currentCharSet];
        
        for (let i = 0; i < imageData.data.length; i += 4) {
            if (i % (width * 4) === 0) asciiFrame += '\n';
            
            const brightness = (imageData.data[i] + imageData.data[i + 1] + imageData.data[i + 2]) / 3;
            const charIndex = Math.floor(brightness / 255 * (chars.length - 1));
            asciiFrame += chars[charIndex];
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
        
        this.asciiArt.ascii_container.textContent = this.frameBuffer[this.currentFrame].ascii;
        this.currentFrame++;
        
        setTimeout(() => requestAnimationFrame(() => this.playNextFrame()), 1000 / this.asciiArt.config.frameRate);
    }

    pauseASCII() {
        this.isPlaying = false;
    }

    stopASCII() {
        this.isPlaying = false;
        this.currentFrame = 0;
        this.asciiArt.ascii_container.textContent = '';
    }

    exportAsTXT() {
        const content = this.frameBuffer.map(frame => frame.ascii).join('\n---\n');
        this.downloadFile(content, 'ascii-animation.txt', 'text/plain');
    }

    exportAsJSON() {
        const content = JSON.stringify({
            config: this.asciiArt.config,
            frames: this.frameBuffer,
            metadata: {
                frameCount: this.frameBuffer.length,
                totalDuration: this.frameBuffer[this.frameBuffer.length - 1].timestamp
            }
        }, null, 2);
        this.downloadFile(content, 'ascii-animation.json', 'application/json');
    }

    exportVideo() {
        if (this.originalVideo) {
            const url = URL.createObjectURL(this.originalVideo);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'original-video' + this.getFileExtension(this.originalVideo.name);
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    }

    downloadFile(content, filename, type) {
        const blob = new Blob([content], { type: type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    getFileExtension(filename) {
        return filename.substring(filename.lastIndexOf('.'));
    }
}

// Initialize ASCII art when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const asciiArt = new ASCIIArt();
});