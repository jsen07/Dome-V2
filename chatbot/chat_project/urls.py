from django.contrib import admin
from django.urls import path, include  # include is used to reference the chatbot's URLs

urlpatterns = [
    path('api/', include('chatbot.urls')),  # Include chatbot app URLs
    path('admin/', admin.site.urls)
]
