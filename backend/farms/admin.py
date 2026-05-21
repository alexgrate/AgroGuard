# farms/admin.py
from django.contrib import admin, messages
from .models import FarmLocation, FarmProfile, PestReport, ClimateAlert


@admin.register(FarmLocation)
class FarmLocationAdmin(admin.ModelAdmin):
    list_display  = ('user', 'address', 'created_at')
    search_fields = ('user__username', 'address')


@admin.register(FarmProfile)
class FarmProfileAdmin(admin.ModelAdmin):
    list_display    = ('phone_number', 'crop_type', 'state', 'language', 'last_updated')
    search_fields   = ('phone_number', 'state')
    list_filter     = ('crop_type', 'state', 'language')
    readonly_fields = ('last_updated',)


@admin.register(PestReport)
class PestReportAdmin(admin.ModelAdmin):
    list_display  = ('detected_pest', 'crop_type', 'state', 'phone_number', 'language', 'created_at')
    search_fields = ('phone_number', 'state', 'detected_pest')
    list_filter   = ('crop_type', 'detected_pest', 'state')
    readonly_fields = ('created_at',)


@admin.register(ClimateAlert)
class ClimateAlertAdmin(admin.ModelAdmin):

    list_display    = ('id', 'risk_level', 'crop_type', 'state', 'risk_score', 'warning_sent', 'created_at')
    search_fields   = ('phone_number', 'state', 'crop_type')
    list_filter     = ('risk_level', 'state', 'crop_type', 'warning_sent')
    readonly_fields = ('created_at',)
    ordering        = ('-created_at',)

    def get_queryset(self, request):
        return super().get_queryset(request).select_related()