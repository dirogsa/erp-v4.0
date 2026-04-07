import { numberToWords } from './numberToWords';

export const generateQuotationPDF = async (order, items, mode = 'download') => {
    // We use the global instance from index.html (CDN)
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
    });

    // --- CONFIGURATION ---
    const primaryColor = [15, 23, 42]; // Slate-900 (Professional/Industrial)
    const accentColor = [99, 102, 241]; // Indigo-500
    const textColor = [30, 41, 59]; // Slate-800
    const lightText = [100, 116, 139]; // Slate-500
    
    const companyInfo = {
        name: "ROJAS GARCIA JEEF GELDER",
        ruc: "10434346318",
        address: "CAL.JOSE ORENGO NRO. 850 URB. EL TREBOL LIMA - LIMA - SAN LUIS",
        phone: "+5114742827",
        bank: "BCP",
        soles: "193-15439649-0-03",
        dollars: "193-18003034-1-82"
    };

    // --- 1. HEADER (TWO COLUMNS) ---
    
    // Left: Company Profile
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(companyInfo.name, 15, 20);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(lightText[0], lightText[1], lightText[2]);
    doc.text(companyInfo.address, 15, 25);
    doc.text(`Teléfono: ${companyInfo.phone}`, 15, 29);
    
    // Bank Details on Header
    doc.setFont('helvetica', 'bold');
    doc.text(`CUENTAS ${companyInfo.bank}:`, 15, 34);
    doc.setFont('helvetica', 'normal');
    doc.text(`Soles: ${companyInfo.soles}`, 15, 38);
    doc.text(`Dólares: ${companyInfo.dollars}`, 15, 42);

    // Right: Document Box
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(0.5);
    doc.rect(135, 10, 60, 25); // Box x, y, w, h
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(`R.U.C. ${companyInfo.ruc}`, 165, 17, { align: 'center' });
    
    // Filled bar for Type
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(135.2, 19, 59.6, 7, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text('COTIZACIÓN', 165, 24, { align: 'center' });
    
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFontSize(14);
    doc.text(`N° ${order.quote_number || order.number || '000-000'}`, 165, 32, { align: 'center' });

    // --- 2. CUSTOMER INFO ---
    doc.setDrawColor(226, 232, 240); // Slate-200
    doc.line(15, 50, 195, 50); // Separator Line
    
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.setFontSize(9);
    
    // Customer Row 1
    doc.setFont('helvetica', 'bold');
    doc.text('CLIENTE:', 15, 58);
    doc.setFont('helvetica', 'normal');
    doc.text(order.customer_name || 'CLIENTE GENERAL', 40, 58);
    
    doc.setFont('helvetica', 'bold');
    doc.text('FECHA EMISIÓN:', 140, 58);
    doc.setFont('helvetica', 'normal');
    doc.text(new Date(order.date || Date.now()).toLocaleDateString(), 170, 58);
    
    // Customer Row 2
    doc.setFont('helvetica', 'bold');
    doc.text('R.U.C. / D.N.I.:', 15, 63);
    doc.setFont('helvetica', 'normal');
    doc.text(order.customer_ruc || 'S/N', 40, 63);
    
    doc.setFont('helvetica', 'bold');
    doc.text('MONEDA:', 140, 63);
    doc.setFont('helvetica', 'normal');
    doc.text('SOLES (PEN)', 170, 63);

    // Customer Row 3 (Address)
    doc.setFont('helvetica', 'bold');
    doc.text('DIRECCIÓN:', 15, 68);
    doc.setFont('helvetica', 'normal');
    doc.text(order.delivery_address || '---', 40, 68);

    // --- 3. ITEMS TABLE ---
    const tableData = items.map(item => [
        item.quantity || 0,
        item.product_sku || item.sku || '---',
        (item.product_name || item.name || '---').toUpperCase(),
        `S/ ${(item.unit_price || item.price || 0).toFixed(2)}`,
        `S/ ${((item.quantity || 0) * (item.unit_price || item.price || 0)).toFixed(2)}`
    ]);

    doc.autoTable({
        startY: 75,
        head: [['CANT', 'CÓDIGO / SKU', 'DESCRIPCIÓN DEL PRODUCTO', 'P. UNIT', 'SUBTOTAL']],
        body: tableData,
        theme: 'plain',
        headStyles: { 
            fillColor: [241, 245, 249], // Slate-100
            textColor: primaryColor, 
            fontStyle: 'bold', 
            lineWidth: 0.1, 
            lineColor: [203, 213, 225],
            fontSize: 8
        },
        styles: { 
            fontSize: 8.5, 
            cellPadding: 3, 
            textColor: textColor,
            lineWidth: 0.05,
            lineColor: [226, 232, 240]
        },
        columnStyles: {
            0: { halign: 'center', cellWidth: 15 },
            1: { cellWidth: 35 },
            2: { cellWidth: 'auto' },
            3: { halign: 'right', cellWidth: 25 },
            4: { halign: 'right', cellWidth: 25 }
        },
        margin: { left: 15, right: 15 }
    });

    let finalY = doc.lastAutoTable.finalY + 8;

    // --- 4. FOOTER / TOTALS ---
    
    // Amount in Words
    const total = items.reduce((acc, item) => acc + ((item.quantity || 0) * (item.unit_price || item.price || 0)), 0);
    const words = numberToWords(total, 'PEN');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(words, 15, finalY);

    // Totals Box
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(140, finalY - 5, 55, 10);
    doc.setFontSize(10);
    doc.text('TOTAL A PAGAR:', 143, finalY + 1.5);
    doc.text(`S/ ${total.toFixed(2)}`, 192, finalY + 1.5, { align: 'right' });

    // Official Notes
    finalY += 15;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(lightText[0], lightText[1], lightText[2]);
    doc.text('NOTAS Y CONDICIONES:', 15, finalY);
    
    doc.setFontSize(7);
    const notesContent = [
        "- Validez de la cotización: 07 días calendario.",
        "- Los precios incluyen IGV (18%).",
        "- Entrega sujeta a disponibilidad de stock.",
        "- Realizar depósitos únicamente a las cuentas oficiales de la empresa."
    ];
    
    notesContent.forEach((note, i) => {
        doc.text(note, 15, finalY + 4 + (i * 3.5));
    });

    // Small Footer Tag
    doc.setFontSize(6);
    doc.text('Documento generado electrónicamente desde DIROGSA Mobile Dashboard v4.0', 105, 290, { align: 'center' });

    const orderNo = order.quote_number || order.number || '001';

    // OUTPUT MODES
    if (mode === 'share') {
        const blob = doc.output('blob');
        const file = new File([blob], `Cotizacion_${orderNo}.pdf`, { type: 'application/pdf' });
        
        try {
            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: `Cotización ${orderNo}`,
                    text: `Hola, adjunto la cotización oficial de DIROGSA #${orderNo}.`
                });
            } else {
                doc.save(`Cotizacion_${orderNo}.pdf`);
            }
        } catch (err) {
            console.error("Error sharing PDF", err);
            doc.save(`Cotizacion_${orderNo}.pdf`);
        }
    } else {
        doc.save(`Cotizacion_${orderNo}.pdf`);
    }

    return doc;
};
