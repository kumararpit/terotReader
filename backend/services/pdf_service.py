import os
import logging
import tempfile
from datetime import datetime
from jinja2 import Environment, FileSystemLoader
from playwright.sync_api import sync_playwright
from pathlib import Path

logger = logging.getLogger(__name__)

# Absolute paths
BASE_DIR = Path(__file__).resolve().parent.parent
TEMPLATES_DIR = BASE_DIR / "templates"
STATIC_DIR = BASE_DIR / "static"

# Jinja2 Environment
env = Environment(loader=FileSystemLoader(str(TEMPLATES_DIR)))

def generate_pdf(template_name: str, context: dict, output_filename: str) -> str:
    """
    Renders an HTML template with context and converts it to PDF using Playwright.
    Returns the absolute path to the generated PDF stored in a temporary directory.
    """
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
        temp_dir = tempfile.gettempdir()
        output_path = os.path.join(temp_dir, output_filename)
        
        with sync_playwright() as p:
            # Launch browser
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            
            # Set content and wait for load (networkidle can hang on CDNs in headless mode)
            page.set_content(html_content, wait_until="load")
            
            # CRUCIAL FIX: Wait an extra 1000ms to ensure Tailwind has fully "painted" the screen
            page.wait_for_timeout(1000)
            
            # CRUCIAL FIX: Force screen media so the browser doesn't strip out Tailwind styles for printing
            page.emulate_media(media="screen")
            
            # Generate PDF with backgrounds enabled, scaled, and restricted to 1 page
            page.pdf(
                path=output_path,
                print_background=True,
                format="A4",
                margin={"top": "0px", "right": "0px", "bottom": "0px", "left": "0px"},
                scale=0.95,          # CRUCIAL FIX: Shrinks content slightly to fit on one page
                page_ranges="1"      # CRUCIAL FIX: Forces the PDF to only render page 1
            )
            
            browser.close()
        
        logger.info(f"PDF generated successfully at: {output_path}")
        return output_path
    except Exception as e:
        logger.error(f"Error generating PDF {template_name} with Playwright: {e}")
        raise

def generate_invoice_pdf_v2(booking: dict, payment_info: dict = None) -> str:
    """
    Generates an Invoice PDF using the Playwright system.
    """
    context = {
        **booking,
        "payment_info": payment_info,
        "is_emergency": booking.get('is_emergency', False),
        "now": datetime.now().strftime("%Y-%m-%d"),
        "booking_id": booking.get('booking_id', 'N/A')
    }
    
    if "service_name" not in context:
        raw_service = booking.get('service_type', '')
        context["service_name"] = raw_service.replace('-', ' ').title()

    filename = f"invoice_{booking.get('booking_id', 'unknown')}.pdf"
    return generate_pdf("invoice.html", context, filename)

def generate_booking_details_pdf_v2(service_template: str, booking: dict) -> str:
    """
    Generates a Service-Specific Booking Details PDF using Playwright.
    """
    context = {
        **booking,
        "now": datetime.now().strftime("%Y-%m-%d"),
        "booking_id": booking.get('booking_id', 'N/A')
    }
    
    # Handle Aura Image Base64 if applicable
    if booking.get('aura_image') and 'aura' in service_template:
        aura_data = booking.get('aura_image')
        if aura_data.startswith('data:image'):
            # Playwright handles data URLs in img tags fine, 
            # but we need to pass the base64 part if the template expects only that.
            # Looking at aura_reading.html: <img src="data:image/png;base64,{{ aura_image }}" ...>
            header, encoded = aura_data.split(",", 1)
            context["aura_image"] = encoded
    
    filename = f"details_{booking.get('booking_id', 'unknown')}.pdf"
    return generate_pdf(service_template, context, filename)