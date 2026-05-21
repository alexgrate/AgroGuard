import pandas as pd
import numpy as np
import joblib
import json
import requests
from datetime import datetime, timedelta
import os

try:
    from AgroGuard_AI.app.translation import translate_recommendation
except ModuleNotFoundError:
    from app.translation import translate_recommendation


BASE_DIR = os.path.dirname(os.path.abspath(__file__))

CROP_PARAMS = {
    'Maize': {'base_temp': 10, 'maturity_gdd': 1350},
    'Cassava': {'base_temp': 8, 'maturity_gdd': 3500},
    'Yam': {'base_temp': 12, 'maturity_gdd': 1800}
}

STATE_COORDINATES = {
    'Kaduna': (10.5222, 7.4383),
    'Benue': (7.3369, 8.7404),
    'Ogun': (7.1608, 3.3472),
    'Lagos': (6.5244, 3.3792),
    'Kano': (12.0022, 8.5920),
    'Enugu': (6.4584, 7.5464),
    'Oyo': (7.8774, 3.9470),
    'Niger': (9.9309, 5.5983),
    'Plateau': (9.2182, 9.5179),
    'Cross River': (5.9631, 8.3269)
}

GROWTH_STAGES = {
    'Just planted (Day 1-10)': 0.05,
    'Seedling (Day 10-30)': 0.15,
    'Vegetative (Day 30-60)': 0.40,
    'Flowering (Day 60-80)': 0.65,
    'Grain filling (Day 80-90)': 0.85,
    'Nearly ready (Day 90+)': 0.95
}

SOIL_RISK_MODIFIERS = {
    'Sandy':  {'drought_boost': 1.25, 'flood_boost': 0.85, 'label': 'fast-draining'},
    'Loamy':  {'drought_boost': 1.00, 'flood_boost': 1.00, 'label': 'balanced'},
    'Clay':   {'drought_boost': 0.85, 'flood_boost': 1.30, 'label': 'water-retaining'},
    'Stony':  {'drought_boost': 1.15, 'flood_boost': 1.10, 'label': 'poor-retention'},
}


#Load Model 
def load_model(
    model_path='models/rf_climate_risk_model.pkl',
    features_path='models/feature_names.json'
):
    """Load the trained Random Forest model and feature names using absolute paths.."""
    abs_model_path = os.path.join(BASE_DIR, model_path)
    abs_features_path = os.path.join(BASE_DIR, features_path)

    model = joblib.load(abs_model_path)
    with open(abs_features_path, 'r') as f:
        features = json.load(f)
    return model, features


#Calculate Days to Maturity 
def calculate_days_to_maturity(crop_type, growth_stage):
    """
    Estimate how many days remain until the crop is ready
    based on crop type and current growth stage.
    
    Returns integer — number of days remaining.
    """
    crop = CROP_PARAMS[crop_type]
    growth_pct = GROWTH_STAGES[growth_stage]
    
    estimated_gdd_accumulated = crop['maturity_gdd'] * growth_pct
    remaining_gdd = crop['maturity_gdd'] - estimated_gdd_accumulated
    
    # Average daily GDD derived from NASA POWER data
    avg_daily_gdd = 14.0
    days_remaining = max(1, int(remaining_gdd / avg_daily_gdd))
    
    return days_remaining


#Fetch Forecast Weather
def get_forecast_weather(lat, lon, api_key):
    """
    Fetch 5-day forecast from OpenWeatherMap and
    aggregate 3-hourly readings into daily summaries.
    
    Returns a DataFrame with one row per day, or None on failure.
    """
    url = "https://api.openweathermap.org/data/2.5/forecast"
    params = {
        'lat': lat,
        'lon': lon,
        'appid': api_key,
        'units': 'metric'
    }

    response = requests.get(url, params=params)
    if response.status_code != 200:
        print(f"API Error {response.status_code}: {response.json()}")
        return None

    data = response.json()
    daily_data = {}

    for item in data['list']:
        date = item['dt_txt'].split(' ')[0]
        if date not in daily_data:
            daily_data[date] = {
                'temp': [], 'temp_max': [], 'temp_min': [],
                'rainfall': [], 'humidity': [], 'wind': []
            }
        daily_data[date]['temp'].append(item['main']['temp'])
        daily_data[date]['temp_max'].append(item['main']['temp_max'])
        daily_data[date]['temp_min'].append(item['main']['temp_min'])
        daily_data[date]['humidity'].append(item['main']['humidity'])
        daily_data[date]['wind'].append(item['wind']['speed'])
        daily_data[date]['rainfall'].append(
            item.get('rain', {}).get('3h', 0)
        )

    rows = []
    for date, v in daily_data.items():
        rows.append({
            'date': pd.to_datetime(date),
            'temp_avg': np.mean(v['temp']),
            'temp_max': np.max(v['temp_max']),
            'temp_min': np.min(v['temp_min']),
            'rainfall': np.sum(v['rainfall']),
            'humidity': np.mean(v['humidity']),
            'wind_speed': np.mean(v['wind']),
            'solar_radiation': 15.0  # Default — not in free tier
        })

    forecast_df = pd.DataFrame(rows).sort_values(
        'date').reset_index(drop=True)
    return forecast_df


