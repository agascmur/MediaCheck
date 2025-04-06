from django import template
from django.urls import reverse

register = template.Library()

@register.simple_tag
def media_url(view_name, *args, **kwargs):
    """
    Automatically adds the 'media:' namespace to the URL name.
    Usage: {% media_url 'view_name' arg1 arg2 kwarg1=value1 %}
    """
    return reverse(f'media:{view_name}', args=args, kwargs=kwargs)

@register.simple_tag
def media_url_with_next(view_name, next_url, *args, **kwargs):
    """
    Creates a URL with the media namespace and adds a next parameter.
    Usage: {% media_url_with_next 'view_name' request.path arg1 arg2 kwarg1=value1 %}
    """
    url = reverse(f'media:{view_name}', args=args, kwargs=kwargs)
    return f"{url}?next={next_url}" 