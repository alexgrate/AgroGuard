import os
from django.core.management.base import BaseCommand
from django.conf import settings
from datetime import date
from farms.models import FarmProfile, ClimateAlert
from AgroGuard_AI.agroguard_core import run_agroguard
from ussd.sms_sender import send_sms, _s, EARLY_WARNING

class Command(BaseCommand):
    help = 'Proactively scans the latest weather forecasts and dispatches early warnings to farmers at high risk.'

    def handle(self, *args, **options):
        self.stdout.write("Starting proactive weather scan...")
        
        farms = FarmProfile.objects.exclude(phone_number__isnull=True).exclude(phone_number='')
        
        if not farms.exists():
            self.stdout.write("No registered farms with phone numbers found.")
            return

        api_key = settings.OPENWEATHER_API_KEY
        if not api_key:
            self.stdout.write(self.style.ERROR("OPENWEATHER_API_KEY is not configured in Django settings."))
            return

        warnings_sent_count = 0

        for farm in farms:
            # Prevent double alerting on the same day
            already_warned = ClimateAlert.objects.filter(
                phone_number=farm.phone_number,
                created_at__date=date.today()
            ).exists()

            if already_warned:
                self.stdout.write(f"Skipping {farm.phone_number} — already sent warning today.")
                continue

            self.stdout.write(f"Checking weather for {farm.crop_type} in {farm.state} (Phone: {farm.phone_number})...")

            result = run_agroguard(
                crop_type=farm.crop_type,
                state=farm.state,
                growth_stage=farm.growth_stage,
                language=farm.language,
                api_key=api_key,
                soil_type=farm.soil_type or 'Loamy'
            )

            if 'error' in result:
                self.stdout.write(self.style.WARNING(f"Could not fetch weather for {farm.state}: {result['error']}"))
                continue

            risk_cat = result.get('risk_category', 'Low Risk')
            risk_score = result.get('risk_score', 0)
            forecast_3day = result.get('short_forecast', '')

            # We warn on High Risk, or if there's an extreme alert (heat_alert/drought_alert/flood_alert)
            has_extreme_weather = False
            extreme_messages = []
            for alert in result.get('alerts', []):
                # Filter out passive warnings
                if not any(skip in alert for skip in ('No major', 'No bad weather', 'no alerts')):
                    has_extreme_weather = True
                    extreme_messages.append(alert)

            if risk_cat == 'High Risk' or has_extreme_weather:
                self.stdout.write(self.style.SUCCESS(f"Danger detected for {farm.phone_number}! Category: {risk_cat}"))
                
                # Create the ClimateAlert record for insurance
                alert_record = ClimateAlert.objects.create(
                    phone_number=farm.phone_number,
                    state=farm.state,
                    crop_type=farm.crop_type,
                    risk_level=risk_cat,
                    risk_score=risk_score,
                    forecast=forecast_3day,
                    warning_sent=False
                )

                # Format the localized message
                language = farm.language
                template = EARLY_WARNING.get(language, EARLY_WARNING['english'])
                warning_msg = template.format(state=farm.state, ref=f"AGR-{alert_record.id:05d}")

                # Append any active extreme weather alerts (e.g. Heat stress details)
                if extreme_messages:
                    warning_msg += "\nDetails: " + " ".join(extreme_messages)

                # Dispatch
                response = send_sms(farm.phone_number, warning_msg)
                
                # If dispatched successfully
                if response is not None and response.status_code == 201:
                    alert_record.warning_sent = True
                    alert_record.save(update_fields=['warning_sent'])
                elif getattr(settings, 'AT_DEMO_MODE', 'False') == 'True' or response is None:
                    # In sandbox/demo mode, treat as successful for record-keeping
                    alert_record.warning_sent = True
                    alert_record.save(update_fields=['warning_sent'])
                    
                warnings_sent_count += 1
            else:
                self.stdout.write(f"Weather looks safe for {farm.phone_number} (Risk: {risk_score}%).")

        self.stdout.write(self.style.SUCCESS(f"Finished weather scan. Sent {warnings_sent_count} proactive warning(s)."))
