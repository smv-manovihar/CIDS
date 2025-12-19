import os
import joblib
import numpy as np
import pandas as pd
import xgboost as xgb
from typing import Dict, Any, List
from functools import lru_cache

# Import the derivation logic
from derive import derive_features

# Paths
SCALER_PATH = r"models\nf_scaler.pkl"
TOP_FEATURES_PATH = r"models\xgb\nf_top_features.pkl"
XGB_MODEL_PATH = r"models\xgb\xgboost_nf_necessary.json"

# Attack classes (Order must match model output 0..N)
CLASSES = labels = ["Backdoor", "scanning", "password", "injection","mitm", "ransomware", "xss", "Benign", "dos", "ddos"]


@lru_cache(maxsize=1)
def load_artifacts():
    print("Loading XGBoost artifacts...")
    scaler = joblib.load(SCALER_PATH)
    top_features = joblib.load(TOP_FEATURES_PATH) 
    
    booster = xgb.Booster()
    booster.load_model(XGB_MODEL_PATH)
    
    return scaler, top_features, booster

def _common_preprocessing(df: pd.DataFrame, scaler, top_features) -> xgb.DMatrix:
    """
    Standard preprocessing applied to BOTH CSV and Derived data:
    1. Drop IDs/Labels if present.
    2. Impute NaNs with Median.
    3. Scale using loaded StandardScaler.
    4. Select top features.
    """
    # 1. Drop non-features if they exist (Clean-up)
    drop_cols = ['IPV4_SRC_ADDR', 'IPV4_DST_ADDR', 'Attack', 'Attack_Encoded', 'id']
    df = df.drop(columns=[c for c in drop_cols if c in df.columns])
    
    # 2. Numeric Only & Fill NA
    X_num = df.select_dtypes(include=[np.number])
    X_num = X_num.fillna(X_num.median())

    # 3. Align Columns with Scaler
    # Use scaler.feature_names_in_ if available to ensure correct column order
    if hasattr(scaler, 'feature_names_in_'):
        # Add missing columns with 0 if somehow missing (safety net)
        missing = set(scaler.feature_names_in_) - set(X_num.columns)
        for c in missing:
            X_num[c] = 0
        X_num = X_num[scaler.feature_names_in_]
    
    # 4. Scale
    X_scaled = scaler.transform(X_num)
    
    # 5. Select Necessary Features
    # The top_features list contains strings like 'f37'. We need indices.
    # Note: If your top_features list is actual names ['L4_SRC_PORT'], use direct indexing.
    # Assuming notebook format ['f37', 'f26'] where numbers correspond to column index.
    
    # Logic to parse 'f37' -> index 37
    try:
        feature_indices = [int(f.replace('f', '')) for f in top_features]
        X_final = X_scaled[:, feature_indices]
    except ValueError:
        # If top_features are names, filter by dataframe columns (needs logic adjustment)
        # For now, adhering to notebook's 'fN' format logic
        raise ValueError("Feature list must be in 'f0', 'f1' format matching scaler output")

    return xgb.DMatrix(X_final)

def _run_inference(dmat: xgb.DMatrix, booster) -> Dict[str, Any]:
    preds_proba = booster.predict(dmat)
    pred_idx = np.argmax(preds_proba, axis=1)
    max_conf = np.max(preds_proba, axis=1)
    
    return {
        "indices": pred_idx,
        "probabilities": preds_proba,
        "confidence": max_conf
    }

# ================= EXPORTED FUNCTIONS =================

def predict_from_csv(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Pipeline for CSV Upload:
    Data -> [Full 53 Features] -> Preprocess -> Predict
    (NO Derivation/Random Generation)
    """
    scaler, top_feats, booster = load_artifacts()
    
    # Direct preprocessing
    dmat = _common_preprocessing(df, scaler, top_feats)
    return _run_inference(dmat, booster)

def predict_from_json(partial_data: List[Dict]) -> Dict[str, Any]:
    """
    Pipeline for Frontend Manual Entry:
    Partial Data -> Derive.py (Calc + Random) -> [Full 53 Features] -> Preprocess -> Predict
    """
    scaler, top_feats, booster = load_artifacts()
    
    # Convert list of dicts to DF
    df_partial = pd.DataFrame(partial_data)
    
    # EXPAND: Calculate derived + generate random for missing
    df_full = derive_features(df_partial)
    
    # Standard preprocessing
    dmat = _common_preprocessing(df_full, scaler, top_feats)
    return _run_inference(dmat, booster)
