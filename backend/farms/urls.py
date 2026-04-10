from django.urls import path
from .views import FarmLocationView

urlpatterns = [
    path("location/", FarmLocationView.as_view(), name="farm-location"),
]