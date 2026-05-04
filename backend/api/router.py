from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from services.nlp_service import generate_embeddings
from services.ml_service import perform_clustering, predict_sandbox

router = APIRouter()

class ClusterRequest(BaseModel):
    texts: List[str]
    algorithm: str = "kmeans"  # kmeans or dbscan
    num_clusters: Optional[int] = 4
    n_components: int = 3 # 2 or 3 for PCA/t-SNE

class PredictRequest(BaseModel):
    text: str

@router.get("/health")
def health_check():
    return {"status": "healthy"}

@router.post("/cluster")
def cluster_texts(req: ClusterRequest):
    if len(req.texts) < 5:
        raise HTTPException(status_code=400, detail="Need at least 5 texts to perform clustering.")
    
    try:
        # 1. Generate embeddings
        embeddings = generate_embeddings(req.texts)
        
        # 2. Perform clustering and dimensionality reduction
        results = perform_clustering(
            texts=req.texts,
            embeddings=embeddings,
            algorithm=req.algorithm,
            num_clusters=req.num_clusters,
            n_components=req.n_components
        )
        
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/predict")
def predict_text(req: PredictRequest):
    try:
        embedding = generate_embeddings([req.text])[0]
        res = predict_sandbox(req.text, embedding)
        if "error" in res:
            raise HTTPException(status_code=400, detail=res["error"])
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
