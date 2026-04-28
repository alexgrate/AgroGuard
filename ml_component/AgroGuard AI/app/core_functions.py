import numpy as np
import requests 
import pandas as pd
#weather fetcher function 
def get_forecast_weather(lat, lon, api_key):
    """
    fetches a 5 day weather forecast for the given location using OpenWeatherMap API
    Returns a clean dataframe with one row per day
    """
    url  = "https://api.openweathermap.org/data/2.5/forecast"

    param = {
        "lat": lat,
        "lon": lon,
        "appid": api_key,
        "units": "metric"
    }

    response = requests.get(url, params=param)

    if response.status_code != 200:
        print(f"API Error: {response.status_code} - {response.text}")
        print(response.json())
        return None
    
    data = response.json()

    #extract daily data from 3 hour forecasts
    daily_data = {}

    for item in data["list"]:
        date = item["dt_txt"].split(" ")[0]

        if date not in daily_data:
            daily_data[date] = {
                "date": date,
                "temp_readings": [],
                "temp_max_readings": [],
                "temp_min_readings": [],
                "rainfall_readings": [],
                "humidity_readings": [],
                "wind_speed_readings": [],
                'solar_radiation': 15.0
            }
        #accumulate readings for the day
        daily_data[date]['temp_readings'].append(
            item['main']['temp']
        )
        daily_data[date]['temp_max_readings'].append(
            item['main']['temp_max']
        )
        daily_data[date]['temp_min_readings'].append(
            item['main']['temp_min']
        )
        daily_data[date]['humidity_readings'].append(
            item['main']['humidity']
        )
        daily_data[date]['wind_speed_readings'].append(
            item['wind']['speed']
        )

        #rainfall is optional in the API response
        if "rain" in item:
            daily_data[date]['rainfall_readings'].append(
                item['rain'].get('3h', 0)
            )
        else:
            daily_data[date]['rainfall_readings'].append(0)
        
        #aggregate daily averages
        rows = []
    for date, values in daily_data.items():
        rows.append({
            'date': pd.to_datetime(date),
            'temp_avg': np.mean(values['temp_readings']),
            'temp_max': np.max(values['temp_max_readings']),
            'temp_min': np.min(values['temp_min_readings']),
            'rainfall': np.sum(values['rainfall_readings']),
            'humidity': np.mean(values['humidity_readings']),
            'wind_speed': np.mean(values['wind_speed_readings']),
            'solar_radiation': values['solar_radiation']
        })
    
    forecast_df = pd.DataFrame(rows).sort_values('date').reset_index(drop=True)
    return forecast_df