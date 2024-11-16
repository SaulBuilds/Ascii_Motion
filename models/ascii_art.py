from datetime import datetime
from auth.models import db, User

class ASCIIArt(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    content = db.Column(db.Text, nullable=False)
    config = db.Column(db.JSON)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    user = db.relationship('User', backref='ascii_arts')

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'content': self.content,
            'config': self.config,
            'user_id': self.user_id,
            'created_at': self.created_at.isoformat(),
            'username': self.user.username if self.user else None
        }
