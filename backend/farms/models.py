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
    address = models.CharField(max_length=512)          # Short readable address
    full_address = models.TextField(blank=True)         # Full Nominatim display_name

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Farm Location"
        verbose_name_plural = "Farm Locations"

    def __str__(self):
        return f"{self.user} — {self.address}"