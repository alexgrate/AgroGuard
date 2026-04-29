def main_menu():
    return (
        "CON Welcome to AgroGuard NG 🌱\n"
        "Climate-Smart Farming Assistant\n"
        "1. Register My Farm\n"
        "2. Get Today's Advice\n"
        "3. Report Weather\n"
        "4. Pest Alert"
    )

def location_menu():
    return (
        "CON Set Farm Location:\n"
        "1. Use My Current Location (GPS)\n"
        "2. Enter Location Manually"
    )

def manual_location_menu():
    return (
        "CON Enter your state:\n"
        "1. Lagos\n"
        "2. Kano\n"
        "3. Oyo\n"
        "4. Kaduna\n"
        "5. Rivers"
    )

def crop_menu():
    return (
        "CON Select your crop:\n"
        "1. Maize\n"
        "2. Cassava\n"
        "3. Yam\n"
        "4. Tomato\n"
        "5. Rice"
    )

def planting_date_menu():
    return (
        "CON Enter planting date:\n"
        "Format: DD/MM e.g. 15/04"
    )

def growth_stage_menu():
    return (
        "CON Current growth stage\n"
        "1. Seedling\n"
        "2. Vegetative\n"
        "3. Flowering\n"
        "4. Ready to Harvest"
    )

def soil_type_menu():
    return (
        "CON Select soil type:\n"
        "(Auto-detected from your location)\n"
        "1. Sandy\n"
        "2. Loamy\n"
        "3. Clay\n"
        "4. Not Sure"
    )

def soil_condition_menu():
    return (
        "CON Soil condition today:\n"
        "1. Dry\n"
        "2. Moist\n"
        "3. Wet / Flooded"
    )

def irrigation_menu():
    return (
        "CON Irrigation method used:\n"
        "1. Rain-fed only\n"
        "2. Manual watering\n"
        "3. Drip irrigation\n"
        "4. None yet"
    )

def pest_report_menu():
    return (
        "CON Any pest attacks seen?\n"
        "1. Yes - describe\n"
        "2. No pests seen\n"
        "3. Not sure / Need help"
    )

def pest_type_menu():
    return (
        "CON Select pest type:\n"
        "1. Fall Armyworm\n"
        "2. Locusts\n"
        "3. Aphids\n"
        "4. Stem Borers\n"
        "5. Other"
    )

def weather_report_menu():
    return (
        "CON Weather observation today:\n"
        "1. Very Hot (above 35°C)\n"
        "2. Normal\n"
        "3. Raining\n"
        "4. Heavy Rain / Flooding"
    )