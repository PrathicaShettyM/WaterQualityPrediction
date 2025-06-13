import React, { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import ReactMarkdown from 'react-markdown';

export default function Dashboard() {
  const [turbidity, setTurbidity] = useState(null);
  const [dataPoints, setDataPoints] = useState([]);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [geminiResult, setGeminiResult] = useState(null);

  useEffect(() => {
    const interval = setInterval(() => {
      fetch('http://127.0.0.1:5000/data')
        .then(res => res.json())
        .then(data => {
          console.log("📥 Received turbidity data:", data);
          setTurbidity(data.value);
          setDataPoints(prev => [...prev.slice(-119), {
            value: data.value,
            time: new Date().toLocaleTimeString()
          }]);
          setSecondsElapsed(prev => prev + 1);
        })
        .catch(err => console.error("❌ Error fetching /data:", err));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (secondsElapsed === 10) {
      const valuesOnly = dataPoints.map(dp => dp.value);
      console.log("🚀 Triggering Gemini POST with data:", valuesOnly);

      fetch('http://127.0.0.1:5000/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: valuesOnly })
      })
        .then(async res => {
          const text = await res.text();
          console.log("📩 Raw response from Gemini:", text);

          try {
            const json = JSON.parse(text);
            if (json.analysis) {
              console.log("✅ Gemini analysis received:", json.analysis);
              setGeminiResult(json.analysis);
            } else {
              console.error("❌ Gemini returned unexpected structure:", json);
              setGeminiResult(json.error || "No insights found.");
            }
          } catch (e) {
            console.error("❌ Failed to parse JSON from Gemini:", e, text);
            setGeminiResult("Gemini returned malformed response.");
          }
        })
        .catch(err => {
          console.error("🚨 Network error contacting Gemini:", err);
          setGeminiResult("Error fetching Gemini insights.");
        });
    }
  }, [secondsElapsed, dataPoints]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white font-sans flex flex-col items-center justify-center p-6 relative overflow-hidden w-full">
      {/* Background Gradient Blobs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-10 -left-10 w-72 h-72 bg-cyan-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-10 -right-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 w-full mx-auto space-y-8 px-4">
        <div className="text-center mb-12">
          <h1 className="text-7xl font-extrabold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent drop-shadow-2xl mb-4 animate-pulse">
            💧 Turbidity Monitor
          </h1>
          <div className="w-32 h-1 bg-gradient-to-r from-cyan-400 to-purple-600 mx-auto rounded-full"></div>
        </div>

        {/* Real-Time Reading */}
        <div className="flex justify-center mb-10">
          <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-10 shadow-2xl hover:shadow-cyan-500/25 transition-all duration-500 hover:scale-105 hover:bg-white/10">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-cyan-300 mb-6 tracking-wide">REAL-TIME READING</h2>
              <div className="relative">
                <div className="text-8xl font-mono font-black bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-lg">
                  {turbidity !== null ? turbidity : '---'}
                </div>
                <div className="text-3xl font-semibold text-gray-300 mt-2 tracking-widest">NTU</div>
                <div className="absolute -top-4 -right-4 w-6 h-6 bg-green-500 rounded-full animate-ping"></div>
                <div className="absolute -top-4 -right-4 w-6 h-6 bg-green-500 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="flex justify-center mb-10">
          <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl hover:shadow-purple-500/25 transition-all duration-500 w-full max-w-7xl">
            <h2 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              📈 Live Data Visualization
            </h2>
            <div className="bg-black/20 rounded-2xl p-6 border border-purple-500/30">
              <ResponsiveContainer width="100%" height={500}>
                <LineChart data={dataPoints}>
                  <CartesianGrid strokeDasharray="5 5" stroke="#4f46e5" opacity={0.3} />
                  <XAxis dataKey="time" tick={{ fill: '#e2e8f0', fontSize: 12 }} />
                  <YAxis domain={[0, 1000]} tick={{ fill: '#e2e8f0', fontSize: 12 }} />
                  <Tooltip contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    borderColor: '#06b6d4',
                    borderRadius: '12px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                  }} />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="url(#gradient)"
                    strokeWidth={4}
                    dot={{ fill: '#06b6d4', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 8, fill: '#06b6d4', stroke: '#ffffff', strokeWidth: 2 }}
                    isAnimationActive={true}
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#06b6d4" />
                      <stop offset="50%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                  </defs>
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Insights Section */}
        <div className="flex flex-col gap-8 max-w-4xl mx-auto">

          {/* Gemini */}
          <div className="bg-gradient-to-br from-purple-900/40 via-pink-900/40 to-red-900/40 backdrop-blur-xl border border-purple-500/30 rounded-3xl p-8 shadow-2xl hover:shadow-purple-500/25 transition-all duration-500 hover:scale-105 hover:-translate-y-2">
            <div className="text-center">
              <div className="text-5xl mb-4">🤖</div>
              <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Gemini AI Analytics
              </h3>
              {geminiResult ? (
                <div className={`text-lg leading-relaxed whitespace-pre-wrap ${geminiResult.startsWith("Error") || geminiResult.startsWith("Gemini") ? "text-red-300" : "text-green-300"}`}>
                  <ReactMarkdown>
                    {geminiResult}
                  </ReactMarkdown>
                </div>
              ) : (
                <p className="text-gray-300 text-lg leading-relaxed">
                  {secondsElapsed < 120
                    ? `Collecting data... ${120 - secondsElapsed}s left for Gemini analysis.`
                    : "Generating insights..."}
                </p>
              )}

              <div className="mt-6 flex justify-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>

          {/* ML Card */}
          <div className="bg-gradient-to-br from-indigo-900/40 via-blue-900/40 to-cyan-900/40 backdrop-blur-xl border border-cyan-500/30 rounded-3xl p-8 shadow-2xl hover:shadow-cyan-500/25 transition-all duration-500 hover:scale-105 hover:-translate-y-2">
            <div className="text-center">
              <div className="text-5xl mb-4">📊</div>
              <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                ML Predictions
              </h3>
              <p className="text-gray-300 text-lg leading-relaxed">
                Machine learning models predict contamination levels and future trends using historical data for proactive water management.
              </p>
              <div className="mt-6 flex justify-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
