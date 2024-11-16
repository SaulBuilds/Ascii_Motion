# ASCII Art Interactive

An interactive web application for generating and sharing ASCII art animations with real-time collaborative features.

## Features

- Real-time ASCII art animations with multiple patterns
- Video to ASCII conversion
- Image to ASCII conversion
- Customizable rendering options:
  - Multiple character sets
  - Adjustable density and frame rate
  - Custom colors (foreground/background)
- Export options (TXT, JSON, original video)
- User authentication system
- Public feed for sharing creations
- WebSocket-based real-time updates

## Requirements

- Python 3.11+
- PostgreSQL database
- Flask and extensions:
  - Flask-SQLAlchemy
  - Flask-Login
  - Flask-SocketIO
- Additional dependencies in pyproject.toml

## Quick Start on Replit

1. Fork this project on Replit
2. Environment variables needed:
   - DATABASE_URL: PostgreSQL connection string
   - FLASK_SECRET_KEY: Secret key for sessions

The database will be automatically initialized on first run.

## Local Development

1. Clone the repository
2. Install dependencies:
   ```bash
   pip install -e .
   ```
3. Set up PostgreSQL database and environment variables
4. Run the application:
   ```bash
   python main.py
   ```

## Usage

1. Basic Controls:
   - Toggle Animation: Start/stop background animations
   - Change Pattern: Cycle through different patterns
   - Upload Image/Video: Convert media to ASCII art
   - Configure: Access customization options

2. Video Controls:
   - Play/Pause/Stop: Control video playback
   - Export: Save as TXT, JSON, or original video
   - Save to Feed: Share with other users

3. Configuration Options:
   - Character Set: Choose ASCII character patterns
   - Density: Adjust resolution
   - Frame Rate: Control animation speed
   - Colors: Customize foreground/background

## Authentication

- Register: Create an account to save and share ASCII art
- Login: Access your saved creations
- Public Feed: View and interact with community submissions

## Contributing

Contributions are welcome! Please feel free to submit pull requests.

## License

MIT License

Copyright (c) 2024 ASCII Art Interactive

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
