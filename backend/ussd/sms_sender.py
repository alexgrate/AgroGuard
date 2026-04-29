import ssl
import certifi
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
import requests
from django.conf import settings

CROP_MAP  = {'1':'Maize','2':'Cassava','3':'Yam','4':'Tomato','5':'Rice'}
STAGE_MAP = {'1':'Seedling','2':'Vegetative','3':'Flowering','4':'Harvest Ready'}
SOIL_MAP  = {'1':'Dry','2':'Moist','3':'Wet/Flooded'}
IRRIGATION_MAP = {'1':'Rain-fed','2':'Manual watering','3':'Drip irrigation','4':'None yet'}

def send_sms(phone_number, message):
    try:
        url = "https://api.sandbox.africastalking.com/version1/messaging"

        headers = {
            "apiKey": settings.AT_API_KEY,
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept": "application/json"
        }

        data = {
            "username": settings.AT_USERNAME,
            "to": phone_number,
            "message": message
        }

        response = requests.post(
            url,
            headers=headers,
            data=data,
            verify=False,
            timeout=10
        )
        print(f"SMS Response: {response.status_code} - {response.text}")
        return response

    except Exception as e:
        print(f"SMS sending failed: {str(e)}")
        return None

def build_and_send(phone, crop_choice, planting_date, stage_choice, soil_choice):
    crop  = CROP_MAP.get(crop_choice, 'Unknown')
    stage = STAGE_MAP.get(stage_choice, 'Unknown')
    soil  = SOIL_MAP.get(soil_choice, 'Unknown')

    message = (
        f"AgroGuard NG Advice:\n"
        f"Crop: {crop} ({stage})\n"
        f"Soil: {soil} | Planted: {planting_date}\n"
        f"→ Water in evening only\n"
        f"→ Watch for pests next 3 days\n"
        f"→ Apply mulch against 36C heat\n"
        f"Dial *384*456# for more advice."
    )

    send_sms(phone, message)

    return "END Thank you! Your personalised\nadvice has been sent via SMS."