# translation.py

TEMPLATES = {
    'english': {
        'harvest_window': (
            "Your {crop} matures in {days} days. "
            "Best harvest window: Day {start} to Day {end}. "
            "Conditions look favourable during this period."
        ),
        'not_ready': (
            "Your {crop} matures in {days} days — "
            "beyond our current forecast window. "
            "Check back closer to your maturity date."
        ),
        'high_risk': (
            "Your {crop} matures in {days} days but "
            "climate conditions look unfavourable. "
            "Consider protective measures: mulching, early cover, "
            "or consult your extension officer."
        ),
        'heat_alert': (
            "Heat Stress Alert: Temperatures reaching {temp}°C "
            "forecast this week. Ensure adequate irrigation."
        ),
        'drought_alert': (
            "Drought Alert: Very low rainfall forecast. "
            "Increase irrigation frequency to protect your crop."
        ),
        'flood_alert': (
            "Flood Alert: Heavy rainfall forecast. "
            "Ensure proper drainage around your farm."
        ),
        'no_alerts': (
            "No major climate alerts for your area this week."
        )
    },

    'pidgin': {
        'harvest_window': (
            "Your {crop} don almost ready in {days} days. "
            "Make you harvest between Day {start} and Day {end}. "
            "Weather go better that time."
        ),
        'not_ready': (
            "Your {crop} no ready yet. "
            "E go ready in {days} days. "
            "Come back check am when e near ready."
        ),
        'high_risk': (
            "Your {crop} go ready in {days} days but "
            "weather no look good. "
            "Cover your farm well and call your extension officer."
        ),
        'heat_alert': (
            "Hot weather dey come — e go reach {temp}°C. "
            "Water your farm well this week."
        ),
        'drought_alert': (
            "Rain no dey come. "
            "Make sure you dey water your farm well well."
        ),
        'flood_alert': (
            "Heavy rain dey come. "
            "Make sure water fit flow comot from your farm."
        ),
        'no_alerts': (
            "No bad weather wahala for your area this week."
        )
    },

    'hausa': {
        'harvest_window': (
            "Gonar ku za ta yi a cikin kwanaki {days}. "
            "Mafi kyawun lokacin girbi: Rana {start} zuwa {end}. "
            "Yanayi zai yi kyau a wannan lokacin."
        ),
        'not_ready': (
            "Gonar ku za ta yi a cikin kwanaki {days}. "
            "Ta wuce window din hasashen mu na yanzu. "
            "Ku dawo kusa da ranar girbi."
        ),
        'high_risk': (
            "Gonar ku za ta yi a cikin kwanaki {days} amma "
            "yanayi bai yi kyau ba. "
            "Yi amfani da kariya: rufe gonar ku ko tuntuɓi jami'in noma."
        ),
        'heat_alert': (
            "Gargaɗin zafi: Zafin jiki zai kai {temp}°C wannan mako. "
            "Tabbatar da ban ruwa mai kyau."
        ),
        'drought_alert': (
            "Gargaɗin fari: Ƙaramin ruwan sama an hango. "
            "Ƙara yawan ban ruwa don kare gonarku."
        ),
        'flood_alert': (
            "Gargaɗin ambaliya: Ruwan sama mai yawa an hango. "
            "Tabbatar da kyakkyawan magudanar ruwa a gonarku."
        ),
        'no_alerts': (
            "Babu manyan gargaɗin yanayi a yankinku wannan mako."
        )
    },

    'yoruba': {
        'harvest_window': (
            "Irugbin rẹ yoo dagba ni ọjọ {days}. "
            "Akoko ikore ti o dara julọ: Ọjọ {start} si {end}. "
            "Ipo yoo dara lakoko yii."
        ),
        'not_ready': (
            "Irugbin rẹ yoo dagba ni ọjọ {days} — "
            "ju window asọtẹlẹ wa lọ. "
            "Pada wa nitosi ọjọ idagbasoke rẹ."
        ),
        'high_risk': (
            "Irugbin rẹ yoo dagba ni ọjọ {days} ṣugbọn "
            "ipo oju ojo ko dara. "
            "Ro mulching, ibori tete, tabi kan si oṣiṣẹ ogbin rẹ."
        ),
        'heat_alert': (
            "Itaniji Ooru: Iwọn otutu de {temp}°C ni asọtẹlẹ ọsẹ yii. "
            "Rii daju irigeshọnu to peye."
        ),
        'drought_alert': (
            "Itaniji Ogbele: Ojo kekere ni asọtẹlẹ. "
            "Mu igbohunsafẹfẹ irigeshọnu pọ si lati daabobo irugbin rẹ."
        ),
        'flood_alert': (
            "Itaniji Iṣan omi: Ojo nla ni asọtẹlẹ. "
            "Rii daju fifa omi to dara ni ayika oko rẹ."
        ),
        'no_alerts': (
            "Ko si itaniji oju ojo pataki fun agbegbe rẹ ọsẹ yii."
        )
    },

    'igbo': {
        'harvest_window': (
            "Ihe ọ kụrụ gị ga-eto n'ime ụbọchị {days}. "
            "Oge kacha mma iji: Ụbọchị {start} ruo {end}. "
            "Ọnọdụ ga-adị mma n'oge ahụ."
        ),
        'not_ready': (
            "Ihe ọ kụrụ gị ga-eto n'ime ụbọchị {days} — "
            "karịa window amụma anyị ugbu a. "
            "Laghachi nso ụbọchị ịdị eto."
        ),
        'high_risk': (
            "Ihe ọ kụrụ gị ga-eto n'ime ụbọchị {days} mana "
            "ọnọdụ ihu igwe adịghị mma. "
            "Tụlee mulching, mkpuchi oge, ma ọ bụ kpọtụrụ onye ọrụ ugbo gị."
        ),
        'heat_alert': (
            "Ọchịchọ Okpomọkụ: Okpomọkụ na-eru {temp}°C amụma izu a. "
            "Hụ na mmiri ịrio dị mma."
        ),
        'drought_alert': (
            "Ọchịchọ Ọkọchị: Mmiri ozuzo pere mpe amụma. "
            "Bawanye ọnụ ọgụgụ mmiri ịrio iji chebe ihe ọ kụrụ gị."
        ),
        'flood_alert': (
            "Ọchịchọ Ọkụkọ mmiri: Mmiri ozuzo dị ukwuu amụma. "
            "Hụ na mmiri nspụpụ dị mma gburugburu ugbo gị."
        ),
        'no_alerts': (
            "Enweghị ọchịchọ ihu igwe buru ibu maka mpaghara gị izu a."
        )
    }
}


def translate_recommendation(message_type, language='english', **kwargs):
    """
    Generate a translated recommendation message.
    
    message_type: harvest_window, not_ready, high_risk,
                  heat_alert, drought_alert, flood_alert, no_alerts
    language: english, pidgin, hausa, yoruba, igbo
    kwargs: dynamic values like days, crop, start, end, temp
    """
    # Default to English if language not supported
    if language not in TEMPLATES:
        language = 'english'
    
    template = TEMPLATES[language].get(message_type, '')
    
    # Fill in dynamic values
    try:
        return template.format(**kwargs)
    except KeyError as e:
        print(f"Missing value for template: {e}")
        return template


def get_all_translations(message_type, **kwargs):
    """
    Get a message translated in all available languages at once.
    Useful for displaying multilingual output.
    """
    return {
        lang: translate_recommendation(message_type, lang, **kwargs)
        for lang in TEMPLATES.keys()
    }