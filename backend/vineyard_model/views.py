import random
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction
from .serializers import DailyInputSerializer
from .models import EventHistory


class SimulationView(APIView):
    def post(self, request):
        data = request.data if isinstance(request.data, list) else [request.data]
        serializer = DailyInputSerializer(data=data, many=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        validated_data = serializer.validated_data
        response_data, current_events, max_index, history_records = [], [], -1, []

        for daily_data in validated_data:
            doy = daily_data['doy']
            if 'events' in daily_data:
                current_events = daily_data['events']

            if current_events:
                max_index = max([ev['index'] for ev in current_events])

            new_events = []

            # Evolve existing
            for ev in current_events:
                rule = random.choice(['A', 'B', 'C'])
                if rule == 'A':
                    new_x = ev['X'] + 0.2
                elif rule == 'B':
                    new_x = ev['X'] + (ev['X'] * 0.5) + 0.1
                else:  # rule == 'C'
                    new_x = ev['X'] + (1.0 - ev['X']) * 0.3
                new_events.append({"index": ev['index'], "X": round(min(1.0, new_x), 2)})

            # Create new event
            cond1 = daily_data['bagnatura'] == 1 and daily_data['rain'] > 0
            cond2 = daily_data['bagnatura'] == 1 and daily_data['humidity'] > 80 and daily_data['temperature'] > 15

            if cond1 or cond2:
                max_index += 1
                new_events.append({"index": max_index, "X": 0.0})

            current_events = new_events
            response_data.append({"doy": doy, "events": current_events})

            # Queue DB insertions
            for ev in current_events:
                history_records.append(EventHistory(event_index=ev['index'], target_doy=doy, x_value=ev['X']))

        # Bulk insert
        with transaction.atomic():
            EventHistory.objects.bulk_create(history_records)

        if isinstance(request.data, dict) and len(response_data) == 1:
            return Response(response_data[0], status=status.HTTP_200_OK)
        return Response(response_data, status=status.HTTP_200_OK)
