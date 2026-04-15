from fastapi import APIRouter, HTTPException
from app.services.ml_service import ml_service

router = APIRouter(prefix="/api/ml", tags=["machine-learning"])

@router.post("/train")
async def train_model(retrain: bool = False):
    """Train or retrain the ML model"""
    try:
        result = ml_service.train_model(retrain=retrain)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error training model: {str(e)}")

@router.get("/model-info")
async def get_model_info():
    """Get information about the current ML model"""
    try:
        return ml_service.get_model_info()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting model info: {str(e)}")

@router.get("/feature-importance")
async def get_feature_importance():
    """Get feature importance from the trained model"""
    try:
        if ml_service.model is None:
            raise HTTPException(status_code=404, detail="No model trained")
        
        feature_importance = dict(zip(
            ml_service.feature_columns, 
            ml_service.model.feature_importances_
        ))
        
        # Sort by importance
        sorted_features = sorted(
            feature_importance.items(), 
            key=lambda x: x[1], 
            reverse=True
        )
        
        return {
            "feature_importance": dict(sorted_features),
            "top_features": sorted_features[:5]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting feature importance: {str(e)}")