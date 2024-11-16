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
        this.setupConfigPanel();
        this.videoToASCII = new VideoToASCII(this);
        this.setupFileUpload();
        // Move WebSocket setup to the end with timeout
        setTimeout(() => this.setupWebSocket(), 100);
    }

    setupWebSocket() {
        // Check if Socket.IO is loaded
        if (typeof io === 'undefined') {
            console.warn('Socket.IO not loaded, retrying in 1 second...');
            setTimeout(() => this.setupWebSocket(), 1000);
            return;
        }
        
        try {
            this.socket = io();
            
            this.socket.on('connect', () => {
                console.log('Connected to WebSocket');
            });
            
            this.socket.on('ascii_broadcast', (data) => {
                this.updateFeed(data);
            });
        } catch (error) {
            console.error('Error setting up WebSocket:', error);
        }
    }

    updateFeed(data) {
        const feedContent = document.querySelector('.feed-content');
        const artEntry = document.createElement('div');
        artEntry.className = 'feed-entry';
        artEntry.innerHTML = `
            <h3>${data.title}</h3>
            <pre>${data.content}</pre>
            <p>By ${data.username} - ${new Date(data.created_at).toLocaleString()}</p>
        `;
        feedContent.insertBefore(artEntry, feedContent.firstChild);
    }

    async saveArt(title) {
        if (!this.ascii_container.textContent) return;
        
        const artData = {
            title: title,
            content: this.ascii_container.textContent,
            config: this.config
        };
        
        try {
            const response = await fetch('/ascii/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(artData)
            });
            
            if (response.ok) {
                const savedArt = await response.json();
                this.socket.emit('ascii_update', savedArt);
            }
        } catch (error) {
            console.error('Error saving ASCII art:', error);
        }
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
        document.querySelector('[data-action="toggle-config"]').addEventListener('click', (e) => {
            e.preventDefault();
            const panel = document.getElementById('config-panel');
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        });

        document.getElementById('fgColor').addEventListener('change', (e) => {
            this.config.fgColor = e.target.value;
            this.ascii_container.style.color = this.config.fgColor;
        });

        document.getElementById('bgColor').addEventListener('change', (e) => {
            this.config.bgColor = e.target.value;
            document.body.style.backgroundColor = this.config.bgColor;
        });

        document.getElementById('charDensity').addEventListener('input', (e) => {
            this.config.density = parseInt(e.target.value);
        });

        document.getElementById('charSet').addEventListener('change', (e) => {
            this.config.currentCharSet = e.target.value;
        });

        document.getElementById('frameRate').addEventListener('input', (e) => {
            this.config.frameRate = parseInt(e.target.value);
            document.getElementById('frameRateValue').textContent = `${this.config.frameRate} FPS`;
        });

        document.querySelector('[data-action="save-art"]').addEventListener('click', () => {
            const title = prompt('Enter a title for your ASCII art:');
            if (title) {
                this.saveArt(title);
            }
        });
    }

    setupFileUpload() {
        const videoInput = document.getElementById('videoUpload');
        const uploadButton = document.querySelector('[data-action="upload-video"]');
        
        if (uploadButton) {
            uploadButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (videoInput) {
                    videoInput.value = ''; // Reset input
                    videoInput.click();
                }
            });
        }

        if (videoInput) {
            videoInput.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (file && this.videoToASCII) {
                    try {
                        await this.videoToASCII.processVideo(file);
                    } catch (error) {
                        console.error('Error uploading video:', error);
                        alert('Error uploading video: ' + error.message);
                    }
                }
            });
        }

        // Add image upload handler
        const imageInput = document.getElementById('imageUpload');
        const imageButton = document.querySelector('[data-action="upload-image"]');
        
        if (imageButton && imageInput) {
            imageButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                imageInput.click();
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
        }
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
        if (!asciiArt) {
            throw new Error('ASCIIArt instance must be provided');
        }
        this.asciiArt = asciiArt;
        
        // Verify the ASCII container exists
        if (!this.asciiArt.ascii_container) {
            throw new Error('ASCII container not found');
        }
        
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
        
        document.querySelector('[data-action="export-txt"]').addEventListener('click', () => this.exportAsTXT());
        document.querySelector('[data-action="export-json"]').addEventListener('click', () => this.exportAsJSON());
        document.querySelector('[data-action="export-video"]').addEventListener('click', () => this.exportVideo());
    }

    async processVideo(videoFile) {
        // Reset any existing state
        this.frameBuffer = [];
        this.currentFrame = 0;
        this.isPlaying = false;

        if (!videoFile.type.startsWith('video/')) {
            alert('Please upload a valid video file');
            return;
        }

        const loadingIndicator = document.querySelector('.loading-indicator');
        const controls = document.getElementById('video-controls');
        
        try {
            loadingIndicator.style.display = 'block';
            controls.style.display = 'flex';
            
            this.originalVideo = videoFile;
            const video = document.createElement('video');
            video.src = URL.createObjectURL(videoFile);
            
            await new Promise((resolve, reject) => {
                video.onloadeddata = () => resolve();
                video.onerror = () => reject(new Error('Error loading video'));
                
                // Add timeout
                const timeout = setTimeout(() => {
                    reject(new Error('Video loading timed out'));
                }, 10000);
                
                video.addEventListener('loadeddata', () => {
                    clearTimeout(timeout);
                    resolve();
                }, { once: true });
            });

            await this.extractFrames(video);
            loadingIndicator.style.display = 'none';
            this.playASCII();
            
        } catch (error) {
            console.error('Error processing video:', error);
            alert('Error processing video: ' + error.message);
            loadingIndicator.style.display = 'none';
        }
    }

    async extractFrames(video) {
        this.frameBuffer = [];
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        const frameRate = this.asciiArt.config.frameRate;
        const frameCount = Math.floor(video.duration * frameRate);
        
        canvas.width = Math.ceil(window.innerWidth / 8);
        canvas.height = Math.ceil(window.innerHeight / 16);
        
        const videoAspect = video.videoWidth / video.videoHeight;
        const canvasAspect = canvas.width / canvas.height;
        
        let drawWidth = canvas.width;
        let drawHeight = canvas.height;
        
        if (videoAspect > canvasAspect) {
            drawHeight = canvas.width / videoAspect;
        } else {
            drawWidth = canvas.height * videoAspect;
        }
        
        const offsetX = (canvas.width - drawWidth) / 2;
        const offsetY = (canvas.height - drawHeight) / 2;

        for (let i = 0; i < frameCount; i++) {
            video.currentTime = i / frameRate;
            await new Promise((resolve) => {
                video.addEventListener('seeked', () => {
                    ctx.fillStyle = 'black';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(video, offsetX, offsetY, drawWidth, drawHeight);
                    const frame = this.convertFrameToASCII(ctx, canvas.width, canvas.height);
                    if (frame) {
                        this.frameBuffer.push({
                            ascii: frame,
                            timestamp: i / frameRate
                        });
                    }
                    resolve();
                }, { once: true });
            });
        }
    }

    convertFrameToASCII(ctx, width, height) {
        if (!ctx || !width || !height) return null;
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
        if (!this.isPlaying || !this.frameBuffer || this.frameBuffer.length === 0) return;
        
        if (this.currentFrame >= this.frameBuffer.length) {
            this.currentFrame = 0;
        }
        
        const frame = this.frameBuffer[this.currentFrame];
        if (!frame) return;
        
        if (frame.ascii && this.asciiArt && this.asciiArt.ascii_container) {
            this.asciiArt.ascii_container.textContent = frame.ascii;
            this.currentFrame++;
            setTimeout(() => requestAnimationFrame(() => this.playNextFrame()), 1000 / this.asciiArt.config.frameRate);
        }
    }

    pauseASCII() {
        this.isPlaying = false;
    }

    stopASCII() {
        this.isPlaying = false;
        this.currentFrame = 0;
        if (this.asciiArt && this.asciiArt.ascii_container) {
            this.asciiArt.ascii_container.textContent = '';
        }
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
