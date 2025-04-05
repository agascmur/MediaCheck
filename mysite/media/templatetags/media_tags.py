from django import template

register = template.Library()

@register.filter
def get_item(dictionary, key):
    """Get an item from a dictionary using a key."""
    return dictionary.get(key)

@register.filter
def filter_by_user(queryset, user):
    """Filter a UserMedia queryset by user and return the first match."""
    return queryset.filter(user=user).first() 