import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, ConfigDict, field_validator
from typing import List, Dict, Any, Union, Optional
import time
import io
import base64
import re
import inference_lstm as lst
import inference_cnn as cnn

try:
    import xgboost_inference
    import inference_rf

    MODULES_AVAILABLE = True
except ImportError:
    print("Warning: Custom model modules not found.")
    MODULES_AVAILABLE = False

app = FastAPI(title="Dynamic NetFlow Attack Detection")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODELS = [
    "Random Forest",
    "CNN",
    "XGBoost",
    "LSTM",
]

CLASSES = [
    "Benign",
    "Backdoor",
    "DDoS",
    "DoS",
    "Injection",
    "MITM",
    "Password",
    "Ransomware",
    "Scanning",
    "XSS",
]


class NetworkFlow(BaseModel):
    """Schema for a single manual-entry network flow used in /api/analyze_data."""

    model_config = ConfigDict(populate_by_name=True)

    id: str
    L4_SRC_PORT: Union[int, str] = Field(..., alias="sourcePort")
    L4_DST_PORT: Union[int, str] = Field(..., alias="destPort")
    PROTOCOL: Union[int, str] = Field(..., alias="protocol")
    IN_BYTES: Union[int, str] = Field(..., alias="bytes")
    IN_PKTS: Union[int, str] = Field(..., alias="packets")
    L7_PROTO: Union[float, str] = Field(0.0, alias="l7Proto")
    TCP_FLAGS: Union[int, str] = Field(0, alias="tcpFlags")
    FLOW_DURATION_MILLISECONDS: Union[int, str] = Field(0, alias="flowDuration")
    OUT_BYTES: int = 0
    OUT_PKTS: int = 0

    @field_validator(
        "L4_SRC_PORT",
        "L4_DST_PORT",
        "PROTOCOL",
        "IN_BYTES",
        "IN_PKTS",
        "TCP_FLAGS",
        "FLOW_DURATION_MILLISECONDS",
        mode="before",
    )
    @classmethod
    def parse_int_fields(cls, v: Union[int, float, str, None]) -> int:
        """Coerce incoming string/blank values into integers for numeric fields."""
        if v == "" or v is None:
            return 0
        if isinstance(v, str):
            try:
                return int(float(v))
            except ValueError:
                return 0
        return int(v)

    @field_validator("L7_PROTO", mode="before")
    @classmethod
    def parse_float_fields(cls, v: Union[float, str, None]) -> float:
        """Coerce incoming string/blank values into floats for numeric fields."""
        if v == "" or v is None:
            return 0.0
        if isinstance(v, str):
            try:
                return float(v)
            except ValueError:
                return 0.0
        return float(v)


class AnalyzeBatchRequest(BaseModel):
    # For manual entry we accept arbitrary NetFlow feature dictionaries so the
    # frontend can send rows that match the CSV/schema feature set.
    flows: List[Dict[str, Any]]
    model: str = "Random Forest"


class AttackType(BaseModel):
    type: str
    count: int
    confidence: float


class AnalysisResult(BaseModel):
    filename: str
    model_used: str
    rows_analyzed: int
    attacks_detected: int
    attack_types: List[AttackType]
    analysis_time: float
    csv_file: str


class ColumnSchema(BaseModel):
    """Schema description for a single CSV column used by the /api/schema/columns endpoint."""

    name: str
    type: str
    description: str
    required: bool
    example: str


