import joblib
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
from typing import Dict, Tuple
import os
from app.models.student import StudentBase, PredictionResponse
from app.config import settings

class MLService:
    def __init__(self):
        self.model = None
        self.scaler = None
        self.label_encoders = {}
        self.feature_columns = [
            'age', 'current_gpa', 'previous_gpa', 'attendance_rate', 
            'failed_subjects', 'participation_activities', 'distance_from_home',
            'study_hours_per_week', 'gender_encoded', 'parent_education_encoded',
            'family_income_encoded', 'financial_aid_encoded', 'part_time_job_encoded',
            'health_issues_encoded'
        ]
        self.load_model()

    def encode_categorical_features(self, df: pd.DataFrame, fit: bool = False) -> pd.DataFrame:
        """Encode categorical features"""
        categorical_mappings = {
            'gender': {
                'Male': 0, 'Female': 1, 'Other': 2,
                'male': 0, 'female': 1, 'other': 2
            },
            'parent_education_level': {
                'No Education': 0, 'Primary': 1, 'Secondary': 2, 
                'High School': 3, 'Bachelor': 4, 'Master': 5, 'PhD': 6,
                'Graduate': 4, 'Post-Graduate': 5, 'Below 10th': 1,
                '10th': 2, '12th': 3
            },
            'family_income_level': {
                'Low': 0, 'Lower-Middle': 1, 'Middle': 2, 
                'Upper-Middle': 3, 'High': 4,
                'Below 2L': 0, '2-5L': 1, '5-10L': 2, 'Above 10L': 4
            }
        }
        
        # Mapping from input column to model's encoded column name
        column_to_target = {
            'gender': 'gender_encoded',
            'parent_education_level': 'parent_education_encoded',
            'family_income_level': 'family_income_encoded'
        }
        
        # Encode categorical variables with fallback to 0
        for col, mapping in categorical_mappings.items():
            target_col = column_to_target.get(col, f'{col}_encoded')
            if col in df.columns:
                df[target_col] = df[col].map(mapping).fillna(0).astype(int)
            else:
                df[target_col] = 0
        
        # Encode boolean variables with fallback to 0
        bool_cols = {
            'financial_aid': 'financial_aid_encoded',
            'part_time_job': 'part_time_job_encoded',
            'health_issues': 'health_issues_encoded'
        }
        
        for col, target in bool_cols.items():
            if col in df.columns:
                df[target] = df[col].apply(lambda x: 1 if x is True or x == 1 or str(x).lower() == 'true' else 0)
            else:
                df[target] = 0
        
        return df

    def prepare_features(self, student_data: StudentBase) -> pd.DataFrame:
        """Prepare features for prediction"""
        # Convert student data to dictionary
        data_dict = student_data.dict()
        
        # Create DataFrame
        df = pd.DataFrame([data_dict])
        
        # Encode categorical features
        df = self.encode_categorical_features(df)
        
        # Select only the features used in training and ensure no NaNs
        df_features = df[self.feature_columns].fillna(0)
        
        return df_features

    def generate_sample_data(self, n_samples: int = 1000) -> pd.DataFrame:
        """Generate sample student data for training"""
        np.random.seed(42)
        
        data = []
        for i in range(n_samples):
            # Generate correlated features that make sense for dropout prediction
            base_risk = np.random.random()
            
            student = {
                'student_id': f'STU{i+1:04d}',
                'name': f'Student {i+1}',
                'age': np.random.randint(18, 25),
                'gender': np.random.choice(['Male', 'Female'], p=[0.5, 0.5]),
                'current_gpa': max(0.0, min(4.0, np.random.normal(2.5 + (1-base_risk)*1.5, 0.5))),
                'previous_gpa': max(0.0, min(4.0, np.random.normal(2.5 + (1-base_risk)*1.5, 0.5))),
                'attendance_rate': max(0, min(100, np.random.normal(75 + (1-base_risk)*20, 15))),
                'failed_subjects': max(0, int(np.random.poisson(base_risk * 3))),
                'participation_activities': max(0, min(10, int(np.random.normal(5 + (1-base_risk)*3, 2)))),
                'parent_education_level': np.random.choice([
                    'No Education', 'Primary', 'Secondary', 'High School', 
                    'Bachelor', 'Master', 'PhD'
                ], p=[0.05, 0.1, 0.15, 0.25, 0.25, 0.15, 0.05]),
                'financial_aid': np.random.choice([True, False], p=[0.4, 0.6]),
                'family_income_level': np.random.choice([
                    'Low', 'Lower-Middle', 'Middle', 'Upper-Middle', 'High'
                ], p=[0.2, 0.25, 0.3, 0.15, 0.1]),
                'distance_from_home': max(0, np.random.exponential(20)),
                'study_hours_per_week': max(0, np.random.normal(15 + (1-base_risk)*10, 5)),
                'part_time_job': np.random.choice([True, False], p=[0.3, 0.7]),
                'health_issues': np.random.choice([True, False], p=[0.1, 0.9]),
            }
            
            # Calculate dropout probability based on risk factors
            risk_factors = 0
            if student['current_gpa'] < 2.0:
                risk_factors += 0.3
            if student['attendance_rate'] < 70:
                risk_factors += 0.25
            if student['failed_subjects'] > 2:
                risk_factors += 0.2
            if student['participation_activities'] < 3:
                risk_factors += 0.1
            if student['family_income_level'] in ['Low', 'Lower-Middle']:
                risk_factors += 0.1
            if student['part_time_job']:
                risk_factors += 0.05
            
            dropout_prob = min(0.9, base_risk * 0.5 + risk_factors)
            student['dropout'] = 1 if dropout_prob > 0.5 else 0
            
            data.append(student)
        
        return pd.DataFrame(data)

    def train_model(self, retrain: bool = False) -> Dict:
        """Train the dropout prediction model"""
        if not retrain and self.model is not None:
            return {"message": "Model already trained"}
        
        # Generate sample data
        df = self.generate_sample_data(1000)
        
        # Encode categorical features
        df = self.encode_categorical_features(df, fit=True)
        
        # Prepare features and target
        X = df[self.feature_columns]
        y = df['dropout']
        
        # Split the data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        # Scale features
        self.scaler = StandardScaler()
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Train Random Forest model
        self.model = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42
        )
        
        self.model.fit(X_train_scaled, y_train)
        
        # Evaluate model
        y_pred = self.model.predict(X_test_scaled)
        accuracy = accuracy_score(y_test, y_pred)
        
        # Save model and scaler
        self.save_model()
        
        return {
            "message": "Model trained successfully",
            "accuracy": accuracy,
            "feature_importance": dict(zip(self.feature_columns, self.model.feature_importances_))
        }

    def predict_dropout(self, student_data: StudentBase) -> PredictionResponse:
        """Predict dropout probability for a student"""
        if self.model is None or self.scaler is None:
            self.train_model()
        
        # Prepare features
        df_features = self.prepare_features(student_data)
        
        # Scale features
        X_scaled = self.scaler.transform(df_features)
        
        # Make prediction
        dropout_prob = self.model.predict_proba(X_scaled)[0][1]  # Probability of dropout (class 1)
        confidence = max(dropout_prob, 1 - dropout_prob)
        
        # Determine risk level
        if dropout_prob < 0.3:
            risk_level = "Low"
        elif dropout_prob < 0.7:
            risk_level = "Medium"
        else:
            risk_level = "High"
        
        # Get feature importance for this prediction
        feature_importance = dict(zip(self.feature_columns, self.model.feature_importances_))
        
        # Calculate contributing factors
        factors = self._calculate_risk_factors(student_data, feature_importance)
        
        return PredictionResponse(
            student_id=student_data.student_id,
            dropout_probability=round(dropout_prob, 3),
            risk_level=risk_level,
            confidence=round(confidence, 3),
            factors=factors
        )

    def _calculate_risk_factors(self, student_data: StudentBase, feature_importance: Dict) -> Dict:
        """Calculate which factors contribute most to dropout risk"""
        factors = {}
        
        # Academic factors
        if student_data.current_gpa < 2.5:
            factors["Low GPA"] = f"Current GPA ({student_data.current_gpa}) is below average"
        
        if student_data.attendance_rate < 80:
            factors["Poor Attendance"] = f"Attendance rate ({student_data.attendance_rate}%) is concerning"
        
        if student_data.failed_subjects > 1:
            factors["Failed Subjects"] = f"Has failed {student_data.failed_subjects} subjects"
        
        if student_data.participation_activities < 3:
            factors["Low Participation"] = "Limited participation in activities"
        
        # Socio-economic factors
        if student_data.family_income_level in ["Low", "Lower-Middle"]:
            factors["Financial Stress"] = f"Family income level: {student_data.family_income_level}"
        
        if student_data.part_time_job:
            factors["Work-Study Balance"] = "Has part-time job which may affect studies"
        
        if student_data.distance_from_home > 50:
            factors["Distance"] = f"Lives far from campus ({student_data.distance_from_home:.1f} km)"
        
        return factors

    def save_model(self):
        """Save the trained model and scaler"""
        os.makedirs("ml_model", exist_ok=True)
        
        if self.model:
            joblib.dump(self.model, "ml_model/dropout_model.joblib")
        
        if self.scaler:
            joblib.dump(self.scaler, "ml_model/scaler.joblib")

    def load_model(self):
        """Load the trained model and scaler"""
        try:
            if os.path.exists("ml_model/dropout_model.joblib"):
                self.model = joblib.load("ml_model/dropout_model.joblib")
            
            if os.path.exists("ml_model/scaler.joblib"):
                self.scaler = joblib.load("ml_model/scaler.joblib")
                
        except Exception as e:
            print(f"Could not load model: {e}")
            self.model = None
            self.scaler = None

    def get_model_info(self) -> Dict:
        """Get information about the current model"""
        if self.model is None:
            return {"status": "No model trained"}
        
        return {
            "status": "Model loaded",
            "model_type": "Random Forest Classifier",
            "features": self.feature_columns,
            "feature_count": len(self.feature_columns)
        }

ml_service = MLService()