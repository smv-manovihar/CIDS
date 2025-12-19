import os
import joblib
import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow import keras
from typing import Dict, Any, List
from functools import lru_cache

from derive import derive_features

SCALER_PATH = r"models\nf_scaler.pkl"
LSTM_MODEL_PATH = r"models\lstm\lstm_model.h5"

CLASSES = ["Backdoor", "scanning", "password", "injection", "mitm", "ransomware", "xss", "Benign", "dos", "ddos"]

@lru_cache(maxsize=1)
def load_artifacts():
    print("Loading LSTM artifacts...")
    
    if not os.path.exists(SCALER_PATH):
        raise FileNotFoundError(f"Scaler not found at {SCALER_PATH}")
    scaler = joblib.load(SCALER_PATH)
    
    if not os.path.exists(LSTM_MODEL_PATH):
        raise FileNotFoundError(f"Model not found at {LSTM_MODEL_PATH}")
    model = keras.models.load_model(LSTM_MODEL_PATH)
    
    return scaler, model

def _common_preprocessing(df: pd.DataFrame, scaler) -> np.ndarray:
    drop_cols = ['IPV4_SRC_ADDR', 'IPV4_DST_ADDR', 'Attack', 'Attack_Encoded', 'id']
    df = df.drop(columns=[c for c in drop_cols if c in df.columns])

    X_num = df.select_dtypes(include=[np.number])
    X_num = X_num.fillna(0) 

    if hasattr(scaler, 'feature_names_in_'):
        needed_features = scaler.feature_names_in_
        missing_cols = set(needed_features) - set(X_num.columns)
        for c in missing_cols:
            X_num[c] = 0
        X_num = X_num[needed_features]

    X_scaled = scaler.transform(X_num)
    
    X_lstm = X_scaled.reshape((X_scaled.shape[0], 1, X_scaled.shape[1]))

    return X_lstm

def _run_inference(X_lstm: np.ndarray, model) -> Dict[str, Any]:
    preds_proba = model.predict(X_lstm, verbose=0)
    
    pred_idx = np.argmax(preds_proba, axis=1)
    
    max_conf = np.max(preds_proba, axis=1)
    
    return {
        "indices": pred_idx,
        "probabilities": preds_proba,
        "confidence": max_conf,
        "predicted_classes": [CLASSES[i] for i in pred_idx]
    }

def predict_from_csv(df: pd.DataFrame) -> Dict[str, Any]:
    scaler, model = load_artifacts()
    
    X_lstm = _common_preprocessing(df, scaler)
    
    return _run_inference(X_lstm, model)

def predict_from_json(partial_data: List[Dict]) -> Dict[str, Any]:
    scaler, model = load_artifacts()
    
    df_partial = pd.DataFrame(partial_data)
    
    df_full = derive_features(df_partial)
    
    X_lstm = _common_preprocessing(df_full, scaler)
    
    return _run_inference(X_lstm, model)
