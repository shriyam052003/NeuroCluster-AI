import numpy as np
from sklearn.cluster import KMeans, DBSCAN
from sklearn.decomposition import PCA
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import silhouette_score
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from collections import Counter
from typing import List, Dict, Any

analyzer = SentimentIntensityAnalyzer()

# Global state for Sandbox
sandbox_state = {
    "pca": None,
    "centroids": None,
    "labels": None
}

# Simple heuristics for emotion based on keywords for demonstration
EMOTION_KEYWORDS = {
    "Analytical": ["think", "analyze", "data", "logic", "reason", "system", "plan", "structure", "why", "how", "theory", "science"],
    "Emotional": ["feel", "love", "hate", "sad", "happy", "cry", "hurt", "heart", "care", "emotion", "upset", "sorry"],
    "Social": ["we", "together", "friends", "party", "connect", "team", "chat", "meet", "community", "group", "share", "talk"],
    "Aggressive": ["angry", "stupid", "idiot", "fight", "stop", "mad", "worst", "terrible", "argue", "hell", "damn", "shut"]
}

def guess_emotion(text: str) -> str:
    text_lower = text.lower()
    scores = {k: 0 for k in EMOTION_KEYWORDS.keys()}
    for emotion, keywords in EMOTION_KEYWORDS.items():
        for kw in keywords:
            if kw in text_lower:
                scores[emotion] += 1
    max_emotion = max(scores, key=scores.get)
    return max_emotion if scores[max_emotion] > 0 else "Neutral"

def get_cluster_keywords(texts: List[str], top_n=5):
    if not texts: return []
    try:
        vectorizer = TfidfVectorizer(stop_words='english', max_features=100)
        vectorizer.fit_transform(texts)
        indices = np.argsort(vectorizer.idf_)[::-1]
        features = vectorizer.get_feature_names_out()
        return [features[i] for i in indices[:min(top_n, len(features))]]
    except ValueError:
        return []

def map_to_big_five(dominant_emotion: str, keywords: List[str]) -> Dict[str, float]:
    base = {"O": 50, "C": 50, "E": 50, "A": 50, "N": 50}
    if dominant_emotion == "Analytical":
        base["C"] += 20; base["O"] += 10; base["N"] -= 10
    elif dominant_emotion == "Emotional":
        base["N"] += 30; base["A"] += 10
    elif dominant_emotion == "Social":
        base["E"] += 30; base["A"] += 20; base["O"] += 10
    elif dominant_emotion == "Aggressive":
        base["N"] += 20; base["A"] -= 30; base["E"] += 10
        
    for kw in keywords:
        if kw in ["data", "system", "logic"]: base["C"] += 5
        if kw in ["friends", "party"]: base["E"] += 5
        if kw in ["hate", "stupid"]: base["A"] -= 5; base["N"] += 5
    
    return {k: max(0, min(100, v)) for k, v in base.items()}

