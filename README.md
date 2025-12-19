# Cortex : Intrusion Detection System

**Cortex** is an AI-powered Intrusion Detection System (IDS) designed to analyze network traffic patterns and classify potential threats. By utilizing machine learning models—including Convolutional Neural Networks (CNN), Long Short-Term Memory (LSTM) networks, and ensemble methods like Random Forest and XGBoost—Cortex helps identify various forms of malicious network activity.

The system provides a web interface for security analysts to audit network logs, visualize threat distributions, and analyze network flow data.

---

## 🚀 Key Features

*   **Multi-Model Analysis Engine**: Choose between various high-performance models (Random Forest, CNN, XGBoost, LSTM) to balance between speed and accuracy based on your specific deployment needs.
*   **Comprehensive Threat Detection**: Capable of identifying a wide spectrum of malicious activities, including:
    *   DDoS & DoS Attacks
    *   Port Scanning & Probing
    *   Botnet Activity (Backdoor)
    *   Web Attacks (Injection, XSS)
    *   MITM (Man-in-the-Middle)
    *   Ransomware Signatures
*   **Batch Log Analysis**: Upload CSV-based network traffic logs (NetFlow/IPFIX) for bulk processing and immediate risk assessment.
*   **Interactive Dashboard**:
    *   Visualize attack distribution and confidence levels.
    *   Filter results by risk severity (Critical, High, Medium, Low).
    *   Detailed breakdown of flow metrics.
*   **Manual Flow Inspection**: specialized tool for manually inputting network tuple data (IP, Port, Protocol, Flow Statistics) to simulate and test specific traffic scenarios.

## 🛠️ Tech Stack

### Backend
*   **Framework**: FastAPI (High-performance API)
*   **Machine Learning**: TensorFlow, Scikit-learn, XGBoost, LightGBM
*   **Data Processing**: Pandas, NumPy
*   **Validation**: Pydantic

### Frontend
*   **Framework**: Next.js 15 (App Router) & React 19
*   **Styling**: Tailwind CSS, Radix UI
*   **Components**: Shadcn/ui ecosystem
*   **Visualization**: Recharts
*   **Animations**: Framer Motion
*   **State & Forms**: React Hook Form, Zod

---

## ⚡ Getting Started

Follow these steps to set up the Cortex environment locally.

### Prerequisites
*   **Python 3.10+**
*   **Node.js 18+** & **npm/pnpm**

### 1. Backend Setup

Navigate to the backend directory and set up the Python environment using `uv`.

```bash
pip install uv
```

```bash
cd backend

# Install dependencies and sync environment
uv sync

# Activate the virtual environment
# On Windows:
.venv\Scripts\activate
# On macOS/Linux:
source .venv/bin/activate

# Run the API server
uvicorn app:app --reload
```

The backend API will be available at `http://localhost:8000`.

### 2. Frontend Setup

Open a new terminal, navigate to the frontend directory, and start the development server.

```bash
cd frontend

# Install dependencies
npm install
# or
pnpm install

# Start the development server
npm run dev
```

The web interface will be available at `http://localhost:3000`.

---

## 📖 Usage Guide

1.  **Select a Model**: On the dashboard, choose your preferred inference model (e.g., "Random Forest" for speed, "CNN" for complex pattern matching).
2.  **Upload Data**: Use the **File Analysis** tab to upload a captured network traffic CSV. Ensure your CSV matches the required schema (timestamps, IPs, ports, flow statistics).
3.  **Analyze**: Click "Analyze" to run the detection engine. Results will populate the dashboard with classification charts and a detailed risk table.
4.  **Manual Entry**: Use the **Manual Entry** tab to inspect single network flows by entering parameters like Source Port, Protocol, and Bytes Transferred.

---

## 🔮 Future Scope

*   **Live Traffic Monitoring**: Real-time packet capture and analysis directly from network interfaces (Feature currently in development).
*   **Automated Alerting**: Integration with email/Slack for immediate threat notifications.
*   **Model Retraining Pipeline**: GUI-based workflow to retrain models on new datasets to adapt to zero-day attacks.

---

**Cortex** — *Securing the digital frontier, one packet at a time.*
