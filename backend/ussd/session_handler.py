from .menus import (
    main_menu, location_menu, manual_location_menu,
    crop_menu, growth_stage_menu, soil_type_menu,
    soil_condition_menu, irrigation_menu,
    pest_report_menu, pest_type_menu, weather_report_menu
)
from .sms_sender import build_and_send

def handle_session(session_id, phone_number, text):
    parts = text.split('*') if text else []
    level = len(parts)

    if text == '':
        return main_menu()

    if level == 1:
        if parts[0] == '1':
            return location_menu()
        elif parts[0] == '2':
            return "CON Enter your phone number\nto retrieve your farm profile:"
        elif parts[0] == '3':
            return weather_report_menu()
        elif parts[0] == '4':
            return pest_report_menu()
        else:
            return "END Invalid option. Please try again."

    if parts[0] == '1':

        if level == 2:
            if parts[1] == '1':
                return crop_menu()      
            elif parts[1] == '2':
                return manual_location_menu() 

        if parts[1] == '1':
            if level == 3:                 
                return "CON Enter planting date:\nFormat DD/MM e.g. 15/04"
            if level == 4:              
                return growth_stage_menu()
            if level == 5:           
                return soil_type_menu()
            if level == 6:              
                return soil_condition_menu()
            if level == 7:               
                return irrigation_menu()
            if level == 8:               
                return build_and_send(
                    phone_number,
                    crop_choice   = parts[2],
                    planting_date = parts[3],
                    stage_choice  = parts[4],
                    soil_choice   = parts[6],
                )

        if parts[1] == '2':
            if level == 3:                  
                return crop_menu()
            if level == 4:                
                return "CON Enter planting date:\nFormat DD/MM e.g. 15/04"
            if level == 5:                
                return growth_stage_menu()
            if level == 6:                  
                return soil_type_menu()
            if level == 7:                
                return soil_condition_menu()
            if level == 8:                 
                return irrigation_menu()
            if level == 9:                  
                return build_and_send(
                    phone_number,
                    crop_choice   = parts[3],
                    planting_date = parts[4],
                    stage_choice  = parts[5],
                    soil_choice   = parts[7],
                )

    if parts[0] == '3':
        if level == 2:
            return "END Thank you for the report!\nWe will factor this into your next advice."

    if parts[0] == '4':
        if level == 2:
            if parts[1] == '1':
                return pest_type_menu()
            elif parts[1] == '2':
                return "END No pests reported. Stay alert!\nDial back for daily advice."
            else:
                return "END Our team will send pest\nidentification tips via SMS shortly."
        if level == 3:
            return "END Pest alert recorded!\nAgroGuard will send treatment advice via SMS."

    return "END Something went wrong. Please try again."