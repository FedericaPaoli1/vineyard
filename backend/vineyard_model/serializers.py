from rest_framework import serializers

class EventStateSerializer(serializers.Serializer):
    index = serializers.IntegerField()
    X = serializers.FloatField()

class DailyInputSerializer(serializers.Serializer):
    doy = serializers.IntegerField()
    temperature = serializers.FloatField()
    bagnatura = serializers.IntegerField()
    humidity = serializers.FloatField()
    rain = serializers.FloatField()
    events = EventStateSerializer(many=True, required=False)