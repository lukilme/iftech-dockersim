from flask import Flask

app = Flask(__name__)

@app.route("/")
def home():
    return "Aplicação em modo desenvolvimento com hot-reload!"

if __name__ == "__main__":
    print("hot reaload")
    app.run(host="0.0.0.0", port=5000, debug=True)