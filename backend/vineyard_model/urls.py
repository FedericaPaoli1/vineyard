from django.urls import path
from .views import SimulationView

urlpatterns = [
    path('api/v1/simulate/', SimulationView.as_view(), name='simulate'),
]