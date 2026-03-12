def get_template_for_service(service_type: str) -> str:
    """
    Maps service_type to the corresponding Jinja2 template filename.
    """
    mapping = {
        'delivered-3': 'delivered_reading.html',
        'delivered-5': 'delivered_reading.html',
        'live-20': 'live_reading.html',
        'live-40': 'live_reading.html',
        'tiktok-live': 'tiktok_reading.html',
        'aura': 'aura_reading.html'
    }
    
    # Default to a generic reading template if type not found
    return mapping.get(service_type, 'delivered_reading.html')
