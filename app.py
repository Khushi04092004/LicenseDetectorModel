# app.py changes
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from werkzeug.utils import secure_filename
from LPD_AccuracyImprove import main as process_license_plate
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
            processed_plate, detected_image, plate_number, _ = process_license_plate(filepath)
            
            # Handle case when no plate is detected
            if processed_plate is None or plate_number == "No plate detected":
                # Still return the original image if available
                if detected_image is not None:
                    detected_image_base64 = image_to_base64(detected_image)
                    return jsonify({
                        'original_image': detected_image_base64,
                        'plate_number': 'No license plate detected',
                        'message': 'No license plate detected in the image'
                    }), 200
                else:
                    return jsonify({'message': 'No license plate detected in the image'}), 200
            else:
                # Normal flow when plate is detected
                plate_base64 = image_to_base64(processed_plate)
                detected_image_base64 = image_to_base64(detected_image)
                
                print(f"Plate number detected: {plate_number}")
                
                return jsonify({
                    'detected_plate': plate_base64,
                    'original_image': detected_image_base64,
                    'plate_number': plate_number
                })
                
        except Exception as e:
            print(f"Error processing license plate: {str(e)}")
            return jsonify({'message': 'Error processing image', 'error': str(e)}), 200
    else:
        return jsonify({'error': 'Invalid file type'}), 400

if __name__ == '__main__':
    app.run(debug=True)