# Static schema definition for CSV uploads, used by the frontend "View Schema" dialog.
# This must match the feature set expected by the ML models.
CSV_COLUMN_SCHEMA: List[ColumnSchema] = [
    ColumnSchema(
        name="FLOW_START_MILLISECONDS",
        type="integer",
        description="Flow start time in UNIX epoch milliseconds",
        required=True,
        example="1556532001100",
    ),
    ColumnSchema(
        name="FLOW_END_MILLISECONDS",
        type="integer",
        description="Flow end time in UNIX epoch milliseconds",
        required=True,
        example="1556532001800",
    ),
    ColumnSchema(
        name="IPV4_SRC_ADDR",
        type="string",
        description="Source IPv4 address",
        required=True,
        example="192.168.1.120",
    ),
    ColumnSchema(
        name="L4_SRC_PORT",
        type="integer",
        description="Source layer-4 port",
        required=True,
        example="48762",
    ),
    ColumnSchema(
        name="IPV4_DST_ADDR",
        type="string",
        description="Destination IPv4 address",
        required=True,
        example="192.168.1.1",
    ),
    ColumnSchema(
        name="L4_DST_PORT",
        type="integer",
        description="Destination layer-4 port",
        required=True,
        example="80",
    ),
    ColumnSchema(
        name="PROTOCOL",
        type="integer",
        description="IP protocol number (e.g. 6 = TCP, 17 = UDP)",
        required=True,
        example="6",
    ),
    ColumnSchema(
        name="L7_PROTO",
        type="integer",
        description="Application-layer protocol identifier",
        required=True,
        example="80",
    ),
    ColumnSchema(
        name="IN_BYTES",
        type="integer",
        description="Total bytes from source to destination",
        required=True,
        example="35000",
    ),
    ColumnSchema(
        name="IN_PKTS",
        type="integer",
        description="Total packets from source to destination",
        required=True,
        example="450",
    ),
    ColumnSchema(
        name="OUT_BYTES",
        type="integer",
        description="Total bytes from destination to source",
        required=True,
        example="7800",
    ),
    ColumnSchema(
        name="OUT_PKTS",
        type="integer",
        description="Total packets from destination to source",
        required=True,
        example="180",
    ),
    ColumnSchema(
        name="TCP_FLAGS",
        type="integer",
        description="Combined TCP flags observed in the flow",
        required=True,
        example="24",
    ),
    ColumnSchema(
        name="CLIENT_TCP_FLAGS",
        type="integer",
        description="TCP flags set by the client side",
        required=True,
        example="24",
    ),
    ColumnSchema(
        name="SERVER_TCP_FLAGS",
        type="integer",
        description="TCP flags set by the server side",
        required=True,
        example="18",
    ),
    ColumnSchema(
        name="FLOW_DURATION_MILLISECONDS",
        type="integer",
        description="Total duration of the flow in milliseconds",
        required=True,
        example="700",
    ),
    ColumnSchema(
        name="DURATION_IN",
        type="integer",
        description="Duration of inbound traffic in milliseconds",
        required=True,
        example="700",
    ),
    ColumnSchema(
        name="DURATION_OUT",
        type="integer",
        description="Duration of outbound traffic in milliseconds",
        required=True,
        example="700",
    ),
    ColumnSchema(
        name="MIN_TTL",
        type="integer",
        description="Minimum TTL value observed in the flow",
        required=True,
        example="64",
    ),
    ColumnSchema(
        name="MAX_TTL",
        type="integer",
        description="Maximum TTL value observed in the flow",
        required=True,
        example="64",
    ),
    ColumnSchema(
        name="LONGEST_FLOW_PKT",
        type="integer",
        description="Size in bytes of the largest packet in the flow",
        required=True,
        example="1300",
    ),
    ColumnSchema(
        name="SHORTEST_FLOW_PKT",
        type="integer",
        description="Size in bytes of the smallest packet in the flow",
        required=True,
        example="80",
    ),
    ColumnSchema(
        name="MIN_IP_PKT_LEN",
        type="integer",
        description="Minimum IP packet length observed",
        required=True,
        example="60",
    ),
    ColumnSchema(
        name="MAX_IP_PKT_LEN",
        type="integer",
        description="Maximum IP packet length observed",
        required=True,
        example="1500",
    ),
    ColumnSchema(
        name="SRC_TO_DST_SECOND_BYTES",
        type="integer",
        description="Bytes per second from source to destination",
        required=True,
        example="35000",
    ),
    ColumnSchema(
        name="DST_TO_SRC_SECOND_BYTES",
        type="integer",
        description="Bytes per second from destination to source",
        required=True,
        example="7800",
    ),
    ColumnSchema(
        name="RETRANSMITTED_IN_BYTES",
        type="integer",
        description="Retransmitted bytes from source to destination",
        required=True,
        example="0",
    ),
    ColumnSchema(
        name="RETRANSMITTED_IN_PKTS",
        type="integer",
        description="Retransmitted packets from source to destination",
        required=True,
        example="0",
    ),
    ColumnSchema(
        name="RETRANSMITTED_OUT_BYTES",
        type="integer",
        description="Retransmitted bytes from destination to source",
        required=True,
        example="0",
    ),
    ColumnSchema(
        name="RETRANSMITTED_OUT_PKTS",
        type="integer",
        description="Retransmitted packets from destination to source",
        required=True,
        example="0",
    ),
    ColumnSchema(
        name="SRC_TO_DST_AVG_THROUGHPUT",
        type="float",
        description="Average throughput from source to destination (bytes/sec)",
        required=True,
        example="10000.0",
    ),
    ColumnSchema(
        name="DST_TO_SRC_AVG_THROUGHPUT",
        type="float",
        description="Average throughput from destination to source (bytes/sec)",
        required=True,
        example="1300.0",
    ),
    ColumnSchema(
        name="NUM_PKTS_UP_TO_128_BYTES",
        type="integer",
        description="Number of packets with size up to 128 bytes",
        required=True,
        example="40",
    ),
    ColumnSchema(
        name="NUM_PKTS_128_TO_256_BYTES",
        type="integer",
        description="Number of packets with size between 128 and 256 bytes",
        required=True,
        example="30",
    ),
    ColumnSchema(
        name="NUM_PKTS_256_TO_512_BYTES",
        type="integer",
        description="Number of packets with size between 256 and 512 bytes",
        required=True,
        example="18",
    ),
    ColumnSchema(
        name="NUM_PKTS_512_TO_1024_BYTES",
        type="integer",
        description="Number of packets with size between 512 and 1024 bytes",
        required=True,
        example="10",
    ),
    ColumnSchema(
        name="NUM_PKTS_1024_TO_1514_BYTES",
        type="integer",
        description="Number of packets with size between 1024 and 1514 bytes",
        required=True,
        example="5",
    ),
    ColumnSchema(
        name="TCP_WIN_MAX_IN",
        type="integer",
        description="Maximum TCP window size from source to destination",
        required=True,
        example="40000",
    ),
    ColumnSchema(
        name="TCP_WIN_MAX_OUT",
        type="integer",
        description="Maximum TCP window size from destination to source",
        required=True,
        example="40000",
    ),
    ColumnSchema(
        name="ICMP_TYPE",
        type="integer",
        description="ICMP type field value",
        required=True,
        example="0",
    ),
    ColumnSchema(
        name="ICMP_IPV4_TYPE",
        type="integer",
        description="ICMP IPv4 type field value",
        required=True,
        example="0",
    ),
    ColumnSchema(
        name="DNS_QUERY_ID",
        type="integer",
        description="DNS query identifier",
        required=True,
        example="0",
    ),
    ColumnSchema(
        name="DNS_QUERY_TYPE",
        type="integer",
        description="DNS query type",
        required=True,
        example="0",
    ),
    ColumnSchema(
        name="DNS_TTL_ANSWER",
        type="integer",
        description="DNS TTL value in the answer",
        required=True,
        example="0",
    ),
    ColumnSchema(
        name="FTP_COMMAND_RET_CODE",
        type="integer",
        description="FTP server return code for commands",
        required=True,
        example="0",
    ),
    ColumnSchema(
        name="SRC_TO_DST_IAT_MIN",
        type="integer",
        description="Minimum inter-arrival time from source to destination (ms)",
        required=True,
        example="8",
    ),
    ColumnSchema(
        name="SRC_TO_DST_IAT_MAX",
        type="integer",
        description="Maximum inter-arrival time from source to destination (ms)",
        required=True,
        example="350",
    ),
    ColumnSchema(
        name="SRC_TO_DST_IAT_AVG",
        type="float",
        description="Average inter-arrival time from source to destination (ms)",
        required=True,
        example="120.0",
    ),
    ColumnSchema(
        name="SRC_TO_DST_IAT_STDDEV",
        type="float",
        description="Standard deviation of inter-arrival time source to destination (ms)",
        required=True,
        example="30.0",
    ),
    ColumnSchema(
        name="DST_TO_SRC_IAT_MIN",
        type="integer",
        description="Minimum inter-arrival time from destination to source (ms)",
        required=True,
        example="9",
    ),
    ColumnSchema(
        name="DST_TO_SRC_IAT_MAX",
        type="integer",
        description="Maximum inter-arrival time from destination to source (ms)",
        required=True,
        example="300",
    ),
    ColumnSchema(
        name="DST_TO_SRC_IAT_AVG",
        type="float",
        description="Average inter-arrival time from destination to source (ms)",
        required=True,
        example="100.0",
    ),
    ColumnSchema(
        name="DST_TO_SRC_IAT_STDDEV",
        type="float",
        description="Standard deviation of inter-arrival time destination to source (ms)",
        required=True,
        example="22.0",
    ),
]

