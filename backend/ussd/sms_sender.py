import urllib3
import requests
import os
import ssl
from django.conf import settings
from AgroGuard_AI.agroguard_core import run_agroguard, STATE_COORDINATES
from farms.models import FarmProfile, PestReport, ClimateAlert
from .menus import TRANSLATIONS
from requests.adapters import HTTPAdapter
from urllib3.util.ssl_ import create_urllib3_context

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

CROP_MAP = {'1': 'Maize', '2': 'Cassava', '3': 'Yam'}
SOIL_MAP = {'1': 'Sandy', '2': 'Loamy', '3': 'Clay', '4': 'Stony'}

STATE_MAP = {
    '1': 'Lagos',  '2': 'Kano',  '3': 'Benue',  '4': 'Kaduna',
    '5': 'Ogun',   '6': 'Oyo',   '7': 'Enugu',  '8': 'Niger',
    '9': 'Plateau', '10': 'Cross River',
}

GROWTH_STAGE_MAP = {
    '1': 'Just planted (Day 1-10)',
    '2': 'Seedling (Day 10-30)',
    '3': 'Vegetative (Day 30-60)',
    '4': 'Flowering (Day 60-80)',
    '5': 'Grain filling (Day 80-90)',
    '6': 'Nearly ready (Day 90+)',
}

LANGUAGE_MAP = {
    '1': 'english', '2': 'pidgin', '3': 'hausa', '4': 'yoruba', '5': 'igbo',
}

REV_LANG_MAP = {v: k for k, v in LANGUAGE_MAP.items()}

BROADCAST_PREFIX = {
    '1': "Community Alert",
    '2': "Neighbour Alert",
    '3': "Gargadin Jama'a",
    '4': "Itaniji Agbegbe",
    '5': "Ochicho Obodo",
}

EARLY_WARNING = {
    'english': (
        "AgroGuard WARNING: High climate risk in {state} next 3 days. "
        "Dial *384*45979# and select Option 3 to log your field now. "
        "This record supports insurance claims. Ref: {ref}"
    ),
    'pidgin': (
        "AgroGuard WARNING: Weather wahala dey come for {state} next 3 days. "
        "Dial *384*45979# pick Option 3 log your farm now. "
        "E go help for insurance. Ref: {ref}"
    ),
    'hausa': (
        "AgroGuard GARGADI: Yanayi mai hadari a {state} kwanaki 3. "
        "Buga *384*45979# zabi 3 don rubuta gonarku yanzu. "
        "Wannan yana taimakawa da inshora. Ref: {ref}"
    ),
    'yoruba': (
        "AgroGuard ITANIJI: Ewu oju ojo ni {state} fun ojo 3. "
        "Pe *384*45979# yan 3 lati gba ipo oko re. "
        "Eyi le ran imo inawo lowo. Ref: {ref}"
    ),
    'igbo': (
        "AgroGuard OCHE: Ihe egwu ihu igwe na {state} ubochi 3. "
        "Kpoo *384*45979# horo 3 debanye ugbo gi ugbu a. "
        "Nke a na-enyere aka na insurance. Ref: {ref}"
    ),
}

