from rest_framework import serializers
from .models import FarmLocation


class FarmLocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = FarmLocation
        fields = ["id", "latitude", "longitude", "address", "full_address", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]