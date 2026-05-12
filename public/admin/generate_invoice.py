import os
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas

# --- DATA ---
base_data = {
    "no_invoice": "SHK/280426",
    "pelanggan": "Zain",
    "alamat": "Masjid Jami Bintaro",
    "telepon": "85702557163",
    "event": "Sabtu, 2 Mei 2026",
    "lokasi": "Masjid Jami Bintaro",
    "loading": "2 Mei 2026",
    "catatan": "-",
    "dp_amount": 60000,
    "discount": 0,
    "pph_pct": 0,
    "items": [
        {"nama": "Handie Talkie", "jumlah": 6, "satuan": "Unit", "hari": 1, "harga": 20000},
        {"nama": "Ongkos Kirim",  "jumlah": 1, "satuan": "Km",   "hari": 1, "harga": 100000},
    ]
}

def format_idr(val):
    return f"Rp {val:,.0f}".replace(",", ".")

# --- WATERMARK OVERRIDE (Draws on TOP) ---
class WatermarkCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        canvas.Canvas.__init__(self, *args, **kwargs)
        self.status = base_data["status"]

    def showPage(self):
        # Draw watermark at the very end of page rendering
        self.draw_watermark_foreground()
        canvas.Canvas.showPage(self)

    def draw_watermark_foreground(self):
        if self.status not in ["DP", "Lunas"]:
            return
        self.saveState()
        if self.status == "Lunas":
            self.setFillColor(colors.HexColor("#16A34A"), alpha=0.15)
            text = "LUNAS"
        else:
            self.setFillColor(colors.HexColor("#1A56DB"), alpha=0.15)
            text = "DP"
        self.setFont("Helvetica-Bold", 72)
        self.translate(105*mm, 148*mm)
        self.rotate(45)
        self.drawCentredString(0, 0, text)
        self.restoreState()

