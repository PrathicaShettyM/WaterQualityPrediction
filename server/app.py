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

# Endpoint to return latest sensor reading
@app.route("/data")
def get_data():
    try:
        value = float(latest_data.get("value", 0.0))
        return jsonify({"value": value})
    except Exception:
        return jsonify({"value": 0.0})

# Function to call Gemini via REST API
def generate_gemini_insight(turbidity_data):
    prompt = f"""
You are a smart water quality expert who is part of an algae-based nanoparticle filtration system. Analyze this turbidity data collected every second for 2 minutes:

{turbidity_data}

Your tasks:
- Mention average turbidity and interpret it clearly
- Identify whether water quality is improving or degrading
- Predict if the filter is wearing out or has already worn out
- Give a conversational, detailed explanation like you're speaking to a common man about a water quality demo
- Add preventive suggestions and impress them with your analysis
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

# Endpoint to post turbidity data for Gemini insight
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

if __name__ == "__main__":
    app.run(debug=True)