# ── FIX: All SMS static strings translated into all 5 languages ──────────────
SMS_STRINGS = {
    'english': {
        'header':        "AgroGuard AI Advice:\nWeather Risk: {risk_cat} ({risk_score}%)\n",
        'weather':       "Next 3 Days: {forecast}\n",
        'sync_dry':      "FIELD SYNC: Dry soil reported. Water tonight even if rain is forecast.\n",
        'sync_flood':    "FIELD SYNC: Flooding reported. Clear drainage paths immediately.\n",
        'sync_yellow':   "FIELD SYNC: Yellow leaves reported. Add Urea/Nitrogen fertilizer.\n",
        'harvest':       "Harvest Window: Day {start} to Day {end}\n",
        'footer':        "Dial *384*45979# in 3 days for new updates.",
        'fallback':      "AgroGuard AI:\nCrop: {crop}\nStage: {stage}\nCheck soil moisture. Watch for pests.\nDial *384*45979# later.",
        'risk_high':     "High Risk",
        'risk_moderate': "Moderate Risk",
        'risk_low':      "Low Risk",
    },
    'pidgin': {
        'header':        "AgroGuard AI Advice:\nWeather Risk: {risk_cat} ({risk_score}%)\n",
        'weather':       "Next 3 Days: {forecast}\n",
        'sync_dry':      "FIELD SYNC: Ground dry. Water am tonight even if rain dey come.\n",
        'sync_flood':    "FIELD SYNC: Water don full. Clear drainage path sharp-sharp.\n",
        'sync_yellow':   "FIELD SYNC: Leaves don yellow. Add Urea/Nitrogen fertilizer.\n",
        'harvest':       "Time to Harvest: Day {start} to Day {end}\n",
        'footer':        "Dial *384*45979# after 3 days for new update.",
        'fallback':      "AgroGuard AI:\nCrop: {crop}\nStage: {stage}\nCheck soil. Watch for insects.\nDial *384*45979# later.",
        'risk_high':     "High Risk",
        'risk_moderate': "Moderate Risk",
        'risk_low':      "Low Risk",
    },
    'hausa': {
        'header':        "Shawarar AgroGuard AI:\nHaɗarin Yanayi: {risk_cat} ({risk_score}%)\n",
        'weather':       "Kwanaki 3 masu zuwa: {forecast}\n",
        'sync_dry':      "FIELD SYNC: An ruwaito ƙasa mai bushewa. Shayar da dare ko da ruwan sama ya zo.\n",
        'sync_flood':    "FIELD SYNC: An ruwaito ambaliya. Share hanyoyin magudanar ruwa nan da nan.\n",
        'sync_yellow':   "FIELD SYNC: An ruwaito ganye rawaya. Ƙara takin Urea/Nitrogen.\n",
        'harvest':       "Lokacin Girbi: Rana {start} zuwa Rana {end}\n",
        'footer':        "Buga *384*45979# bayan kwanaki 3 don sabbin bayanai.",
        'fallback':      "AgroGuard AI:\nAmfanin gona: {crop}\nMatakin: {stage}\nDuba ƙasa. Kula da kwari.\nBuga *384*45979# daga baya.",
        'risk_high':     "Haɗari Mai Girma",
        'risk_moderate': "Haɗari Mai Matsakaici",
        'risk_low':      "Haɗari Kaɗan",
    },
    'yoruba': {
        'header':        "Imoran AgroGuard AI:\nEwu Oju Ojo: {risk_cat} ({risk_score}%)\n",
        'weather':       "Ojo 3 to n bo: {forecast}\n",
        'sync_dry':      "FIELD SYNC: Ile gbigbe ni a royin. Mu omi de alẹ yi bi ojo ba n bo.\n",
        'sync_flood':    "FIELD SYNC: Ikun omi ni a royin. Pa ipa omi run lẹsẹkẹsẹ.\n",
        'sync_yellow':   "FIELD SYNC: Ewe ofeefee ni a royin. Fi Urea/Nitrogen sile.\n",
        'harvest':       "Akoko Ikore: Ojo {start} si Ojo {end}\n",
        'footer':        "Pe *384*45979# lẹhin ojo 3 fun imudojuiwon tuntun.",
        'fallback':      "AgroGuard AI:\nIrugbin: {crop}\nIpele: {stage}\nYewo ile. Wo kokoro.\nPe *384*45979# lẹhinna.",
        'risk_high':     "Ewu Giga",
        'risk_moderate': "Ewu Aarin",
        'risk_low':      "Ewu Kekere",
    },
    'igbo': {
        'header':        "Ndumodu AgroGuard AI:\nIhe Egwu Ihu Igwe: {risk_cat} ({risk_score}%)\n",
        'weather':       "Ubochi 3 n'iru: {forecast}\n",
        'sync_dry':      "FIELD SYNC: E kporo ala nkụ. Kpasa mmiri taa n'abalị ọbụna ma mmiri ozuzo chọọ ịbia.\n",
        'sync_flood':    "FIELD SYNC: E kporo ike mmiri. Hazie ụzọ mmiri ozugbo.\n",
        'sync_yellow':   "FIELD SYNC: E kporo akwụkwọ odo odo. Tinye Urea/Nitrogen nri.\n",
        'harvest':       "Oge Ịkọ Ihe: Ubochi {start} rue Ubochi {end}\n",
        'footer':        "Kpoo *384*45979# mgbe ubochi 3 gachara maka nkọwa ọhụrụ.",
        'fallback':      "AgroGuard AI:\nIhe a kụrụ: {crop}\nOkwa: {stage}\nLee ala. Lelee ahụhụ.\nKpoo *384*45979# mgbe e mesịrị.",
        'risk_high':     "Ihe Egwu Dị Elu",
        'risk_moderate': "Ihe Egwu Di n'Etiti",
        'risk_low':      "Ihe Egwu pere mpe",
    },
}


