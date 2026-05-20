import urllib3
import requests
import os 
from django.conf import settings
from AgroGuard_AI.agroguard_core import run_agroguard, STATE_COORDINATES
from farms.models import FarmProfile, PestReport
from .menus import TRANSLATIONS 

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

CROP_MAP  = {'1':'Maize','2':'Cassava','3':'Yam'}

SOIL_MAP = {'1': 'Sandy', '2': 'Loamy', '3': 'Clay', '4': 'Stony'}

STATE_MAP = {
    '1': 'Lagos', '2': 'Kano', '3': 'Benue', '4': 'Kaduna',
    '5': 'Ogun', '6': 'Oyo', '7': 'Enugu', '8': 'Niger',
    '9': 'Plateau', '10': 'Cross River'
}

GROWTH_STAGE_MAP = {
    '1': 'Just planted (Day 1-10)',
    '2': 'Seedling (Day 10-30)',
    '3': 'Vegetative (Day 30-60)',
    '4': 'Flowering (Day 60-80)',
    '5': 'Grain filling (Day 80-90)',
    '6': 'Nearly ready (Day 90+)'
}

LANGUAGE_MAP = {
    '1': 'english', '2': 'pidgin', '3': 'hausa', '4': 'yoruba', '5': 'igbo'
}

REV_LANG_MAP = {v: k for k, v in LANGUAGE_MAP.items()}

BROADCAST_PREFIX = {
    '1': "Community Alert",
    '2': "Neighbour Alert",
    '3': "Gargaɗin Jama'a",
    '4': "Itaniji Agbegbe",
    '5': "Ọchịchọ Obodo",  
}


def handle_pest_logic(phone, symptom_code, severity_code, lang_id):
    try:
        farm = FarmProfile.objects.get(phone_number=phone)
        pest_key = 'general'

        if farm.crop_type == 'Maize':
            if symptom_code == '1': 
                pest_key = 'armyworm'
            elif symptom_code == '2': 
                pest_key = 'stem_borer'
            else: 
                pest_key = 'maize_streak'
        elif farm.crop_type == 'Cassava':
            if symptom_code == '1': 
                pest_key = 'cassava_whitefly'
            elif symptom_code == '2':
                pest_key = 'cassava_mealybug'
            elif symptom_code in ('3', '4'):
                pest_key = 'cassava_mosaic'
        elif farm.crop_type == 'Yam':
            if symptom_code == '2': 
                pest_key = 'yam_beetle' 
            else: 
                pest_key = 'yam_mosaic'

        language_pack = TRANSLATIONS.get(lang_id, TRANSLATIONS['1'])
        pest_library = language_pack.get('pest_advice', TRANSLATIONS['1']['pest_advice'])
        final_advice = pest_library.get(pest_key, pest_library['general'])

        PestReport.objects.create(
            phone_number=phone, 
            state=farm.state, 
            crop_type=farm.crop_type, 
            symptom_choice=symptom_code,
            severity=severity_code, 
            detected_pest=pest_key,
            language=LANGUAGE_MAP.get(lang_id, 'english'),
        )

        personal_msg = f"AgroGuard AI Alert:\n{final_advice}\n\nDial *384*45979# for more."
        send_sms(phone, personal_msg)

        neighbors = FarmProfile.objects.filter(state=farm.state, crop_type=farm.crop_type).exclude(phone_number=phone)
        
        for neighbor in neighbors:
            n_lang_id = REV_LANG_MAP.get(neighbor.language, '1')
            prefix = BROADCAST_PREFIX.get(n_lang_id, "Alert")
            broadcast_msg = (
                f"AgroGuard {prefix}: "
                f"{pest_key.replace('_', ' ').title()} reported in {farm.state}. "
                f"Check your farm today!"
            )
            send_sms(neighbor.phone_number, broadcast_msg)

    except Exception as e:
        print(f"Pest Logic Error: {e}")


