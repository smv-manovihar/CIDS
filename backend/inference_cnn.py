import os
import joblib
import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow import keras
from typing import Dict, Any, List
from functools import lru_cache

# Assumes the scaler is in models/ and the cnn model is in models/cnn/
SCALER_PATH = r"models/nf_scaler.pkl"
CNN_MODEL_PATH = r"models/cnn/cnn_model.h5"

# Class labels for classification
CLASSES = ["Backdoor", "scanning", "password", "injection", "mitm", "ransomware", "xss", "Benign", "dos", "ddos"]

@lru_cache(maxsize=1)
def load_artifacts():
    """
    Loads the scaler and the CNN model from the specified paths.
    The function is cached to avoid reloading the artifacts on every call.
    """
    print("Loading CNN artifacts...")
    if not os.path.exists(SCALER_PATH):
        raise FileNotFoundError(f"Scaler not found at {SCALER_PATH}")
    scaler = joblib.load(SCALER_PATH)

    if not os.path.exists(CNN_MODEL_PATH):
        raise FileNotFoundError(f"Model not found at {CNN_MODEL_PATH}")
    model = keras.models.load_model(CNN_MODEL_PATH)

    return scaler, model

def _common_preprocessing_cnn(df: pd.DataFrame, scaler) -> np.ndarray:
    """
    Preprocesses the input DataFrame for the CNN model.
    This includes dropping unnecessary columns, handling missing values,
    scaling the features, and reshaping the data for the CNN.
    """
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
    # Reshape data for the CNN model, as seen in the notebook
    X_cnn = X_scaled.reshape((X_scaled.shape[0], X_scaled.shape[1], 1))
    return X_cnn

def _run_inference(X_cnn: np.ndarray, model) -> Dict[str, Any]:
    """
    Runs inference on the preprocessed data using the loaded CNN model.
    """
    preds_proba = model.predict(X_cnn, verbose=0)
    pred_idx = np.argmax(preds_proba, axis=1)
    max_conf = np.max(preds_proba, axis=1)
    return {
        "indices": pred_idx,
        "probabilities": preds_proba,
        "confidence": max_conf,
        "predicted_classes": [CLASSES[i] for i in pred_idx]
    }

def predict_from_csv(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Main function to get predictions from a DataFrame.
    """
    scaler, model = load_artifacts()
    X_cnn = _common_preprocessing_cnn(df, scaler)
    return _run_inference(X_cnn, model)

def predict_from_json(partial_data: List[Dict]) -> Dict[str, Any]:
    """
    Main function to get predictions from JSON data.
    Assumes a 'derive_features' function is available to process the raw data.
    """
    # Assuming derive_features is defined in another module as in the LSTM script.
    from derive import derive_features
    scaler, model = load_artifacts()
    df_partial = pd.DataFrame(partial_data)
    df_full = derive_features(df_partial)
    X_cnn = _common_preprocessing_cnn(df_full, scaler)
    return _run_inference(X_cnn, model)