def _s(language, key, **kwargs):
    """Helper — get a translated SMS string and format it."""
    pack = SMS_STRINGS.get(language, SMS_STRINGS['english'])
    template = pack.get(key, SMS_STRINGS['english'][key])
    return template.format(**kwargs) if kwargs else template


def handle_pest_logic(phone, symptom_code, severity_code, lang_id):
    try:
        farm     = FarmProfile.objects.get(phone_number=phone)
        pest_key = 'general'

        if farm.crop_type == 'Maize':
            if symptom_code == '1':           pest_key = 'armyworm'
            elif symptom_code == '2':         pest_key = 'stem_borer'
            else:                             pest_key = 'maize_streak'
        elif farm.crop_type == 'Cassava':
            if symptom_code == '1':           pest_key = 'cassava_whitefly'
            elif symptom_code == '2':         pest_key = 'cassava_mealybug'
            elif symptom_code in ('3', '4'):  pest_key = 'cassava_mosaic'
        elif farm.crop_type == 'Yam':
            if symptom_code == '2':           pest_key = 'yam_beetle'
            else:                             pest_key = 'yam_mosaic'

        language_pack = TRANSLATIONS.get(lang_id, TRANSLATIONS['1'])
        pest_library  = language_pack.get('pest_advice', TRANSLATIONS['1']['pest_advice'])
        final_advice  = pest_library.get(pest_key, pest_library['general'])

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

        neighbors = FarmProfile.objects.filter(
            state=farm.state, crop_type=farm.crop_type
        ).exclude(phone_number=phone)

        for neighbor in neighbors:
            n_lang_id = REV_LANG_MAP.get(neighbor.language, '1')
            prefix    = BROADCAST_PREFIX.get(n_lang_id, "Alert")
            broadcast_msg = (
                f"AgroGuard {prefix}: "
                f"{pest_key.replace('_', ' ').title()} reported in {farm.state}. "
                f"Check your farm today!"
            )
            send_sms(neighbor.phone_number, broadcast_msg)

    except Exception as e:
        print(f"Pest Logic Error: {e}")


def send_high_risk_warning(phone_number, state, crop_type, language, risk_score, forecast):
    alert = ClimateAlert.objects.create(
        phone_number=phone_number,
        state=state,
        crop_type=crop_type,
        risk_level='High Risk',
        risk_score=risk_score,
        forecast=forecast,
        warning_sent=False,
    )

    template    = EARLY_WARNING.get(language, EARLY_WARNING['english'])
    warning_msg = template.format(state=state, ref=f"AGR-{alert.id:05d}")
    result      = send_sms(phone_number, warning_msg)

    if result and result.status_code == 201:
        alert.warning_sent = True
        alert.save(update_fields=['warning_sent'])

    neighbors = FarmProfile.objects.filter(
        state=state, crop_type=crop_type
    ).exclude(phone_number=phone_number)

    for neighbor in neighbors:
        n_lang    = neighbor.language
        template  = EARLY_WARNING.get(n_lang, EARLY_WARNING['english'])
        n_warning = template.format(state=state, ref=f"AGR-{alert.id:05d}")
        send_sms(neighbor.phone_number, n_warning)

    print(f"[ClimateAlert] Record AGR-{alert.id:05d} created for {phone_number} in {state}")
    return alert