# Convenience list of required CSV column names for validation.
REQUIRED_CSV_COLUMNS = [col.name for col in CSV_COLUMN_SCHEMA]

# Convenience lists of numeric vs string feature columns
NUMERIC_CSV_COLUMNS = [
    col.name for col in CSV_COLUMN_SCHEMA if col.type in ("integer", "float")
]
STRING_CSV_COLUMNS = [col.name for col in CSV_COLUMN_SCHEMA if col.type == "string"]


def build_manual_df(flows: List[Dict[str, Any]]) -> pd.DataFrame:
    """
    Normalize manual-entry flows into a DataFrame that matches the full
    NetFlow feature schema expected by the models.
    """
    df = pd.DataFrame(flows)

    # Ensure all required feature columns exist
    for col in REQUIRED_CSV_COLUMNS:
        if col not in df.columns:
            df[col] = None

    # Coerce numeric features
    for col in NUMERIC_CSV_COLUMNS:
        df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)

    # Coerce string features (e.g., IP addresses)
    for col in STRING_CSV_COLUMNS:
        df[col] = df[col].fillna("").astype(str)

    return df


def is_valid_ip(val):
    """Checks if a value looks like an IPv4 address."""
    if not isinstance(val, str):
        return False
    # Regex for standard IPv4
    ip_pattern = r"^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$"
    return bool(re.match(ip_pattern, val))


