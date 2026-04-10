from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from .models import FarmLocation
from .serializers import FarmLocationSerializer


class FarmLocationView(APIView):
    """
    GET  /api/farms/location/  — retrieve the current user's saved location
    POST /api/farms/location/  — create or update the current user's location
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            location = FarmLocation.objects.get(user=request.user)
            serializer = FarmLocationSerializer(location)
            return Response(serializer.data)
        except FarmLocation.DoesNotExist:
            return Response({"detail": "No location saved yet."}, status=status.HTTP_404_NOT_FOUND)

    def post(self, request):
        # Use update_or_create so the user can change their location later
        location, created = FarmLocation.objects.update_or_create(
            user=request.user,
            defaults={
                "latitude": request.data.get("latitude"),
                "longitude": request.data.get("longitude"),
                "address": request.data.get("address", ""),
                "full_address": request.data.get("full_address", ""),
            },
        )
        serializer = FarmLocationSerializer(location)
        http_status = status.HTTP_201_CREATED if created else status.HTTP_200_OK
        return Response(serializer.data, status=http_status)