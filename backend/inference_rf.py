import os
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any, List
from functools import lru_cache
from derive import derive_features

SCALER_PATH = r"models\nf_scaler.pkl"
RF_TOP_FEATURES_PATH = r"models\rf\rf_top_features.pkl"
RF_MODEL_PATH = r"models\rf\random_forest_nf_necessary.joblib"


@lru_cache(maxsize=1)
def load_rf_artifacts():
    try:
        scaler = joblib.load(SCALER_PATH)
        
        if os.path.exists(RF_TOP_FEATURES_PATH):
            top_features = joblib.load(RF_TOP_FEATURES_PATH)
        else:
            top_features = joblib.load("nf_top_features.pkl")
            
        model = joblib.load(RF_MODEL_PATH)
        return scaler, top_features, model
        
    except FileNotFoundError as e:
        raise FileNotFoundError(f"Missing RF artifact: {e}")

def _preprocess_rf(df: pd.DataFrame, scaler, top_features) -> np.ndarray:
    if hasattr(scaler, 'feature_names_in_'):
        scaler_features = scaler.feature_names_in_
        
        missing_cols = [c for c in scaler_features if c not in df.columns]
        if missing_cols:
            df_missing = pd.DataFrame(0, index=df.index, columns=missing_cols)
            df = pd.concat([df, df_missing], axis=1)
            
        X_aligned = df[scaler_features].copy()
        X_aligned = X_aligned.fillna(0)
    else:
        X_aligned = df.select_dtypes(include=[np.number]).fillna(0)

    X_scaled_array = scaler.transform(X_aligned)
    X_scaled_df = pd.DataFrame(X_scaled_array, columns=scaler.feature_names_in_)

    missing_top = [f for f in top_features if f not in X_scaled_df.columns]
    if missing_top:
        for f in missing_top:
            X_scaled_df[f] = 0.0
            
    X_final = X_scaled_df[top_features].values
    
    return X_final

def predict_rf_from_json(partial_data: List[Dict]) -> Dict[str, Any]:
    scaler, top_feats, model = load_rf_artifacts()
    
    df_partial = pd.DataFrame(partial_data)
    df_full = derive_features(df_partial)

    X_ready = _preprocess_rf(df_full, scaler, top_feats)

    preds_proba = model.predict_proba(X_ready)
    pred_idx = np.argmax(preds_proba, axis=1)
    max_conf = np.max(preds_proba, axis=1)

    return {
        "indices": pred_idx,
        "probabilities": preds_proba,
        "confidence": max_conf,
    }


def predict_from_csv(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Pipeline for CSV uploads that already contain the full NetFlow feature set.
    """
    scaler, top_feats, model = load_rf_artifacts()

    X_ready = _preprocess_rf(df, scaler, top_feats)

    preds_proba = model.predict_proba(X_ready)
    pred_idx = np.argmax(preds_proba, axis=1)
    max_conf = np.max(preds_proba, axis=1)

    return {
        "indices": pred_idx,
        "probabilities": preds_proba,
        "confidence": max_conf,
    }