def find_ip_columns_by_content(df):
    """
    Scans the first 5 rows of string columns to find actual IP addresses.
    Returns (src_col, dst_col).
    """
    potential_ips = []

    # Check only object/string columns
    str_cols = df.select_dtypes(include=["object"]).columns

    for col in str_cols:
        # Check first valid value
        sample = df[col].dropna().iloc[0] if not df[col].dropna().empty else ""
        if is_valid_ip(str(sample)):
            potential_ips.append(col)

    src = None
    dst = None

    # If we found columns containing IPs, try to assign them based on name
    if potential_ips:
        # Try to find 'src' specific
        src = next(
            (c for c in potential_ips if "src" in c.lower() or "source" in c.lower()),
            None,
        )
        # Try to find 'dst' specific
        dst = next(
            (c for c in potential_ips if "dst" in c.lower() or "dest" in c.lower()),
            None,
        )

        # Fallback: if we have 2 IP columns but names didn't match, assume first is src, second is dst
        if not src and len(potential_ips) > 0:
            src = potential_ips[0]
        if not dst and len(potential_ips) > 1:
            dst = potential_ips[1]

    return src, dst


def get_column_mapping(df):
    mapping = {}

    # 1. Content-Based IP Detection (Most Accurate)
    src_ip, dst_ip = find_ip_columns_by_content(df)

    # 2. Name-Based Fallback (if content check failed or empty file)
    if not src_ip:
        src_candidates = ["src_ip", "source_ip", "ip_src", "src_addr", "IPV4_SRC_ADDR"]
        src_ip = next((c for c in df.columns if c.lower() in src_candidates), None)

    if not dst_ip:
        dst_candidates = ["dst_ip", "dest_ip", "ip_dst", "dst_addr", "IPV4_DST_ADDR"]
        dst_ip = next((c for c in df.columns if c.lower() in dst_candidates), None)

    mapping["src"] = src_ip
    mapping["dst"] = dst_ip

    # 3. Packet Count (Look for 'pkt' or 'packets' but EXCLUDE 'src'/'dst' keywords)
    # This prevents matching "src_packets" if we want total packets, or differentiates from IPs
    pkt_candidates = [
        c
        for c in df.columns
        if any(k in c.lower() for k in ["packets", "pkts", "tot_pkts"])
    ]
    mapping["pkts"] = pkt_candidates[0] if pkt_candidates else None

    return mapping


