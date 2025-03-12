from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import torch
from transformers import BlipProcessor, BlipForConditionalGeneration
import io

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})  # Habilita CORS en todas las rutas

# Cargar el modelo mejorado (BLIP Large)
processor = BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-large")
model = BlipForConditionalGeneration.from_pretrained("Salesforce/blip-image-captioning-large")

@app.route("/describe", methods=["POST", "OPTIONS"])
def describe_image():
    if request.method == "OPTIONS":
        return jsonify({"message": "CORS preflight request"}), 200

    if "file" not in request.files:
        return jsonify({"error": "No se proporcionó una imagen"}), 400

    file = request.files["file"]
    image = Image.open(io.BytesIO(file.read()))

    # Generar la descripción directamente sin prompt para evitar repeticiones
    inputs = processor(images=image, return_tensors="pt")
    
    # Usar generación con muestreo para mayor variabilidad en la respuesta
    output = model.generate(**inputs, max_length=100, num_beams=7, do_sample=True)
    caption = processor.decode(output[0], skip_special_tokens=True)

    return jsonify({"description": caption})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
