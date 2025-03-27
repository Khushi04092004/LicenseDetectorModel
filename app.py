from flask import Flask, request, jsonify
from ultralytics import YOLO
from flask_cors import CORS
from PIL import Image
import io

app = Flask(__name__)
CORS(app)
# Load the trained YOLO model
model = YOLO('runs/detect/train11/weights/best.pt')

@app.route('/detect', methods=['POST'])
def detect():
    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400
    file = request.files['image']
    image = Image.open(io.BytesIO(file.read()))
    results = model(image)
    # Process results as needed
    detections = results.pandas().xyxy[0].to_dict(orient="records")
    return jsonify({'detections': detections})

if __name__ == '__main__':
    app.run(debug=True)
