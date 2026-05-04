from sentence_transformers import SentenceTransformer
import numpy as np
from typing import List

# Initialize the model lazily or at startup
# Using a lightweight model for fast CPU inference
model_name = 'all-MiniLM-L6-v2'
model = None

def get_model():
    global model
    if model is None:
        model = SentenceTransformer(model_name)
    return model

def generate_embeddings(texts: List[str]) -> np.ndarray:
    m = get_model()
    embeddings = m.encode(texts, show_progress_bar=False)
    return embeddings
