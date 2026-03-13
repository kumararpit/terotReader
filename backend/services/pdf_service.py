import os
import logging
import tempfile
import time
from datetime import datetime
from jinja2 import Environment, FileSystemLoader
from weasyprint import HTML, CSS
from pathlib import Path
from .logger import mask_pii

logger = logging.getLogger(__name__)

# Absolute paths
BASE_DIR = Path(__file__).resolve().parent.parent
TEMPLATES_DIR = BASE_DIR / "templates"
STATIC_DIR = BASE_DIR / "static"

# Jinja2 Environment
env = Environment(loader=FileSystemLoader(str(TEMPLATES_DIR)))

# ── WeasyPrint page CSS ───────────────────────────────────────────────────────
# A4 at 96 dpi = 794px wide. We use a custom wider page so our 760px container
# fits with comfortable margins and nothing gets clipped.
PAGE_CSS = CSS(string="""
    @page {
        size: 210mm 297mm;   /* A4 */
        margin: 12mm 10mm;   /* top/bottom 12mm, left/right 10mm */
    }
    body {
        margin: 0;
        padding: 0;
        background: #f0eeee;
    }
""")


def generate_pdf(template_name: str, context: dict, output_filename: str, output_dir: str = None) -> str:
    """
    Renders an HTML template with context and converts it to PDF using WeasyPrint.
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

        # Add static_dir to context for template
        context["static_dir"] = str(STATIC_DIR)

        template = env.get_template(template_name)
        html_content = template.render(context)

        # Output path
        actual_output_dir = output_dir or tempfile.gettempdir()
        if not os.path.exists(actual_output_dir):
            os.makedirs(actual_output_dir, exist_ok=True)
        output_path = os.path.join(actual_output_dir, output_filename)

        # Generate PDF — presentational_hints=True makes WeasyPrint honour
        # inline SVG presentation attributes (fill, stroke, stroke-width etc.)
        HTML(string=html_content, base_url=str(BASE_DIR)).write_pdf(
            output_path,
            stylesheets=[PAGE_CSS],
            presentational_hints=True,
        )

        duration = (time.time() - start_time) * 1000
        logger.info(f"Action=generate_pdf Status=finished Template={template_name} Output={output_path} Duration={duration:.2f}ms")
        return output_path

    except Exception as e:
        duration = (time.time() - start_time) * 1000
        logger.error(f"Action=generate_pdf Status=failed Template={template_name} Error={str(e)} Duration={duration:.2f}ms", exc_info=True)
        raise


def generate_invoice_pdf_v2(booking: dict, payment_info: dict = None, output_dir: str = None) -> str:
    """Generates an Invoice PDF."""
    booking_id = booking.get('booking_id', 'unknown')
    logger.debug(f"Action=generate_invoice_pdf_v2 Status=started BookingID={booking_id}")

    context = {
        **booking,
        "payment_info": payment_info or {},
        "is_emergency": booking.get('is_emergency', False),
        "now": datetime.now().strftime("%Y-%m-%d"),
        "booking_id": booking_id,
    }

    if "service_name" not in context:
        raw_service = booking.get('service_type', '')
        context["service_name"] = raw_service.replace('-', ' ').title()

    filename = f"invoice_{booking_id}.pdf"
    return generate_pdf("invoice.html", context, filename, output_dir=output_dir)


def generate_booking_details_pdf_v2(service_template: str, booking: dict, output_dir: str = None) -> str:
    """Generates a Service-Specific Booking Details PDF."""
    booking_id = booking.get('booking_id', 'unknown')
    logger.debug(f"Action=generate_booking_details_pdf_v2 Status=started BookingID={booking_id} Template={service_template}")

    context = {
        **booking,
        "now": datetime.now().strftime("%Y-%m-%d"),
        "booking_id": booking_id,
    }

    # Handle Aura Image Base64 if applicable
    if booking.get('aura_image') and 'aura' in service_template:
        aura_data = booking.get('aura_image')
        if aura_data.startswith('data:image'):
            _, encoded = aura_data.split(",", 1)
            context["aura_image"] = encoded

    filename = f"details_{booking_id}.pdf"
    return generate_pdf(service_template, context, filename, output_dir=output_dir)