#Prepare Features
def prepare_features(forecast_df, features):
    """
    Engineer the same features the Random Forest was trained on
    so the model can make predictions on live forecast data.
    
    Returns a DataFrame with exactly the columns the model expects.
    """
    df = forecast_df.copy()

    # Engineered features
    df['temp_range'] = df['temp_max'] - df['temp_min']
    df['month'] = df['date'].dt.month
    df['rainfall_7day_avg'] = df['rainfall'].rolling(
        window=7, min_periods=1
    ).mean()

    # Fill any missing features with 0
    for feature in features:
        if feature not in df.columns:
            df[feature] = 0
            print(f"Warning: {feature} missing, defaulting to 0")

    return df[features]


#Forecast Climate Risk 
def forecast_climate_risk(lat, lon, api_key, rf_model, features):
    """
    Fetch forecast weather and run the Random Forest model
    to predict a climate risk score for each forecast day.
    
    Returns a DataFrame with risk labels and scores per day,
    or None if weather data is unavailable.
    """
    forecast_df = get_forecast_weather(lat, lon, api_key)

    if forecast_df is None:
        return None

    # Prepare features for model
    X_forecast = prepare_features(forecast_df, features)

    # Predict risk
    risk_predictions = rf_model.predict(X_forecast)
    risk_probabilities = rf_model.predict_proba(X_forecast)

    # Attach predictions to forecast dataframe
    forecast_df['risk_label'] = risk_predictions
    forecast_df['risk_score'] = (
        risk_probabilities[:, 2] * 100
    ).round(1)
    forecast_df['risk_category'] = forecast_df['risk_label'].map({
        0: 'Low Risk',
        1: 'Moderate Risk',
        2: 'High Risk'
    })

    return forecast_df


#Get Harvest Recommendation 
def get_harvest_recommendation(days_remaining, risk_forecast_df):
    """
    Overlay the maturity date on the climate risk forecast
    to find the optimal harvest window.
    
    Returns a tuple: (window_start, window_end)
    Both are None if no low-risk window exists after maturity.
    """
    if risk_forecast_df is None:
        return None, None

    window_start = None
    window_end = None

    for idx, row in risk_forecast_df.iterrows():
        day = idx + 1

        if day >= days_remaining and row['risk_label'] == 0:
            if window_start is None:
                window_start = day
            window_end = day

        elif window_start is not None:
            break  # First window found — stop here

    return window_start, window_end


#Generate Alerts
def generate_alerts(risk_forecast_df, language, soil_type='Loamy'):
    """
    Scan the forecast for climate hazards and return
    a list of translated alert messages.
    Soil type adjusts rainfall thresholds — sandy soil triggers
    drought alerts sooner, clay soil triggers flood alerts sooner.
    """
    alerts = []
    max_temp = risk_forecast_df['temp_max'].max()
    total_rain = risk_forecast_df['rainfall'].sum()

    soil = SOIL_RISK_MODIFIERS.get(soil_type, SOIL_RISK_MODIFIERS['Loamy'])

    # Soil-adjusted thresholds
    drought_threshold = 5 / soil['drought_boost']   # Sandy → triggers at ~4mm
    flood_threshold   = 80 / soil['flood_boost']     # Clay  → triggers at ~62mm

    if max_temp > 36:
        alerts.append(translate_recommendation(
            'heat_alert', language, temp=round(max_temp, 1)
        ))
    if total_rain < drought_threshold:
        alerts.append(translate_recommendation(
            'drought_alert', language
        ))
    elif total_rain > flood_threshold:
        alerts.append(translate_recommendation(
            'flood_alert', language
        ))
    if not alerts:
        alerts.append(translate_recommendation(
            'no_alerts', language
        ))

    return alerts


