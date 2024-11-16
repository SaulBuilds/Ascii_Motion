from flask import Blueprint, jsonify, request
from flask_login import current_user, login_required
from models.ascii_art import ASCIIArt, db
from datetime import datetime

ascii_bp = Blueprint('ascii', __name__)

@ascii_bp.route('/save', methods=['POST'])
@login_required
def save_art():
    data = request.get_json()
    
    if not all(key in data for key in ['title', 'content', 'config']):
        return jsonify({'error': 'Missing required fields'}), 400
        
    art = ASCIIArt(
        title=data['title'],
        content=data['content'],
        config=data['config'],
        user_id=current_user.id
    )
    
    db.session.add(art)
    db.session.commit()
    
    return jsonify(art.to_dict()), 201

@ascii_bp.route('/load/<int:art_id>', methods=['GET'])
@login_required
def load_art(art_id):
    art = ASCIIArt.query.get_or_404(art_id)
    if art.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
    return jsonify(art.to_dict())

@ascii_bp.route('/delete/<int:art_id>', methods=['DELETE'])
@login_required
def delete_art(art_id):
    art = ASCIIArt.query.get_or_404(art_id)
    if art.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    db.session.delete(art)
    db.session.commit()
    return '', 204

@ascii_bp.route('/feed', methods=['GET'])
def public_feed():
    page = request.args.get('page', 1, type=int)
    per_page = 10
    
    arts = ASCIIArt.query.order_by(ASCIIArt.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'arts': [art.to_dict() for art in arts.items],
        'total': arts.total,
        'pages': arts.pages,
        'current_page': arts.page
    })
