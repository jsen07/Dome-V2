from django.urls import path

from . import views

urlpatterns = [
    path("bot/chat/", views.chatbot_message, name="chatbot_message"),
    path("", views.index, name="index"),
]