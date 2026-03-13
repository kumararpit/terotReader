import os
import logging
import tempfile
import time
from datetime import datetime
from jinja2 import Environment, FileSystemLoader
from playwright.sync_api import sync_playwright
from pathlib import Path
from .logger import mask_pii

logger = logging.getLogger(__name__)

# Absolute paths
BASE_DIR = Path(__file__).resolve().parent.parent
TEMPLATES_DIR = BASE_DIR / "templates"
STATIC_DIR = BASE_DIR / "static"

# Jinja2 Environment
env = Environment(loader=FileSystemLoader(str(TEMPLATES_DIR)))

def generate_pdf(template_name: str, context: dict, output_filename: str, output_dir: str = None) -> str:
    """
    Renders an HTML template with context and converts it to PDF using Playwright.
    Returns the absolute path to the generated PDF.
    """
    masked_email = mask_pii(context.get('email', ''))
    logger.info(f"Action=generate_pdf Status=started Template={template_name} To={masked_email}")
    
    start_time = time.time()
    try:
        # Inject local base64 header image into context
        header_img_path = STATIC_DIR / "baseimgheader.png"
        if header_img_path.exists() and "header_image" not in context:
            import base64
            with open(header_img_path, "rb") as f:
                b64 = base64.b64encode(f.read()).decode('utf-8')
                context["header_image"] = f"data:image/png;base64,{b64}"
                
        template = env.get_template(template_name)
        html_content = template.render(context)
        
        # Create a temporary file path
        actual_output_dir = output_dir or tempfile.gettempdir()
        if not os.path.exists(actual_output_dir):
            os.makedirs(actual_output_dir, exist_ok=True)
        output_path = os.path.join(actual_output_dir, output_filename)
        
        with sync_playwright() as p:
            # Launch browser
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            
            # Set content and wait for load
            page.set_content(html_content, wait_until="load")
            
            # Wait for styles/images
            page.wait_for_timeout(1000)
            page.emulate_media(media="screen")
            
            # Generate PDF
            page.pdf(
                path=output_path,
                print_background=True,
                format="A4",
                margin={"top": "0px", "right": "0px", "bottom": "0px", "left": "0px"},
                scale=0.95,
                page_ranges="1"
            )
            
            browser.close()
        
        duration = (time.time() - start_time) * 1000
        logger.info(f"Action=generate_pdf Status=finished Template={template_name} Output={output_path} Duration={duration:.2f}ms")
        return output_path
    except Exception as e:
        duration = (time.time() - start_time) * 1000
        logger.error(f"Action=generate_pdf Status=failed Template={template_name} Error={str(e)} Duration={duration:.2f}ms", exc_info=True)
        raise

def generate_invoice_pdf_v2(booking: dict, payment_info: dict = None, output_dir: str = None) -> str:
    """Generates an Invoice PDF using the Playwright system."""
    booking_id = booking.get('booking_id', 'unknown')
    logger.debug(f"Action=generate_invoice_pdf_v2 Status=started BookingID={booking_id}")
    
    context = {
        **booking,
        "payment_info": payment_info,
        "is_emergency": booking.get('is_emergency', False),
        "now": datetime.now().strftime("%Y-%m-%d"),
        "booking_id": booking_id
    }
    
    if "service_name" not in context:
        raw_service = booking.get('service_type', '')
        context["service_name"] = raw_service.replace('-', ' ').title()

    filename = f"invoice_{booking_id}.pdf"
    return generate_pdf("invoice.html", context, filename, output_dir=output_dir)

def generate_booking_details_pdf_v2(service_template: str, booking: dict, output_dir: str = None) -> str:
    """Generates a Service-Specific Booking Details PDF using Playwright."""
    booking_id = booking.get('booking_id', 'unknown')
    logger.debug(f"Action=generate_booking_details_pdf_v2 Status=started BookingID={booking_id} Template={service_template}")
    
    context = {
        **booking,
        "now": datetime.now().strftime("%Y-%m-%d"),
        "booking_id": booking_id
    }
    
    # Handle Aura Image Base64 if applicable
    if booking.get('aura_image') and 'aura' in service_template:
        aura_data = booking.get('aura_image')
        if aura_data.startswith('data:image'):
            header, encoded = aura_data.split(",", 1)
            context["aura_image"] = encoded
    
    filename = f"details_{booking_id}.pdf"
    return generate_pdf(service_template, context, filename, output_dir=output_dir)