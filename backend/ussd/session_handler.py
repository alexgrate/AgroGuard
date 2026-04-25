from .menus import (
    main_menu,
    crop_menu,
    growth_stage_menu,
    soil_condition_menu,
)
from .sms_sender import build_and_send

def handle_session(session_id, phone_number, text):
    parts = text.split('*') if text else []
    level = len(parts)

    if text == '':
        return main_menu()
    
    if level == 1:
        if parts[0] == '1':
            return crop_menu()
        else:
            return "END Coming soon. Try option 1 for now."
        
    if level == 2 and parts[0] == '1':
        return "CON Enter planting date (DD/MM):\nExample: 15/04"
    
    if level == 3 and parts[0] == '1':
        return growth_stage_menu()
    
    if level == 4 and parts[0] == '1':
        return soil_condition_menu()
    
    if level == 5 and parts[0] == '1':
        return build_and_send(
            phone_number,
            crop_choice = parts[1],
            planting_date = parts[2],
            stage_choice = parts[3],
            soil_choice = parts[4],
        )
    
    return "END Something went wrong. Please try again."