import os
import joblib
import numpy as np
import logging
from sklearn.ensemble import IsolationForest
from app.config import settings

logger = logging.getLogger(__name__)

class AnomalyDetector:
    def __init__(self):
        self.model = None
        self.model_path = "/data/isolation_forest_model.joblib"
        self.contamination = settings.IF_CONTAMINATION
        self.n_estimators = settings.IF_N_ESTIMATORS
        self.is_initialized = False

    def initialize(self):
        os.makedirs("/data", exist_ok=True)
        if os.path.exists(self.model_path):
            try:
                self.model = joblib.load(self.model_path)
                self.is_initialized = True
                logger.info("Loaded existing Isolation Forest model.")
                return
            except Exception as e:
                logger.error(f"Failed to load model: {e}")
        self.train_baseline()

    def train_baseline(self):
        logger.info("Training new Isolation Forest baseline model...")
        np.random.seed(42)
        n = 2000
        cpu     = np.random.uniform(20.0, 60.0, n)
        ram     = np.random.uniform(30.0, 65.0, n)
        latency = np.random.uniform(50.0, 200.0, n)
        level   = np.random.choice([0, 1], size=n, p=[0.95, 0.05])
        X_train = np.column_stack((cpu, ram, latency, level))
        self.model = IsolationForest(
            n_estimators=self.n_estimators,
            contamination=self.contamination,
            random_state=42
        )
        self.model.fit(X_train)
        joblib.dump(self.model, self.model_path)
        self.is_initialized = True
        logger.info("Isolation Forest trained and saved.")

    def score(self, features):
        if not self.is_initialized or self.model is None:
            return 0.5, 1
        X = np.array(features).reshape(1, -1)
        prediction = self.model.predict(X)[0]
        raw_score  = self.model.decision_function(X)[0]
        normalized = max(-1.0, min(1.0, raw_score * 2.0))
        return normalized, int(prediction)

anomaly_detector = AnomalyDetector()
