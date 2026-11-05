from flask import Flask, send_from_directory, jsonify
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
app = Flask(__name__, static_folder="static", static_url_path="/static")

@app.get("/")
def home():
    return send_from_directory(BASE_DIR, "index.html")

@app.get("/health")
def health():
    return jsonify({"service":"JalRakshak AI - Seva First Innovation Challenge Edition","status":"ok",
                    "mode":"Flask-hosted browser prototype","storage":"browser localStorage"})

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
