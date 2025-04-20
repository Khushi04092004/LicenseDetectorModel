# app.py
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import base64
import cv2
import mimetypes
from werkzeug.utils import secure_filename
from video_license_plate import process_license_plate as process_video_license_plate
from LPD_AccuracyImprove import main as process_license_plate

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'mp4'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def image_to_base64(image):
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
            if processed_plate is None or plate_number == "No plate detected":
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

@app.route('/upload_video', methods=['POST'])
def upload_video():
    if 'video' not in request.files:
        return jsonify({"error": "No video provided"}), 400

    video = request.files['video']
    filename = secure_filename(video.filename)
    video_path = os.path.join("uploads", filename)
    video.save(video_path)

    cap = cv2.VideoCapture(video_path)
    frame_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    frame_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS)

    processed_filename = f"processed_{filename}"
    output_path = os.path.join("uploads", processed_filename)
    out = cv2.VideoWriter(output_path, cv2.VideoWriter_fourcc(*"mp4v"), fps, (frame_width, frame_height))

    plate_results = []

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        _, annotated_frame, formatted_text = process_video_license_plate(frame)
        if formatted_text:
            plate_results.append(formatted_text)
        out.write(annotated_frame)

    cap.release()
    out.release()

    if not plate_results:
        return jsonify({"error": "No plates detected in video"}), 400

    from collections import OrderedDict
    unique_plates = list(OrderedDict.fromkeys(plate_results))

    return jsonify({
        "detected_plates": unique_plates,
        "video_url": f"http://localhost:5000/uploads/{processed_filename}"
    })

@app.route('/uploads/<filename>')
def serve_processed_video(filename):
    file_path = os.path.join('uploads', filename)
    if not os.path.isfile(file_path):
        return "File not found", 404
    mimetype = mimetypes.guess_type(file_path)[0] or 'video/mp4'
    print(f"Serving {file_path} with MIME: {mimetype}")
    return send_file(file_path, mimetype=mimetype)

if __name__ == '__main__':
    app.run(debug=True)
