// Common utility functions and initialization
document.addEventListener('DOMContentLoaded', () => {
    // Initialize custom cursor
    const cursor = document.createElement('div');
    cursor.className = 'custom-cursor';
    document.body.appendChild(cursor);
    
    document.addEventListener('mousemove', (e) => {
        cursor.style.transform = `translate(${e.clientX - 10}px, ${e.clientY - 10}px)`;
    });

    // Initialize ASCII art if we're on the main page
    if (document.getElementById('ascii-container')) {
        // Initialize animations first
        const animations = new ASCIIAnimations();
        // Then initialize ASCII art
        const asciiArt = new ASCIIArt();
        window.asciiArt = asciiArt; // Make it globally available if needed
    }
});
