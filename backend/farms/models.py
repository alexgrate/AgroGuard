from django.db import models
from django.conf import settings


class FarmLocation(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="farm_location",
    )
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    address = models.CharField(max_length=512)         
    full_address = models.TextField(blank=True)        

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Farm Location"
        verbose_name_plural = "Farm Locations"

    def __str__(self):
        return f"{self.user} — {self.address}"
    

class FarmProfile(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True)
    phone_number = models.CharField(max_length=20, unique=True, null=True, blank=True)
    
    state = models.CharField(max_length=100)
    crop_type = models.CharField(max_length=100)
    growth_stage = models.CharField(max_length=100)
    language = models.CharField(max_length=50, default='english')
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    soil_type = models.CharField(max_length=100, null=True, blank=True)
    last_field_status = models.CharField(max_length=100, null=True, blank=True)

    
    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "AgroGuard Farm Profile"
        verbose_name_plural = "AgroGuard Farm Profiles"

    def __str__(self):
        identifier = self.phone_number if self.phone_number else self.user.username
        return f"{identifier} — {self.crop_type} ({self.state})"

class PestReport(models.Model):
    phone_number = models.CharField(max_length=20)
    state = models.CharField(max_length=100)
    crop_type = models.CharField(max_length=100)
    symptom_choice = models.CharField(max_length=10)
    severity = models.CharField(max_length=100, blank=True)
    detected_pest = models.CharField(max_length=100, blank=True)
    language = models.CharField(max_length=50, default='english')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.detected_pest} alert in {self.state}"