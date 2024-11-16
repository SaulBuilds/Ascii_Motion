import os
from flask import Flask, render_template
from flask_login import LoginManager
from flask_socketio import SocketIO, emit
from auth.models import db, User
from auth.routes import auth
from routes.ascii import ascii_bp

app = Flask(__name__)
app.secret_key = os.environ.get("FLASK_SECRET_KEY") or "a secret key"
socketio = SocketIO(app)

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize database
db.init_app(app)

# Initialize Flask-Login
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'auth.login'

@login_manager.user_loader
def load_user(id):
    return User.query.get(int(id))

# Register blueprints
app.register_blueprint(auth, url_prefix='/auth')
app.register_blueprint(ascii_bp, url_prefix='/ascii')

@app.route('/')
def index():
    return render_template('index.html')

# WebSocket events
@socketio.on('connect')
def handle_connect():
    emit('status', {'message': 'Connected to server'})

@socketio.on('ascii_update')
def handle_ascii_update(data):
    emit('ascii_broadcast', data, broadcast=True)

# Create database tables
with app.app_context():
    db.create_all()

if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=5000, debug=True)
