from django.urls import path
from . import views

app_name = 'books'

urlpatterns = [
    path('submit/', views.submit_book, name='submit_book'),
    path('admin/submissions/', views.admin_submissions, name='admin_submissions'),
    path('admin/edit/<int:submission_id>/', views.edit_submission, name='edit_submission'),
    path('admin/approve/<int:submission_id>/', views.approve_submission, name='approve_submission'),
    path('admin/reject/<int:submission_id>/', views.reject_submission, name='reject_submission'),
    path('top/', views.top_books, name='top_books'),
    path('book/<int:book_id>/', views.book_detail, name='book_detail'),
    path('book/<int:book_id>/review/', views.add_review, name='add_review'),
    # path('book/<int:book_id>/review/delete/', views.delete_rating, name='delete_review'),
    path('book/<int:book_id>/favorite/', views.toggle_favorite, name='toggle_favorite'),
    # Новые URL для отдельного удаления
    path('book/<int:book_id>/delete-rating/', views.delete_rating, name='delete_rating'),

    path('book/<int:book_id>/delete-comment/', views.delete_comment, name='delete_comment'),
]