def run_dynamic_inference_on_df(df: pd.DataFrame, model_name: str):
    def predict_row(row):
        risk_score = 0
        bytes_val = 0
        pkts_val = 0

        for col in row.index:
            c_low = str(col).lower()
            val = row[col]
            if isinstance(val, (int, float)):
                if "byte" in c_low:
                    bytes_val = val
                if "packet" in c_low or "pkt" in c_low:
                    pkts_val = val

        if bytes_val > 40000:
            risk_score += 0.5
        if pkts_val > 500:
            risk_score += 0.4

        if risk_score > 0.8:
            return "DDoS", 0.98
        elif risk_score > 0.6:
            return "Scanning", 0.85
        elif risk_score > 0.4:
            return "DoS", 0.75
        else:
            return "Benign", 0.99

    results = df.apply(predict_row, axis=1, result_type="expand")
    return results[0], results[1]


@app.get("/api/models")
def get_models() -> List[str]:
    return MODELS


@app.get("/api/schema/columns", response_model=List[ColumnSchema])
def get_csv_schema() -> List[ColumnSchema]:
    """Expose the expected CSV schema for the frontend 'View Schema' dialogs."""
    return CSV_COLUMN_SCHEMA


@app.post("/api/analyze_data")
def analyze_batch(req: AnalyzeBatchRequest):
    if req.model not in MODELS:
        raise HTTPException(400, f"Invalid model: {req.model}")

    start = time.time()
    count = len(req.flows)

    try:
        if count == 0:
            results = {
                "indices": np.zeros(0, dtype=int),
                "confidence": np.zeros(0, dtype=float),
                "probabilities": np.zeros((0, len(CLASSES))),
            }
        else:
            df_manual = build_manual_df(req.flows)

            if not MODULES_AVAILABLE:
                results = {
                    "indices": np.zeros(count, dtype=int),
                    "confidence": np.ones(count, dtype=float) * 0.5,
                    "probabilities": np.zeros((count, len(CLASSES))),
                }
            else:
                if req.model == "RandomForest-v1.2":
                    results = inference_rf.predict_from_csv(df_manual)
                elif req.model == "XGBoost-Enhanced-v2.0":
                    results = xgboost_inference.predict_from_csv(df_manual)
                elif req.model == "LSTM-v3.0":
                    results = lst.predict_from_csv(df_manual)
                elif req.model == "Neural-Network-v1.5":
                    results = cnn.predict_from_csv(df_manual)
                else:
                    results = {
                        "indices": np.zeros(count, dtype=int),
                        "confidence": np.zeros(count, dtype=float),
                        "probabilities": np.zeros((count, len(CLASSES))),
                    }

    except Exception as e:
        raise HTTPException(500, f"Inference Failed: {str(e)}")

    end = time.time()

    processed_results = []
    pred_indices = results["indices"]
    confidences = results["confidence"]

    for i, flow in enumerate(req.flows):
        idx = int(pred_indices[i])
        conf = float(confidences[i])
        is_threat = idx != 0
        threat_type = CLASSES[idx] if idx < len(CLASSES) else f"Unknown({idx})"

        if not is_threat:
            risk = "Normal"
        elif conf > 0.9:
            risk = "Critical"
        elif conf > 0.7:
            risk = "High"
        else:
            risk = "Medium"

        # Support both dict-based and model-based flows
        if isinstance(flow, dict):
            flow_id = flow.get("id", str(i + 1))
        else:
            flow_id = getattr(flow, "id", str(i + 1))

        processed_results.append(
            {
                "flow_id": flow_id,
                "is_threat": is_threat,
                "prediction": threat_type,
                "confidence": round(conf, 4),
                "risk_level": risk,
            }
        )

    return {
        "status": "success",
        "total_entries": count,
        "model_used": req.model,
        "results": processed_results,
        "analysis_time": round(end - start, 3),
    }