def generate_invoice(status, filename):
    base_data["status"] = status
    invoice_data = base_data.copy()
    output_path = f"outputs/{filename}"
    
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        rightMargin=18*mm,
        leftMargin=18*mm,
        topMargin=14*mm,
        bottomMargin=18*mm
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle('T', parent=styles['Normal'], fontSize=24, textColor=colors.HexColor("#1A56DB"), alignment=2)
    company_style = ParagraphStyle('C', parent=styles['Normal'], fontSize=12, fontName='Helvetica-Bold')
    label_style = ParagraphStyle('L', parent=styles['Normal'], fontSize=9, textColor=colors.HexColor("#6B7280"))

    content = []
    
    # Header
    logo_path = "SewaHtKu.png"
    logo = ""
    if os.path.exists(logo_path):
        logo = Image(logo_path, width=14*mm, height=14*mm)
    
    header = Table([[logo, [Paragraph("Sewa HT KU", company_style), 
                           Paragraph("Griya Satria Jingga E2/21 RT003/014 Ragajaya, Citayam", styles['Normal']),
                           Paragraph("083195474510 | 083807961536", styles['Normal'])],
                     Paragraph("INVOICE", title_style)]], colWidths=[20*mm, 100*mm, 54*mm])
    header.setStyle(TableStyle([('VALIGN', (0,0), (-1,-1), 'TOP')]))
    content.append(header)
    content.append(Spacer(1, 2*mm))
    content.append(Table([[""]], colWidths=[174*mm], rowHeights=[1*mm], style=[('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#1A56DB"))]))
    content.append(Spacer(1, 6*mm))

    # Billing
    status_color = colors.HexColor("#1A56DB") if status == "DP" else colors.HexColor("#16A34A")
    billing = Table([
        [Paragraph("Kepada Yth:", label_style), Paragraph("No. Invoice", label_style), f": {invoice_data['no_invoice']}"],
        [Paragraph(f"<b>{invoice_data['pelanggan']}</b>", styles['Normal']), Paragraph("Status", label_style), Paragraph(f": <font color='{status_color}'><b>{status}</b></font>", styles['Normal'])],
        [invoice_data['alamat'], Paragraph("Event", label_style), f": {invoice_data['event']}"],
        [invoice_data['telepon'], Paragraph("Lokasi", label_style), f": {invoice_data['lokasi']}"],
        ["", Paragraph("Loading", label_style), f": {invoice_data['loading']}"]
    ], colWidths=[87*mm, 27*mm, 60*mm])
    content.append(billing)
    content.append(Spacer(1, 8*mm))

    # Table
    data = [["No", "Nama Produk", "Jumlah", "Satuan", "Hari", "Harga Sewa", "Total Harga"]]
    total_sewa = 0
    for i, item in enumerate(invoice_data['items'], 1):
        t = item['harga'] * item['jumlah'] * item['hari']
        total_sewa += t
        data.append([i, item['nama'], item['jumlah'], item['satuan'], item['hari'], format_idr(item['harga']), format_idr(t)])
    for _ in range(8): data.append([""]*7)

    t = Table(data, colWidths=[10*mm, 60*mm, 18*mm, 18*mm, 12*mm, 28*mm, 28*mm])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#1A56DB")),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E5E7EB")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#F3F4F6")]),
        ('ALIGN', (5,0), (6,-1), 'RIGHT'),
        ('ALIGN', (0,0), (4,-1), 'CENTER'),
        ('FONTSIZE', (0,0), (-1,-1), 9),
    ]))
    content.append(t)
    content.append(Spacer(1, 4*mm))

    # Summary
    disc = (invoice_data['discount']/100)*total_sewa
    sub = total_sewa - disc
    pph = (invoice_data['pph_pct']/100)*sub
    grand = sub - pph
    summary = Table([
        [Paragraph(f"<b>Catatan:</b><br/>{invoice_data['catatan']}", styles['Normal']), "Total", format_idr(total_sewa)],
        ["", "Discount", format_idr(disc)],
        [Paragraph(f"<b>DP: {format_idr(invoice_data['dp_amount'])}</b>", styles['Normal']), "Total PPN", format_idr(sub)],
        ["", "PPh", format_idr(pph)],
        ["", Paragraph("<b>Grand Total</b>", styles['Normal']), Paragraph(f"<b>{format_idr(grand)}</b>", styles['Normal'])]
    ], colWidths=[118*mm, 28*mm, 28*mm])
    summary.setStyle(TableStyle([
        ('ALIGN', (1,0), (2,-1), 'RIGHT'),
        ('GRID', (1,0), (2,-1), 0.5, colors.HexColor("#E5E7EB")),
        ('BACKGROUND', (1,4), (2,4), colors.HexColor("#1A56DB")),
        ('TEXTCOLOR', (1,4), (2,4), colors.white),
        ('FONTSIZE', (1,0), (2,-1), 9),
    ]))
    content.append(summary)
    content.append(Spacer(1, 10*mm))

    # Payment
    proc = """<b>Prosedur Pembayaran:</b><br/>1. Tahap 1: DP Minimal 50%<br/>2. Tahap 2: Pelunasan 100%<br/>3. Biaya ongkir sesuai kesepakatan.<br/>4. BRI: 053801085867505 a.n Januba Arifah"""
    footer = Table([[Paragraph(proc, styles['Normal']), Paragraph("Hormat kami,<br/><br/><br/><b>Januba Arifah</b><br/>Sewa HT KU", styles['Normal'])]], colWidths=[120*mm, 54*mm])
    content.append(footer)
    
    content.append(Spacer(1, 10*mm))
    content.append(Table([[""]], colWidths=[174*mm], rowHeights=[0.2*mm], style=[('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#1A56DB"))]))
    
    footer_style = ParagraphStyle('Footer', parent=styles['Normal'], fontSize=7, textColor=colors.HexColor("#6B7280"), alignment=1)
    content.append(Paragraph("Terima kasih atas kepercayaan Anda menggunakan layanan Sewa HT KU", footer_style))

    # BUILD WITH CUSTOM CANVAS
    doc.build(content, canvasmaker=WatermarkCanvas)
    print(f"Generated: {output_path}")

if __name__ == "__main__":
    os.makedirs("outputs", exist_ok=True)
    generate_invoice("DP", "Invoice_SewaHTKU_DP.pdf")
    generate_invoice("Lunas", "Invoice_SewaHTKU_Lunas.pdf")
