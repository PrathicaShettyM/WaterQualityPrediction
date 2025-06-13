from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
import serial
import threading
import os
import time
import traceback
import requests
import math
import numpy as np
import joblib

load_dotenv()
app = Flask(__name__)
CORS(app, origins=["http://localhost:5173", "http://127.0.0.1:5173"])

# Gemini REST API setup
api_key = os.getenv("GEMINI_API_KEY")
gemini_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}"

# Latest turbidity data
latest_data = {"value": 0.0}

# Serial reading from Arduino
def read_from_serial():
    global latest_data
    while True:
        try:
            data = arduino.readline().decode().strip()
            if data and "Turbidity:" in data:
                value = float(data.split(":")[1])
                latest_data["value"] = value
                print("Turbidity:", value)
        except Exception as e:
            print("Serial error:", e)

if os.environ.get("WERKZEUG_RUN_MAIN") == "true" and os.getenv("ENABLE_SERIAL", "1") == "1":
    try:
        arduino = serial.Serial('COM10', 9600, timeout=2)
        thread = threading.Thread(target=read_from_serial)
        thread.daemon = True
        thread.start()
        print("Serial thread started.")
    except Exception as serial_err:
        print("Failed to open serial port:", serial_err)

# Utility: check if value is valid float
def is_valid_number(val):
    try:
        f = float(val)
        return math.isfinite(f)
    except:
        return False

@app.route("/data")
def get_data():
    try:
        value = float(latest_data.get("value", 0.0))
        return jsonify({"value": value})
    except Exception:
        return jsonify({"value": 0.0})

# Lab tested values (used in ML and Gemini)
LAB_TESTED_PH = 7.2
LAB_TESTED_TDS = 500
EQUIPMENT_DEPTH = 2.0  # meters
FILTER_FLOW = 4.5      # L/min

# Load model and scaler
model = joblib.load('filter_lifespan_xgb_model.pkl')
scaler = joblib.load('filter_scaler.pkl')

@app.route('/predict', methods=['POST'])
def predict_filter_lifespan():
    data = request.get_json()
    try:
        turbidity = data.get('turbidity')
        if turbidity is None:
            return jsonify({'error': 'Turbidity value is required'}), 400

        input_features = np.array([[LAB_TESTED_TDS, turbidity, LAB_TESTED_PH, EQUIPMENT_DEPTH, FILTER_FLOW]])
        scaled_input = scaler.transform(input_features)
        predicted_life = model.predict(scaled_input)[0]

        return jsonify({
            'predicted_life_hours': round(float(predicted_life), 2)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 400

# Gemini analysis generator
def generate_gemini_insight(turbidity_data):
    average = round(np.mean(turbidity_data), 2)

    # Predict using ML model
    input_features = np.array([[LAB_TESTED_TDS, average, LAB_TESTED_PH, EQUIPMENT_DEPTH, FILTER_FLOW]])
    scaled_input = scaler.transform(input_features)
    prediction = model.predict(scaled_input)[0]
    prediction = round(float(prediction), 2)

    prompt = f"""
You are analyzing real-time water turbidity and quality data from a smart monitoring system using an algae-based nanoparticle filter.

Context:
- Average turbidity over 2 minutes: {average} NTU
- ML features used:
    • pH: {LAB_TESTED_PH}
    • TDS: {LAB_TESTED_TDS}
    • Depth: {EQUIPMENT_DEPTH} m
    • Flow rate: {FILTER_FLOW} L/min
- ML Prediction: Estimated filter lifespan = {prediction} hours

Generate a concise technical report for experts, covering:
1. Overall trend in turbidity (avoid detailed per-second breakdown).
2. Interpretation of the ML prediction in context of water properties.
3. Clear conclusion: Is the filter performing well or degrading?
4. Actionable preventive maintenance suggestions for sustaining or improving filter efficiency.

Avoid analogies, storytelling, or basic turbidity explanations. Keep it professional and insight-focused.
"""

    payload = {
        "contents": [
            {
                "parts": [{"text": prompt}]
            }
        ]
    }

    try:
        response = requests.post(gemini_url, json=payload)
        if response.status_code == 200:
            result = response.json()
            candidates = result.get("candidates", [])
            if candidates and "content" in candidates[0]:
                return candidates[0]["content"]["parts"][0]["text"]
        print("Gemini API Error Response:", response.text)
    except Exception as e:
        print("Error during Gemini request:", e)

    return "Failed to get analysis from Gemini API."

@app.route('/gemini', methods=['POST'])
def gemini_analysis():
    try:
        raw_values = request.json.get('data', [])
        print("Received for Gemini:", raw_values)

        values = [float(v) for v in raw_values if is_valid_number(v)]

        if len(values) < 10:
            return jsonify({"error": "Not enough data points"}), 400

        analysis = generate_gemini_insight(values)
        print("Gemini Final Analysis:", analysis)
        return jsonify({"analysis": analysis})

    except Exception as e:
        print("Gemini Endpoint Error:", e)
        traceback.print_exc()
        return jsonify({"error": "Gemini analysis failed"}), 500

if __name__ == '__main__':
    app.run(debug=True)
