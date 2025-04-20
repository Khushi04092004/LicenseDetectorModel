# video_license_plate.py
import cv2
from paddleocr import PaddleOCR
from ultralytics import YOLO

ocr = PaddleOCR(use_angle_cls=True, lang='en')
model = YOLO("YOLO_MODELS/detect/train/weights/best.pt")

def detect_license_plate(image):
    results = model.predict(source=image, conf=0.25)
    best_plate = None
    best_confidence = 0
    best_box = None

    for result in results:
        if len(result.boxes) == 0:
            continue

        for box in result.boxes:
            confidence = float(box.conf[0])
            if confidence > best_confidence:
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                if x2 <= x1 or y2 <= y1:
                    continue

                cropped_plate = image[y1:y2, x1:x2]
                best_plate = cropped_plate
                best_confidence = confidence
                best_box = (x1, y1, x2, y2)

    if best_plate is None:
        return None, image

    x1, y1, x2, y2 = best_box
    cv2.rectangle(image, (x1, y1), (x2, y2), (0, 255, 0), 2)
    return best_plate, image

def extract_text_with_paddleocr(image):
    if len(image.shape) == 2 or image.shape[2] == 1:
        image = cv2.cvtColor(image, cv2.COLOR_GRAY2BGR)

    image = cv2.resize(image, None, fx=2, fy=2, interpolation=cv2.INTER_LINEAR)
    image = cv2.convertScaleAbs(image, alpha=1.5, beta=0)

    result = ocr.ocr(image, cls=True)
    if not result or not result[0]:
        print("[DEBUG] OCR returned no results")
        cv2.imwrite("debug_failed_plate.png", image)
        return []

    texts = [line[1][0] for line in result[0]]
    print(f"[DEBUG] OCR Detected Texts: {texts}")
    return texts

def process_license_plate(image):
    plate, detected_image = detect_license_plate(image)
    if plate is None:
        return None, detected_image, None

    ocr_texts = extract_text_with_paddleocr(plate)
    if not ocr_texts:
        return None, detected_image, None

    formatted_text = " ".join(ocr_texts)
    cv2.putText(
        detected_image,
        formatted_text,
        (10, 30),
        cv2.FONT_HERSHEY_SIMPLEX,
        1,
        (0, 255, 0),
        2,
        cv2.LINE_AA,
    )
    print(f"[RESULT] Plate: {formatted_text}")
    return plate, detected_image, formatted_text
