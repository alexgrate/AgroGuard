from farms.models import FarmProfile
from .menus import language_menu, TRANSLATIONS
from .sms_sender import build_and_send, handle_pest_logic

def handle_session(session_id, phone_number, text):
    parts = text.split('*') if text else []
    level = len(parts)

    if text == '': 
        return language_menu()

    lang_id = parts[0]
    menu = TRANSLATIONS.get(lang_id, TRANSLATIONS['1'])

    if level == 1: 
        return f"CON {menu['main']}"

    if level >= 2 and parts[1] == '3':
        if level == 2:
            return f"CON {menu['sync_main']}"
        if level == 3:
            status_map = {'1':'Dry', '2':'Flooded', '3':'Yellow Leaves', '4':'Healthy'}
            FarmProfile.objects.filter(phone_number=phone_number).update(
                last_field_status=status_map.get(parts[2], 'Healthy')
            )
            return f"END {menu['sync_thanks']}"

    if parts[1] == '1' or (level >= 3 and parts[1] == '2' and parts[2] == '2'):
        shift = 2 if parts[1] == '1' else 3
        current_step = level - shift

        if current_step == 0: return f"CON {menu['loc']}"
        if current_step == 1: return f"CON {menu['state']}"
        if current_step == 2: return f"CON {menu['crop']}"
        if current_step == 3: return f"CON {menu['soil']}"   
        if current_step == 4: return f"CON {menu['stage']}"
        if current_step == 5:
            return build_and_send(
                phone_number=phone_number,
                crop_choice=parts[shift + 2],
                state_choice=parts[shift + 1],
                soil_choice=parts[shift + 3],
                stage_choice=parts[shift + 4],
                language_choice=lang_id,
            )

    if level >= 2 and parts[1] == '2':
        try:
            farm = FarmProfile.objects.get(phone_number=phone_number)
            if level == 2:
                return f"CON {menu['confirm'].format(crop=farm.crop_type, state=farm.state)}"
            if level == 3 and parts[2] == '1': 
                return build_and_send(phone_number=phone_number, existing_farm=farm)
        except FarmProfile.DoesNotExist:
            return "END No farm found. Please pick Option 1 first."

    if level >= 2 and parts[1] == '4':
        if level == 2: return f"CON {menu['pest_symptom']}"
        if level == 3: return f"CON {menu['pest_severity']}"
        if level == 4:
            handle_pest_logic(phone_number, parts[2], parts[3], lang_id)
            return f"END {menu['pest_thanks']}"

    return "END Something went wrong. Please try again."