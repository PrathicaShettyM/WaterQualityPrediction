# 💧 Turbidity Monitoring & Water Quality Intelligence Dashboard - Interdisciplinary Project

![Project Status](https://img.shields.io/badge/status-active-brightgreen?style=flat-square)  
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Flask](https://img.shields.io/badge/Flask-000000?style=for-the-badge&logo=flask&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Gemini AI](https://img.shields.io/badge/Gemini_AI-5F43DC?style=for-the-badge&logo=google&logoColor=white)
![Sensor Data](https://img.shields.io/badge/Sensors-Turbidity_Low_Cost-ff9800?style=for-the-badge&logo=arduino&logoColor=white)

A real-time water turbidity monitoring and analytics dashboard powered by **Flask**, **React**, **Gemini AI**, and an **ML model** trained on chemical composition data.  

> 🔬 This project predicts the wear-out of an *Amaranthus cruentus* 🌿 algae-based nanoparticle filter used in water purification. The dashboard intelligently analyzes real-time turbidity and provides predictive maintenance suggestions using ML + AI.

---

## 🚀 Features

- ⚡ Real-time turbidity monitoring with graph updates every second
- 🤖 Gemini AI integration to generate intelligent insights every 2 minutes
- 🧠 ML prediction of *Amaranthus cruentus* 🌿 filter wear-out based on turbidity
- ⏱️ ML prediction triggered 2 seconds after Gemini's analysis
- 📊 Elegant UI built with React + TailwindCSS
- 🌐 Flask backend to serve sensor, ML, and AI data
- 🧪 Integrates low-cost turbidity sensors with lab-tested water composition data

---

## 🖼️ UI Preview

| Real-Time Chart | Gemini AI Analytics | ML Predictions |
|-----------------|---------------------|----------------|
| 📈 Graph of live turbidity values | 💡 Conversational water quality insights | ⌛ Estimated filter lifespan in hours |

---

## 🛠️ Tech Stack

**Frontend:**
- ⚛️ React
- 🎨 Tailwind CSS
- 📈 Recharts
- 📄 React Markdown

**Backend:**
- 🐍 Flask (Python)
- 🧠 ML Model (predicts filter wear-out)
- 🤖 Gemini AI (Google AI for water quality reports)

**Hardware:**
- 🌊 Turbidity Sensor (via Arduino/ESP32)
- 🧪 Water composition dataset from lab testing (pH, TDS, solids, etc.)

---

## ⚙️ How It Works

1. **📥 Sensor Data Collection**
   - Turbidity sensor data is fetched every second and displayed on a live graph.

2. **🧠 Gemini AI Analysis**
   - At the 2-minute mark, the frontend sends the last 120 seconds of turbidity data to the Flask `/gemini` endpoint.
   - Gemini returns a markdown-based conversational insight.

3. **⌛ ML Prediction**
   - 2 seconds after Gemini’s response, the current turbidity is sent to the `/predict` endpoint.
   - The ML model predicts filter lifespan (in hours) specifically for the *Amaranthus cruentus* 🌿 based filter.

4. **🖼️ Visual Display**
   - Data is displayed via animated charts, analytics cards, and markdown-formatted Gemini results.

---

## 🧪 Sample `.env` Configuration

```env
FLASK_ENV=development
MODEL_PATH=./model.pkl
GEMINI_API_KEY=your_api_key_here
```

## 🤝 Contribute
Pull requests are welcome! If you'd like to suggest a feature or bugfix, feel free to open an issue.