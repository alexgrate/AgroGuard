from django.views.decorators.csrf import csrf_exempt
from django.http import HttpResponse
from .session_handler import handle_session

@csrf_exempt
def ussd_callback(request):
    if request.method == 'POST':
        session_id = request.POST.get('sessionId')
        phone_number = request.POST.get('phoneNumber')
        text = request.POST.get('text', '')

        response = handle_session(session_id, phone_number, text)
        return HttpResponse(response, content_type='text/plain')