@app.post("/api/analyze", response_model=AnalysisResult)
async def analyze_file(file: UploadFile = File(...), model: str = Form(...)):
    start_time = time.time()

    if not file.filename.endswith(".csv"):
        raise HTTPException(
            status_code=400, detail="Invalid file type. Only CSV allowed."
        )

    try:
        contents = await file.read()
        df_original = pd.read_csv(io.BytesIO(contents))

        # Validate that the uploaded CSV contains the full required feature schema.
        missing_cols = [c for c in REQUIRED_CSV_COLUMNS if c not in df_original.columns]
        if missing_cols:
            raise HTTPException(
                status_code=400,
                detail=f"Missing required columns: {', '.join(missing_cols)}",
            )

        # Run model inference
        num_rows = len(df_original)

        if not MODULES_AVAILABLE:
            # Fallback: simple heuristic-based detection using the same feature set
            predictions, confidences = run_dynamic_inference_on_df(df_original, model)
            class_series = predictions
            conf_series = confidences
        else:
            if model == "Random Forest":
                results = inference_rf.predict_from_csv(df_original)
            elif model == "XGBoost":
                results = xgboost_inference.predict_from_csv(df_original)
            elif model == "LSTM":
                results = lst.predict_from_csv(df_original)
            elif model == "CNN":
                results = cnn.predict_from_csv(df_original)
            else:
                results = {
                    "indices": np.zeros(num_rows, dtype=int),
                    "confidence": np.zeros(num_rows, dtype=float),
                    "probabilities": np.zeros((num_rows, len(CLASSES))),
                }

            pred_indices = results["indices"]
            confidences = results["confidence"]

            labels = [
                CLASSES[int(idx)] if int(idx) < len(CLASSES) else f"Unknown({int(idx)})"
                for idx in pred_indices
            ]
            class_series = pd.Series(labels, index=df_original.index)
            conf_series = pd.Series(confidences, index=df_original.index)

        # Build output DataFrame: original features + model prediction/score
        df_final = df_original.copy()
        df_final["Class"] = class_series.values
        df_final["Confidence"] = conf_series.values

        total_rows = len(df_final)
        attack_df = df_final[~df_final["Class"].isin(["Benign", "Normal"])]
        attacks_detected = len(attack_df)

        attack_types_list = []
        if not attack_df.empty:
            attack_counts = attack_df["Class"].value_counts()
            for attack_type, count in attack_counts.items():
                avg_conf = attack_df[attack_df["Class"] == attack_type][
                    "Confidence"
                ].mean()
                attack_types_list.append(
                    {
                        "type": attack_type,
                        "count": int(count),
                        "confidence": round(float(avg_conf), 2),
                    }
                )

        stream = io.StringIO()
        df_final.to_csv(stream, index=False)
        csv_string = stream.getvalue()
        csv_base64 = base64.b64encode(csv_string.encode("utf-8")).decode("utf-8")

        process_time = round(time.time() - start_time, 2)

        return {
            "filename": file.filename,
            "model_used": model,
            "rows_analyzed": total_rows,
            "attacks_detected": attacks_detected,
            "attack_types": attack_types_list,
            "analysis_time": process_time,
            "csv_file": csv_base64,
        }

    except Exception as e:
        import traceback

        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
