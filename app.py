from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from werkzeug.utils import secure_filename
from LPD import main as process_license_plate
import io
import base64
import cv2
import numpy as np

app = Flask(__name__)
CORS(app)
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def image_to_base64(image):
    """Convert OpenCV image to base64 encoded string"""
    _, buffer = cv2.imencode('.png', image)
    return base64.b64encode(buffer).decode('utf-8')

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        try:
           
            plate, detected_image, plate_number, validation_result = process_license_plate(filepath)
            if plate is not None:
                plate_base64 = image_to_base64(plate)
                detected_image_base64 = image_to_base64(detected_image)
                
                return jsonify({
                    'detected_plate': plate_base64,
                    'original_image': detected_image_base64,
                    'plate_number': plate_number,
                    'validation_result': validation_result
                })
            else:
                return jsonify({'error': 'No license plate detected'}), 404
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    else:
        return jsonify({'error': 'Invalid file type'}), 400

if __name__ == '__main__':
    app.run(debug=True)