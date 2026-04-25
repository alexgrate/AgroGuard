import africastalking
import requests
from django.conf import settings


CROP_MAP  = {'1':'Maize','2':'Cassava','3':'Yam','4':'Tomato','5':'Rice'}
STAGE_MAP = {'1':'Seedling','2':'Vegetative','3':'Flowering','4':'Harvest Ready'}
SOIL_MAP  = {'1':'Dry','2':'Moist','3':'Wet/Flooded'}


def send_sms(phone_number, message):
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

    response = requests.post(url, headers=headers, data=data, verify=False)
    return response

def build_and_send(phone, crop_choice, planting_date, stage_choice, soil_choice):
    crop  = CROP_MAP.get(crop_choice, 'Unknown')
    stage = STAGE_MAP.get(stage_choice, 'Unknown')
    soil  = SOIL_MAP.get(soil_choice, 'Unknown')

    message = (
        f"AgroGuard NG:\n"
        f"Crop: {crop} ({stage}). Soil: {soil}.\n"
        f"Planted: {planting_date}.\n"
        f"→ Water in evening to reduce heat stress\n"
        f"→ Watch for pests in next 3 days\n"
        f"→ Apply mulch to conserve moisture\n"
        f"Dial *384*123# for more advice."
    )

    send_sms(phone, message)
    return "END Thank you! Your advice has been sent to your phone via SMS."