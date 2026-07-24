from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from .models import EventHistory


class VineyardModelTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = reverse('simulate')

    def test_no_events_generated(self):
        payload = {"doy": 126, "temperature": 10.0, "bagnatura": 0, "humidity": 50.0, "rain": 0.0}
        response = self.client.post(self.url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['events']), 0)

    def test_event_created_successfully(self):
        payload = {"doy": 126, "temperature": 15.94, "bagnatura": 1, "humidity": 97.25, "rain": 10.0}
        response = self.client.post(self.url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['events']), 1)
        self.assertEqual(response.data['events'][0]['index'], 0)
        self.assertEqual(response.data['events'][0]['X'], 0.0)

    def test_event_evolution_and_cap_limit(self):
        payload = {
            "doy": 127, "temperature": 10.0, "bagnatura": 0, "humidity": 50.0, "rain": 0.0,
            "events": [{"index": 0, "X": 0.9}]
        }
        response = self.client.post(self.url, payload, format='json')
        x_result = response.data['events'][0]['X']

        self.assertGreater(x_result, 0.9)
        self.assertLessEqual(x_result, 1.0)

        payload_matured = {
            "doy": 128, "temperature": 10.0, "bagnatura": 0, "humidity": 50.0, "rain": 0.0,
            "events": [{"index": 0, "X": 1.0}]
        }
        response_matured = self.client.post(self.url, payload_matured, format='json')
        self.assertEqual(response_matured.data['events'][0]['X'], 1.0)

    def test_multi_day_and_db_persistence(self):
        payload = [
            {"doy": 275, "temperature": 30.0, "bagnatura": 0, "humidity": 32.0, "rain": 0.0,
             "events": [{"index": 0, "X": 0.7}]},
            {"doy": 276, "temperature": 28.0, "bagnatura": 0, "humidity": 30.0, "rain": 0.0}
        ]
        response = self.client.post(self.url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(EventHistory.objects.count(), 2)