def perform_clustering(texts: List[str], embeddings: np.ndarray, algorithm: str, num_clusters: int, n_components: int) -> Dict[str, Any]:
    if algorithm.lower() == "kmeans":
        model = KMeans(n_clusters=num_clusters, random_state=42, n_init=10)
        labels = model.fit_predict(embeddings)
        centroids = model.cluster_centers_
    elif algorithm.lower() == "dbscan":
        model = DBSCAN(eps=0.5, min_samples=2)
        labels = model.fit_predict(embeddings)
        max_label = max(labels) if len(labels) > 0 else -1
        if max_label >= 0:
            centroids = np.zeros((max_label + 1, embeddings.shape[1]))
            for lbl in range(max_label + 1):
                mask = (labels == lbl)
                if np.any(mask):
                    centroids[lbl] = embeddings[mask].mean(axis=0)
        else:
            centroids = None
    else:
        raise ValueError(f"Unknown algorithm: {algorithm}")
        
    # Calculate Silhouette Score
    sil_score = None
    if len(set(labels)) > 1 and len(set(labels)) < len(texts):
        # Silhouette score requires at least 2 clusters and not all points as individual clusters
        valid_mask = labels != -1
        if sum(valid_mask) > 1 and len(set(labels[valid_mask])) > 1:
            sil_score = silhouette_score(embeddings[valid_mask], labels[valid_mask])
        
    if len(texts) < 5:
        reduced_coords = np.zeros((len(texts), n_components)).tolist()
        sandbox_state["pca"] = None
    else:
        pca = PCA(n_components=n_components)
        reduced_coords = pca.fit_transform(embeddings).tolist()
        sandbox_state["pca"] = pca

    sandbox_state["centroids"] = centroids
    sandbox_state["labels"] = list(set(labels))

    clusters_info = {}
    dataset_emotions = [guess_emotion(t) for t in texts]
    emotion_counts = dict(Counter(dataset_emotions))
    points = []
    
    # Calculate distances to find Mavericks (Outliers)
    distances = np.zeros(len(texts))
    if centroids is not None:
        for i, label in enumerate(labels):
            distances[i] = np.linalg.norm(embeddings[i] - centroids[label])
    
    threshold = np.percentile(distances, 90) if centroids is not None and len(distances) > 0 else float('inf')
    
    for i, (text, label, coord, emotion) in enumerate(zip(texts, labels, reduced_coords, dataset_emotions)):
        label = int(label)
        if label not in clusters_info:
            clusters_info[label] = {
                "id": label,
                "name": f"Cluster {label}" if label != -1 else "Noise (Outliers)",
                "texts": [],
                "size": 0,
                "emotions": Counter(),
                "sentiment_scores": {"compound": 0.0, "pos": 0.0, "neu": 0.0, "neg": 0.0}
            }
            
        clusters_info[label]["texts"].append(text)
        clusters_info[label]["size"] += 1
        clusters_info[label]["emotions"][emotion] += 1
        
        # Vader Sentiment
        vs = analyzer.polarity_scores(text)
        for k in ["compound", "pos", "neu", "neg"]:
            clusters_info[label]["sentiment_scores"][k] += vs[k]
        
        is_maverick = bool((centroids is not None and distances[i] > threshold) or label == -1)
        
        points.append({
            "id": i,
            "text": text[:100] + "..." if len(text) > 100 else text,
            "full_text": text,
            "cluster": label,
            "coords": coord,
            "emotion": emotion,
            "is_maverick": is_maverick,
            "sentiment": vs["compound"]
        })
        
    # Relationship Graph: Calculate distance between centroids
    relationships = []
    if centroids is not None and len(centroids) > 1:
        for i in range(len(centroids)):
            for j in range(i + 1, len(centroids)):
                dist = np.linalg.norm(centroids[i] - centroids[j])
                relationships.append({
                    "source": i,
                    "target": j,
                    "distance": float(dist)
                })
        
    for label, info in clusters_info.items():
        info["keywords"] = get_cluster_keywords(info["texts"])
        info["dominant_emotion"] = info["emotions"].most_common(1)[0][0] if info["emotions"] else "Neutral"
        info["personality_profile"] = info["dominant_emotion"]
        info["big_five"] = map_to_big_five(info["dominant_emotion"], info["keywords"])
        
        # Average sentiment
        n = info["size"]
        info["sentiment_scores"] = {k: v/n for k, v in info["sentiment_scores"].items()}
        
        info["emotions"] = dict(info["emotions"])
        del info["texts"]

    # Also return the centroids if available so frontend can do real-time mapping
    centroids_out = centroids.tolist() if centroids is not None else []

    return {
        "points": points,
        "clusters": list(clusters_info.values()),
        "emotion_distribution": emotion_counts,
        "algorithm": algorithm,
        "silhouette_score": float(sil_score) if sil_score is not None else None,
        "relationships": relationships,
        "centroids": centroids_out
    }

def predict_sandbox(text: str, embedding: np.ndarray) -> Dict[str, Any]:
    if sandbox_state["pca"] is None:
        return {"error": "Must run clustering first with at least 5 texts."}
    
    # 1. Project to 3D
    coord = sandbox_state["pca"].transform([embedding])[0].tolist()
    
    # 2. Find closest centroid
    if sandbox_state["centroids"] is not None and len(sandbox_state["centroids"]) > 0:
        distances = [np.linalg.norm(embedding - c) for c in sandbox_state["centroids"]]
        closest_idx = int(np.argmin(distances))
    else:
        closest_idx = -1
    
    # 3. Sentiment
    vs = analyzer.polarity_scores(text)
    
    return {
        "text": text,
        "cluster": closest_idx,
        "coords": coord,
        "sentiment": vs["compound"]
    }