def get_ai_recommendation(crop_type, state, growth_stage, language, phone_number):
    try: 
        result = run_agroguard(
            crop_type=crop_type,
            state=state,
            growth_stage=growth_stage,
            language=language,
            api_key=settings.OPENWEATHER_API_KEY
        )

        if 'error' in result:
            return fallback_message(crop_type, growth_stage)
        

        farm = FarmProfile.objects.get(phone_number=phone_number)
        sync_status = farm.last_field_status 

        calibration_note = ""
        if sync_status == 'Dry':
            calibration_note = "⚠️ FIELD SYNC: You reported dry soil. AI advice: Water tonight even if rain is forecast.\n"
        elif sync_status == 'Flooded':
            calibration_note = "⚠️ FIELD SYNC: You reported flooding. AI advice: Clear drainage paths immediately.\n"
        elif sync_status == 'Yellow Leaves':
            calibration_note = "⚠️ FIELD SYNC: Health alert (Yellow leaves). Add Urea/Nitrogen fertilizer.\n"

        if sync_status and sync_status != 'Healthy':
            FarmProfile.objects.filter(phone_number=phone_number).update(
                last_field_status=None
            )

        risk_cat = result.get('risk_category', 'Stable')
        risk_score = result.get('risk_score', 0)
        forecast_3day = result.get('short_forecast', '')

        header = f"AgroGuard AI Advice:\nWeather Risk: {risk_cat} ({risk_score}%)\n"
        weather_section = f"Next 3 Days: {forecast_3day}\n"
        
        message = f"{header}\n{calibration_note}{weather_section}\n{result['message']}\n"

        for alert in result['alerts']:
            if not any(skip in alert for skip in ('No major', 'No bad weather', 'no alerts')):
                message += f"⚠️ {alert}\n"

        if result['harvest_window']['start']:
            message += (
                f"📅 Harvest Window: "
                f"Day {result['harvest_window']['start']} to "
                f"Day {result['harvest_window']['end']}\n"
            )

        message += "\nDial *384*45979# in 3 days for new updates."
        return message
    
    except Exception as e:
        print(f"AI Model Error: {str(e)}")
        return fallback_message(crop_type, growth_stage)


def fallback_message(crop, stage):
    return (
        f"AgroGuard AI:\nCrop: {crop}\nStage: {stage}\n"
        f"→ Check soil moisture.\n→ Watch for pests.\nDial *384*45979# later."
    )

def send_sms(phone_number, message):
    try:
        os.environ['no_proxy'] = '*'

        url = "https://api.sandbox.africastalking.com/version1/messaging"
        safe_username = settings.AT_USERNAME.strip()
        safe_api_key = settings.AT_API_KEY.strip()
        
        headers = {
            "apiKey": safe_api_key,
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept": "application/json"
        }
        data = {
            "username": safe_username,
            "to": phone_number,
            "message": message
        }
        
        print("\n" + "="*50)
        print(f"📱 DISPATCHING SMS TO: {phone_number}")
        print("-" * 50)
        print(message)
        print("="*50 + "\n")
        
        session = requests.Session()
        session.verify = False       
        session.trust_env = False    
        
        response = session.post(
            url, headers=headers, data=data, timeout=20,
            proxies={"http": None, "https": None}
        )
        print(f"SMS API Response: {response.status_code}")
        return response

    except Exception as e:
        print(f"SMS Error: {str(e)}")
        return None

def build_and_send(phone_number, crop_choice=None, state_choice=None, soil_choice=None, stage_choice=None, language_choice=None, existing_farm=None):
    if existing_farm:
        crop = existing_farm.crop_type
        state = existing_farm.state
        growth_stage = existing_farm.growth_stage
        language = existing_farm.language
    else:
        language = LANGUAGE_MAP.get(language_choice, 'pidgin')
        crop = CROP_MAP.get(crop_choice, 'Maize')
        state = STATE_MAP.get(state_choice, 'Lagos')
        soil = SOIL_MAP.get(soil_choice, 'Loamy')
        growth_stage = GROWTH_STAGE_MAP.get(stage_choice, 'Vegetative (Day 30-60)')

        coords = STATE_COORDINATES.get(state, (6.5244, 3.3792))
        
        FarmProfile.objects.update_or_create(
            phone_number=phone_number,
            defaults={
                'state': state,
                'crop_type': crop,
                'growth_stage': growth_stage,
                'language': language,
                'latitude': coords[0],
                'longitude': coords[1],
                'soil_type': soil 
            }
        )

    message = get_ai_recommendation(crop, state, growth_stage, language, phone_number)
    send_sms(phone_number, message)

    return "END Advice sent via SMS!"