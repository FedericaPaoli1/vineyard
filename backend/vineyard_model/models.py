from django.db import models

class EventHistory(models.Model):
    event_index = models.IntegerField()
    target_doy = models.IntegerField()
    simulation_date = models.DateTimeField(auto_now_add=True)
    x_value = models.FloatField()

    class Meta:
        indexes = [models.Index(fields=['event_index', 'target_doy'])]

    def __str__(self):
        return f"Event {self.event_index} - DOY {self.target_doy} - X: {self.x_value}"