def get_ai_recommendation(crop_type, state, growth_stage, language, phone_number, soil_type='Loamy'):
    try:
        result = run_agroguard(
            crop_type=crop_type,
            state=state,
            growth_stage=growth_stage,
            language=language,
            api_key=settings.OPENWEATHER_API_KEY,
            soil_type=soil_type,
        )

        if 'error' in result:
            return fallback_message(crop_type, growth_stage, language)

        farm        = FarmProfile.objects.get(phone_number=phone_number)
        sync_status = farm.last_field_status

        # FIX: calibration notes now use the farmer's chosen language
        calibration_note = ""
        if sync_status == 'Dry':
            calibration_note = _s(language, 'sync_dry')
        elif sync_status == 'Flooded':
            calibration_note = _s(language, 'sync_flood')
        elif sync_status == 'Yellow Leaves':
            calibration_note = _s(language, 'sync_yellow')

        if sync_status and sync_status != 'Healthy':
            FarmProfile.objects.filter(phone_number=phone_number).update(
                last_field_status=None
            )

        risk_cat      = result.get('risk_category', 'Low Risk')
        risk_score    = result.get('risk_score', 0)
        forecast_3day = result.get('short_forecast', '')

        if risk_cat == 'High Risk':
            send_high_risk_warning(
                phone_number=phone_number,
                state=state,
                crop_type=crop_type,
                language=language,
                risk_score=risk_score,
                forecast=forecast_3day,
            )

        # FIX: header, weather section, harvest window, footer all localised
        # Translate the risk category label too
        risk_label_map = {
            'High Risk':     _s(language, 'risk_high'),
            'Moderate Risk': _s(language, 'risk_moderate'),
            'Low Risk':      _s(language, 'risk_low'),
        }
        risk_label = risk_label_map.get(risk_cat, risk_cat)

        header          = _s(language, 'header', risk_cat=risk_label, risk_score=risk_score)
        weather_section = _s(language, 'weather', forecast=forecast_3day)
        message         = f"{header}\n{calibration_note}{weather_section}\n{result['message']}\n"

        for alert in result['alerts']:
            if not any(skip in alert for skip in ('No major', 'No bad weather', 'no alerts')):
                message += f"{alert}\n"

        if result['harvest_window']['start']:
            message += _s(
                language, 'harvest',
                start=result['harvest_window']['start'],
                end=result['harvest_window']['end'],
            )

        message += _s(language, 'footer')
        return message

    except Exception as e:
        print(f"AI Model Error: {str(e)}")
        return fallback_message(crop_type, growth_stage, language)


def fallback_message(crop, stage, language='english'):
    # FIX: fallback is now also translated
    return _s(language, 'fallback', crop=crop, stage=stage)


def send_sms(phone_number, message):
    print("\n" + "=" * 50)
    print(f"DISPATCHING SMS TO: {phone_number}")
    print("-" * 50)
    print(message)
    print("=" * 50 + "\n")

    demo_mode = getattr(settings, 'AT_DEMO_MODE', False)
    if demo_mode is True or str(demo_mode).lower() in ('true', '1'):
        print("[DEMO MODE] SMS logged above. Not dispatched.")
        return None

    try:
        url = "https://api.sandbox.africastalking.com/version1/messaging"

        headers = {
            "apiKey":       settings.AT_API_KEY.strip(),
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept":       "application/json",
        }
        data = {
            "username": settings.AT_USERNAME.strip(),
            "to":       phone_number,
            "message":  message,
        }

        response = requests.post(
            url, headers=headers, data=data,
            verify=False, timeout=20,
        )
        print(f"SMS API Response: {response.status_code} — {response.text}")
        return response

    except Exception as e:
        print(f"SMS Error: {str(e)}")
        return None


def build_and_send(
    phone_number,
    crop_choice=None,
    state_choice=None,
    soil_choice=None,
    stage_choice=None,
    language_choice=None,
    existing_farm=None,
):
    if existing_farm:
        crop         = existing_farm.crop_type
        state        = existing_farm.state
        growth_stage = existing_farm.growth_stage
        language     = existing_farm.language
        soil         = existing_farm.soil_type or 'Loamy'
    else:
        language     = LANGUAGE_MAP.get(language_choice, 'pidgin')
        crop         = CROP_MAP.get(crop_choice, 'Maize')
        state        = STATE_MAP.get(state_choice, 'Lagos')
        soil         = SOIL_MAP.get(soil_choice, 'Loamy')
        growth_stage = GROWTH_STAGE_MAP.get(stage_choice, 'Vegetative (Day 30-60)')

        coords = STATE_COORDINATES.get(state, (6.5244, 3.3792))

        FarmProfile.objects.update_or_create(
            phone_number=phone_number,
            defaults={
                'state':        state,
                'crop_type':    crop,
                'growth_stage': growth_stage,
                'language':     language,
                'latitude':     coords[0],
                'longitude':    coords[1],
                'soil_type':    soil,
            },
        )

    message = get_ai_recommendation(crop, state, growth_stage, language, phone_number, soil_type=soil)
    send_sms(phone_number, message)
    return "END Advice sent via SMS!"