import pandas as pd
import numpy as np
import random
from typing import List

# ==============================================================================
# CONFIGURATION: Expected Features & Random Ranges
# ==============================================================================

# Full list of model features expected by the scaler/models.
# This must stay in sync with the NetFlow feature schema used by the backend
# and with the training notebooks.
ALL_MODEL_FEATURES = [
    "FLOW_START_MILLISECONDS",
    "FLOW_END_MILLISECONDS",
    "IPV4_SRC_ADDR",
    "L4_SRC_PORT",
    "IPV4_DST_ADDR",
    "L4_DST_PORT",
    "PROTOCOL",
    "L7_PROTO",
    "IN_BYTES",
    "IN_PKTS",
    "OUT_BYTES",
    "OUT_PKTS",
    "TCP_FLAGS",
    "CLIENT_TCP_FLAGS",
    "SERVER_TCP_FLAGS",
    "FLOW_DURATION_MILLISECONDS",
    "DURATION_IN",
    "DURATION_OUT",
    "MIN_TTL",
    "MAX_TTL",
    "LONGEST_FLOW_PKT",
    "SHORTEST_FLOW_PKT",
    "MIN_IP_PKT_LEN",
    "MAX_IP_PKT_LEN",
    "SRC_TO_DST_SECOND_BYTES",
    "DST_TO_SRC_SECOND_BYTES",
    "RETRANSMITTED_IN_BYTES",
    "RETRANSMITTED_IN_PKTS",
    "RETRANSMITTED_OUT_BYTES",
    "RETRANSMITTED_OUT_PKTS",
    "SRC_TO_DST_AVG_THROUGHPUT",
    "DST_TO_SRC_AVG_THROUGHPUT",
    "NUM_PKTS_UP_TO_128_BYTES",
    "NUM_PKTS_128_TO_256_BYTES",
    "NUM_PKTS_256_TO_512_BYTES",
    "NUM_PKTS_512_TO_1024_BYTES",
    "NUM_PKTS_1024_TO_1514_BYTES",
    "TCP_WIN_MAX_IN",
    "TCP_WIN_MAX_OUT",
    "ICMP_TYPE",
    "ICMP_IPV4_TYPE",
    "DNS_QUERY_ID",
    "DNS_QUERY_TYPE",
    "DNS_TTL_ANSWER",
    "FTP_COMMAND_RET_CODE",
    "SRC_TO_DST_IAT_MIN",
    "SRC_TO_DST_IAT_MAX",
    "SRC_TO_DST_IAT_AVG",
    "SRC_TO_DST_IAT_STDDEV",
    "DST_TO_SRC_IAT_MIN",
    "DST_TO_SRC_IAT_MAX",
    "DST_TO_SRC_IAT_AVG",
    "DST_TO_SRC_IAT_STDDEV",
]

# Define ranges for random fallback generation (Min, Max, IsInteger)
# "Related to that field" means using these constraints.
FEATURE_RANGES = {
    "L4_SRC_PORT": (0, 65535, True),
    "L4_DST_PORT": (0, 65535, True),
    "PROTOCOL": (0, 255, True),
    "L7_PROTO": (0, 250, True),  # Approx range for L7 protocol IDs
    "IN_BYTES": (40, 10000000, True),
    "IN_PKTS": (1, 50000, True),
    "OUT_BYTES": (40, 10000000, True),
    "OUT_PKTS": (1, 50000, True),
    "TCP_FLAGS": (0, 255, True),
    "FLOW_DURATION_MILLISECONDS": (0, 60000, True),
    "MIN_TTL": (1, 255, True),
    "MAX_TTL": (1, 255, True),
    # Default fallback for unknown columns
    "__DEFAULT__": (0, 100, False) 
}

def _get_random_value(col_name: str, n=1):
    """Generates n random values based on the column name's expected range."""
    r_min, r_max, is_int = FEATURE_RANGES.get(col_name, FEATURE_RANGES["__DEFAULT__"])
    
    if is_int:
        return np.random.randint(r_min, r_max + 1, size=n)
    else:
        return np.random.uniform(r_min, r_max, size=n)

def derive_features(partial_df: pd.DataFrame) -> pd.DataFrame:
    """
    1. Takes partial input (e.g. 5-10 columns from User).
    2. Calculates derived stats (rates/ratios) where possible.
    3. Fills ALL remaining 53 features with plausible random values.
    """
    df = partial_df.copy()
    n_rows = len(df)

    # --- A. Deterministic Derivations (Calculate what we can) ---
    # Example: If we have Bytes and Packets, calculate Bytes/Pkt
    if "IN_BYTES" in df.columns and "IN_PKTS" in df.columns:
        df["MIN_IP_PKT_LEN"] = df["IN_BYTES"] / df["IN_PKTS"].replace(0, 1)
        # Assuming avg packet length is a proxy for min/max in absence of real data
        df["MAX_IP_PKT_LEN"] = df["MIN_IP_PKT_LEN"] * 1.5 
    
    # Example: Throughput
    if "IN_BYTES" in df.columns and "FLOW_DURATION_MILLISECONDS" in df.columns:
        duration_sec = df["FLOW_DURATION_MILLISECONDS"] / 1000.0
        df["SRC_TO_DST_AVG_THROUGHPUT"] = (df["IN_BYTES"] * 8) / duration_sec.replace(0, 1)

    # --- B. Random Fallback for Missing Features ---
    # We ensure the dataframe has exactly the columns expected by the model
    missing_cols = [c for c in ALL_MODEL_FEATURES if c not in df.columns]
    
    if missing_cols:
        # Generate random data for all missing columns at once
        random_data = {
            col: _get_random_value(col, n=n_rows) 
            for col in missing_cols
        }
        random_df = pd.DataFrame(random_data, index=df.index)
        df = pd.concat([df, random_df], axis=1)

    # Return only the expected columns in the correct order
    # (Use intersect to be safe, but ideally ALL_MODEL_FEATURES matches exactly)
    final_cols = [c for c in ALL_MODEL_FEATURES if c in df.columns]
    return df[final_cols]
