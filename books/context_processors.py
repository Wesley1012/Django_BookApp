from .models import BookSubmission

def pending_submissions_count(request):
    if request.user.is_staff:
        count = BookSubmission.objects.filter(status='pending').count()
        return {'pending_submissions_count': count}
    return {'pending_submissions_count': 0}