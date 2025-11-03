from django.db.models.signals import post_migrate
from django.dispatch import receiver
from core.models import Message

@receiver(post_migrate)
def create_default_message(sender, **kwargs):
    if sender.name == 'core':
        if not Message.objects.exists():
            Message.objects.create(text="Database working")