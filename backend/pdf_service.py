import io
import logging
import os
from datetime import datetime
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image as RLImage
from reportlab.lib.enums import TA_RIGHT, TA_CENTER, TA_LEFT

logger = logging.getLogger(__name__)

# Brand Colors
COLOR_PRIMARY = colors.HexColor("#2d1b4e") # Dark Purple
COLOR_ACCENT = colors.HexColor("#c5a059")  # Gold
COLOR_BG_LIGHT = colors.HexColor("#f8f4ff") # Light Purple Tint
COLOR_TEXT = colors.HexColor("#333333")
COLOR_GREY = colors.HexColor("#888888")

def generate_invoice_pdf(booking: dict, payment_info: dict = None):
    """
    Generates a PDF invoice (Financial Details Only).
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, 
        pagesize=A4,
        rightMargin=20*mm, leftMargin=20*mm, 
        topMargin=20*mm, bottomMargin=20*mm
    )
    elements = []
    
    # --- Data Prep ---
    booking_id = booking.get('booking_id', 'Unknown')
    booking_date = booking.get('created_at', datetime.now().isoformat()).split('T')[0]
    
    amount = booking.get('amount')
    currency = booking.get('currency')
    if payment_info:
        amount = payment_info.get('amount', amount)
        currency = payment_info.get('currency', currency)
    
    amount_str = f"{currency} {amount}"
    
    # Format Service 
    raw_service = booking.get('service_type', '')
    service_display = raw_service.replace('-', ' ').title()
    if raw_service == 'delivered-3':
        service_display = "Delivered Reading (3 Questions)"
    elif raw_service == 'delivered-5':
        service_display = "Delivered Reading (5 Questions)"
    elif raw_service == 'live-20':
        service_display = "Live Reading (20 Mins)"
    elif raw_service == 'live-40':
        service_display = "Live Reading (40 Mins)"
    elif raw_service == 'aura':
        service_display = "Aura Scanning"

    # --- Styles ---
    styles = getSampleStyleSheet()
    style_brand_title = ParagraphStyle('BrandTitle', parent=styles['Heading1'], textColor=COLOR_PRIMARY, fontSize=24, spaceAfter=2, fontName='Helvetica-Bold')
    style_brand_sub = ParagraphStyle('BrandSub', parent=styles['Normal'], textColor=COLOR_ACCENT, fontSize=12, spaceAfter=20)
    style_invoice_meta = ParagraphStyle('InvoiceMeta', parent=styles['Normal'], alignment=TA_RIGHT, fontSize=11, textColor=COLOR_GREY, leading=14)
    style_section_header = ParagraphStyle('SectionHeader', parent=styles['Normal'], textColor=colors.white, backColor=COLOR_PRIMARY, fontSize=12, leading=24, leftIndent=10, fontName='Helvetica-Bold')
    style_label = ParagraphStyle('Label', parent=styles['Normal'], fontSize=9, textColor=COLOR_GREY, textTransform='uppercase')
    style_value = ParagraphStyle('Value', parent=styles['Normal'], fontSize=11, textColor=COLOR_TEXT, spaceAfter=6)
    
    # --- Header Section ---
    brand_text = [
        Paragraph("Tarot with Tejashvini", style_brand_title),
        Paragraph("Intuitive Readings & Aura Scanning", style_brand_sub)
    ]
    
    meta_text = [
        Paragraph("<b>INVOICE</b>", ParagraphStyle('InvTitle', parent=style_invoice_meta, textColor=COLOR_PRIMARY, fontSize=14)),
        Paragraph(f"#{booking_id}", style_invoice_meta),
        Paragraph(f"Date: {booking_date}", style_invoice_meta)
    ]
    
    header_table = Table([[brand_text, meta_text]], colWidths=[100*mm, 70*mm])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('LINEBELOW', (0,0), (-1,-1), 2, COLOR_ACCENT),
        ('BOTTOMPADDING', (0,0), (-1,-1), 15),
    ]))
    elements.append(header_table)
    elements.append(Spacer(1, 15*mm))

    # --- Bill To Section ---
    elements.append(Paragraph("Bill To:", style_label))
    elements.append(Paragraph(booking.get('full_name', 'N/A'), ParagraphStyle('BillName', parent=style_value, fontName='Helvetica-Bold', fontSize=12)))
    elements.append(Paragraph(booking.get('email', 'N/A'), style_value))
    elements.append(Paragraph(booking.get('phone', 'N/A'), style_value))
    elements.append(Spacer(1, 10*mm))

    # --- Payment Section ---
    p_header_table = Table([[
        Paragraph("Payment Details", style_section_header),
        Paragraph('<font color="#166534"><b>PAID</b></font>', ParagraphStyle('Paid', alignment=TA_RIGHT, fontSize=12, backColor=colors.HexColor("#dcfce7"), padding=3))
    ]], colWidths=[130*mm, 40*mm])
    p_header_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ALIGN', (1,0), (1,0), 'RIGHT'),
    ]))
    elements.append(p_header_table)
    elements.append(Spacer(1, 5*mm))
    
    # Invoice Line Items
    inv_data = [
        ["Description", "Type", "Amount"],
        [f"{service_display}\n(Consultation Services)", "Service", amount_str]
    ]
    if booking.get('is_emergency'):
         inv_data.append(["Priority Fee (Emergency)", "Fee", "Included"])
         
    inv_table = Table(inv_data, colWidths=[100*mm, 30*mm, 40*mm])
    inv_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), COLOR_BG_LIGHT),
        ('TEXTCOLOR', (0,0), (-1,0), COLOR_PRIMARY),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0,0), (-1,0), 8),
        ('TOPPADDING', (0,0), (-1,0), 8),
        ('ALIGN', (2,0), (2,-1), 'RIGHT'), 
        ('LINEBELOW', (0,0), (-1,0), 1, colors.lightgrey),
        ('LINEBELOW', (0,1), (-1,-1), 1, colors.whitesmoke),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('FONTNAME', (0,1), (0,-1), 'Helvetica-Bold'),
    ]))
    elements.append(inv_table)
    
    # --- Totals ---
    total_data = [
        ["Subtotal:", amount_str],
        ["Tax (0%):", f"{currency} 0.00"],
        ["TOTAL:", amount_str]
    ]
    total_table = Table(total_data, colWidths=[30*mm, 30*mm])
    total_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'RIGHT'),
        ('LINEABOVE', (0,-1), (-1,-1), 2, COLOR_ACCENT), 
        ('FONTNAME', (0,-1), (-1,-1), 'Helvetica-Bold'),
        ('TEXTCOLOR', (0,-1), (-1,-1), COLOR_PRIMARY),
        ('FONTSIZE', (0,-1), (-1,-1), 12),
        ('TOPPADDING', (0,-1), (-1,-1), 10),
    ]))
    
    layout_table = Table([[ "", total_table]], colWidths=[110*mm, 60*mm])
    elements.append(layout_table)
    elements.append(Spacer(1, 20*mm))
    
    # --- Footer ---
    footer_style = ParagraphStyle('Footer', parent=styles['Normal'], alignment=TA_CENTER, textColor=COLOR_GREY, fontSize=8)
    elements.append(Paragraph("Thank you for choosing Tarot with Tejashvini.", footer_style))
    elements.append(Paragraph("This is a computer-generated document. No signature is required.", footer_style))
    elements.append(Paragraph("www.tarotwithtejashvini.com | support@tarotwithtejashvini.com", footer_style))

    doc.build(elements)
    buffer.seek(0)
    return buffer.read()

def generate_booking_details_pdf(booking: dict):
    """
    Generates a PDF containing all submitted booking form details.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, 
        pagesize=A4,
        rightMargin=20*mm, leftMargin=20*mm, 
        topMargin=20*mm, bottomMargin=20*mm
    )
    elements = []
    
    styles = getSampleStyleSheet()
    style_brand_title = ParagraphStyle('BrandTitle', parent=styles['Heading1'], textColor=COLOR_PRIMARY, fontSize=24, spaceAfter=2, fontName='Helvetica-Bold')
    style_section_header = ParagraphStyle('SectionHeader', parent=styles['Normal'], textColor=colors.white, backColor=COLOR_PRIMARY, fontSize=12, leading=24, leftIndent=10, fontName='Helvetica-Bold', spaceAfter=10)
    style_label = ParagraphStyle('Label', parent=styles['Normal'], fontSize=8, textColor=COLOR_GREY, textTransform='uppercase', spaceAfter=2)
    style_value = ParagraphStyle('Value', parent=styles['Normal'], fontSize=10, textColor=COLOR_TEXT, leading=14)
    
    # --- Header Section (Unified Style) ---
    brand_text = [
        Paragraph("Tarot with Tejashvini", style_brand_title),
        Paragraph("Intuitive Readings & Aura Scanning", ParagraphStyle('BrandSub', parent=styles['Normal'], textColor=COLOR_ACCENT, fontSize=12, spaceAfter=20))
    ]
    
    meta_text = [
        Paragraph("<b>BOOKING DETAILS</b>", ParagraphStyle('DocTitle', parent=styles['Normal'], alignment=TA_RIGHT, textColor=COLOR_PRIMARY, fontSize=14, leading=16)),
        Paragraph(f"Ref: {booking.get('booking_id', 'N/A')}", ParagraphStyle('DocMeta', parent=styles['Normal'], alignment=TA_RIGHT, fontSize=10, textColor=COLOR_GREY, leading=14)),
        Paragraph(f"Date: {booking.get('created_at', datetime.now().isoformat()).split('T')[0]}", ParagraphStyle('DocMeta2', parent=styles['Normal'], alignment=TA_RIGHT, fontSize=10, textColor=COLOR_GREY, leading=14))
    ]
    
    header_table = Table([[brand_text, meta_text]], colWidths=[100*mm, 70*mm])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('LINEBELOW', (0,0), (-1,-1), 2, COLOR_ACCENT),
        ('BOTTOMPADDING', (0,0), (-1,-1), 15),
    ]))
    elements.append(header_table)
    elements.append(Spacer(1, 15*mm))

    def create_field_cell(label, value):
        if value is None: value = "-"
        return [
            Paragraph(label, style_label),
            Paragraph(str(value), style_value)
        ]

    # --- Client Profile ---
    elements.append(Paragraph("Client Profile", style_section_header))
    
    # 2 Column Layout
    client_data = [
        [create_field_cell("Full Name", booking.get('full_name')), create_field_cell("Date of Birth", booking.get('date_of_birth'))],
        [create_field_cell("Email Address", booking.get('email')), create_field_cell("Gender", booking.get('gender'))],
    ]
    
    table = Table(client_data, colWidths=[85*mm, 85*mm])
    table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 12),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
    ]))
    elements.append(table)
    elements.append(Spacer(1, 5*mm))

    # --- Session Details ---
    elements.append(Paragraph("Session Information", style_section_header))
    
    session_data = [
        [create_field_cell("Service Type", booking.get('service_type')), create_field_cell("Requested Date", booking.get('preferred_date'))],
        [create_field_cell("Reading Focus", booking.get('reading_focus')), create_field_cell("Requested Time", booking.get('preferred_time'))],
        [create_field_cell("Priority Status", "Emergency" if booking.get('is_emergency') else "Standard"), ""]
    ]
    
    session_table = Table(session_data, colWidths=[85*mm, 85*mm])
    session_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 12),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
    ]))
    elements.append(session_table)
    elements.append(Spacer(1, 5*mm))
    
    # --- Partner Details ---
    if booking.get('partner_name') or booking.get('partner_dob'):
        elements.append(Paragraph("Partner / Subject Details", style_section_header))
        partner_data = [
            [create_field_cell("Partner Name", booking.get('partner_name')), create_field_cell("Partner DOB", booking.get('partner_dob'))]
        ]
        p_table = Table(partner_data, colWidths=[85*mm, 85*mm])
        p_table.setStyle(TableStyle([
             ('VALIGN', (0,0), (-1,-1), 'TOP'),
             ('BOTTOMPADDING', (0,0), (-1,-1), 12),
             ('LEFTPADDING', (0,0), (-1,-1), 10),
        ]))
        elements.append(p_table)
        elements.append(Spacer(1, 5*mm))
        
    # --- Reading Content (Full Width) ---
    elements.append(Paragraph("Reading Content", style_section_header))
    
    elements.append(Paragraph("Specific Questions", style_label))
    elements.append(Paragraph(booking.get('questions', 'N/A'), ParagraphStyle('Boxed', parent=style_value, backColor=colors.whitesmoke, borderWidth=0, padding=10, leading=14)))
    elements.append(Spacer(1, 5*mm))
    
    elements.append(Paragraph("Situation / Story", style_label))
    elements.append(Paragraph(booking.get('situation_description', 'N/A'), ParagraphStyle('Boxed', parent=style_value, backColor=colors.whitesmoke, borderWidth=0, padding=10, leading=14)))

    doc.build(elements)
    buffer.seek(0)
    return buffer.read()