#Main Function
def run_agroguard(crop_type, state, growth_stage, language, api_key, soil_type='Loamy'):
    """
    MAIN FUNCTION — this is what teammates call from the frontend.

    Parameters:
    - crop_type:    'Maize', 'Cassava', or 'Yam'
    - state:        any key from STATE_COORDINATES
    - growth_stage: any key from GROWTH_STAGES
    - language:     'english', 'pidgin', 'hausa', 'yoruba', 'igbo'
    - api_key:      OpenWeatherMap API key
    - soil_type:    'Sandy', 'Loamy', 'Clay', or 'Stony'

    Returns a dictionary with everything the frontend needs.
    """

    # Load model
    rf_model, features = load_model()

    # Step 2 — Days to maturity
    days_remaining = calculate_days_to_maturity(crop_type, growth_stage)

    # Step 3, 4, 5 — Fetch weather and predict risk
    lat, lon = STATE_COORDINATES[state]
    risk_df = forecast_climate_risk(lat, lon, api_key, rf_model, features)

    if risk_df is None:
        return {'error': 'Unable to fetch weather data. Please try again.'}

    # Step 5b — Adjust risk scores based on soil type
    soil = SOIL_RISK_MODIFIERS.get(soil_type, SOIL_RISK_MODIFIERS['Loamy'])
    total_rain = risk_df['rainfall'].sum()
    if total_rain < 10:
        risk_df['risk_score'] = (risk_df['risk_score'] * soil['drought_boost']).clip(0, 100).round(1)
    elif total_rain > 50:
        risk_df['risk_score'] = (risk_df['risk_score'] * soil['flood_boost']).clip(0, 100).round(1)

    # Recalculate risk category after soil adjustment
    risk_df['risk_category'] = risk_df['risk_score'].apply(
        lambda s: 'High Risk' if s >= 60 else ('Moderate Risk' if s >= 30 else 'Low Risk')
    )
    risk_df['risk_label'] = risk_df['risk_category'].map({
        'Low Risk': 0, 'Moderate Risk': 1, 'High Risk': 2
    })

    # Step 6 — Find harvest window
    window_start, window_end = get_harvest_recommendation(
        days_remaining, risk_df
    )

    # Step 7 — Determine message type and translate
    if window_start and window_end:
        message_type = 'harvest_window'
        message = translate_recommendation(
            message_type, language,
            crop=crop_type,
            days=days_remaining,
            start=window_start,
            end=window_end
        )
    elif days_remaining > len(risk_df):
        message_type = 'not_ready'
        message = translate_recommendation(
            message_type, language,
            crop=crop_type,
            days=days_remaining
        )
    else:
        message_type = 'high_risk'
        message = translate_recommendation(
            message_type, language,
            crop=crop_type,
            days=days_remaining
        )

    # Step 7 — Generate alerts
    alerts = generate_alerts(risk_df, language, soil_type)

    short_forecast = ""
    
    for i in range(min(3, len(risk_df))):
        day_data = risk_df.iloc[i]
        date_str = day_data['date'].strftime('%a')
        temp = round(day_data['temp_max'])
        rain = "Rain" if day_data['rainfall'] > 2 else "Dry"
        short_forecast += f"{date_str}: {temp}C/{rain}. "

    # Step 8 — Return clean dictionary to frontend
    return {
        'crop': crop_type,
        'state': state,
        'soil_type': soil_type,
        'risk_category': str(risk_df['risk_category'].iloc[0]),
        'risk_score': float(risk_df['risk_score'].iloc[0]),
        'days_to_maturity': days_remaining,
        'maturity_date': (
            datetime.now() + timedelta(days=days_remaining)
        ).strftime('%B %d, %Y'),
        'harvest_window': {
            'start': window_start,
            'end': window_end
        },
        'message': message,
        'message_type': message_type,
        'alerts': alerts,
        'forecast': risk_df[[
            'date', 'temp_max', 'temp_min',
            'rainfall', 'humidity',
            'risk_category', 'risk_score'
        ]].to_dict(orient='records'),
        'language': language,
        'short_forecast' : short_forecast.strip(),
        'check_back_days': 3
    }