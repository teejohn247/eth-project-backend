import PDFDocument from 'pdfkit';

interface TicketData {
  ticketNumber: string;
  ticketType: 'regular' | 'vip' | 'table_of_5' | 'table_of_10';
  firstName: string;
  lastName: string;
  email: string;
  purchaseReference: string;
  purchaseDate: Date;
  price: number;
}

export class TicketPdfGenerator {
  /**
   * Generate a PDF with all tickets for a purchase
   */
  static async generateAllTicketsPdf(
    tickets: Array<{
      ticketNumber: string;
      ticketType: 'regular' | 'vip' | 'table_of_5' | 'table_of_10';
      price: number;
    }>,
    purchaseData: {
      firstName: string;
      lastName: string;
      email: string;
      purchaseReference: string;
      purchaseDate: Date;
      totalAmount: number;
    }
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: [800, 300], // Landscape ticket size
          margins: { top: 0, bottom: 0, left: 0, right: 0 }
        });

        const chunks: Buffer[] = [];
        
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Draw each ticket
        tickets.forEach((ticket, index) => {
          if (index > 0) {
            doc.addPage();
          }
          
          const ticketData: TicketData = {
            ticketNumber: ticket.ticketNumber,
            ticketType: ticket.ticketType,
            firstName: purchaseData.firstName,
            lastName: purchaseData.lastName,
            email: purchaseData.email,
            purchaseReference: purchaseData.purchaseReference,
            purchaseDate: purchaseData.purchaseDate,
            price: ticket.price
          };

          this.drawLuxuryTicket(doc, ticketData);
        });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  private static drawLuxuryTicket(doc: PDFKit.PDFDocument, ticketData: TicketData): void {
    const width = 800;
    const height = 300;
    const mainSectionWidth = width * 0.67; // Left 2/3 for golden section
    const stubSectionWidth = width * 0.33; // Right 1/3 for black stub
    const stubX = mainSectionWidth;
    
    // Draw shadow effect
    doc.rect(5, 5, width, height)
      .fillColor('#000000')
      .opacity(0.1)
      .fill();

    // Main golden section (left 2/3)
    this.drawGoldenSection(doc, ticketData, mainSectionWidth, height);

    // Black stub section (right 1/3)
    this.drawBlackStubSection(doc, ticketData, stubX, stubSectionWidth, height);
  }

  private static drawGoldenSection(doc: PDFKit.PDFDocument, ticketData: TicketData, width: number, height: number): void {
    // Golden background with vertical texture
    doc.rect(0, 0, width, height)
      .fillColor('#DAA520') // Dark goldenrod
      .fill();

    // Draw vertical striped texture
    for (let i = 0; i < width; i += 2) {
      doc.moveTo(i, 0)
        .lineTo(i, height)
        .strokeColor('#FFD700') // Gold
        .lineWidth(0.5)
        .opacity(0.3)
        .stroke();
    }

    // Overlay gradient effect
    doc.rect(0, 0, width, height)
      .fillColor('#FFD700') // Gold
      .opacity(0.4)
      .fill();

    // Vertical barcode on left edge
    this.drawVerticalBarcode(doc, 10, 20, 30, height - 40, ticketData.ticketNumber);

    // Ticket number next to barcode (vertical)
    const ticketNum = ticketData.ticketNumber.replace(/-/g, ' ').replace(/ /g, '');
    doc.save();
    doc.translate(50, height / 2);
    doc.rotate(-90);
    
    doc.fontSize(10)
      .fillColor('#000000')
      .font('Courier-Bold')
      .text(ticketNum, 0, 0, {
        width: height
      });
    
    doc.restore();

    // Logo area (centered horizontally in golden section)
    const logoX = width / 2 - 40;
    const logoY = 30;
    this.drawETHLogo(doc, logoX, logoY, 80);

    // Main "TICKET" title
    doc.fontSize(48)
      .fillColor('#000000')
      .font('Helvetica-Bold')
      .text('TICKET', width / 2 - 100, 120, {
        align: 'center',
        width: 200
      });

    // Event name
    doc.fontSize(16)
      .fillColor('#000000')
      .font('Helvetica-Bold')
      .text('EDO TALENT HUNT', width / 2 - 100, 170, {
        align: 'center',
        width: 200
      });

    // Date and time
    const dateText = ticketData.purchaseDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    }).toUpperCase();
    const timeText = ticketData.purchaseDate.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true
    }).toUpperCase();

    doc.fontSize(14)
      .fillColor('#000000')
      .font('Helvetica')
      .text(`${dateText} - ${timeText}`, width / 2 - 100, 200, {
        align: 'center',
        width: 200
      });

    // Ticket holder name
    doc.fontSize(12)
      .fillColor('#000000')
      .font('Helvetica-Bold')
      .text(`${ticketData.firstName.toUpperCase()} ${ticketData.lastName.toUpperCase()}`, width / 2 - 100, 225, {
        align: 'center',
        width: 200
      });

    // Gate, Row, Seat information
    const hash = ticketData.ticketNumber.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const gate = String((hash % 50) + 1).padStart(2, '0');
    const row = String((hash % 30) + 1).padStart(2, '0');
    const seat = String((hash % 100) + 1).padStart(2, '0');

    const infoX = width / 2 - 120;
    const infoY = 250;

    // Labels
    doc.fontSize(10)
      .fillColor('#000000')
      .font('Helvetica')
      .text('GATE', infoX, infoY, { width: 80 })
      .text('ROW', infoX + 80, infoY, { width: 80 })
      .text('SEAT', infoX + 160, infoY, { width: 80 });

    // Values
    doc.fontSize(14)
      .fillColor('#000000')
      .font('Helvetica-Bold')
      .text(gate, infoX, infoY + 15, { width: 80 })
      .text(row, infoX + 80, infoY + 15, { width: 80 })
      .text(seat, infoX + 160, infoY + 15, { width: 80 });
  }

  private static drawBlackStubSection(doc: PDFKit.PDFDocument, ticketData: TicketData, x: number, width: number, height: number): void {
    // Black background
    doc.rect(x, 0, width, height)
      .fillColor('#000000')
      .fill();

    // Dashed line separator
    for (let y = 0; y < height; y += 4) {
      doc.moveTo(x, y)
        .lineTo(x, y + 2)
        .strokeColor('#FFD700')
        .lineWidth(1)
        .opacity(0.5)
        .stroke();
    }

    // "ADMIT ONE" (left edge, vertical)
    doc.save();
    doc.translate(x + 15, height / 2);
    doc.rotate(-90);
    
    doc.fontSize(12)
      .fillColor('#FFFFFF')
      .font('Helvetica-Bold')
      .text('ADMIT ONE', 0, 0, {
        width: height
      });
    
    doc.restore();

    // "TICKET" (center, vertical, golden)
    doc.save();
    doc.translate(x + width / 2, height / 2);
    doc.rotate(-90);
    
    doc.fontSize(36)
      .fillColor('#FFD700')
      .font('Helvetica-Bold')
      .text('TICKET', 0, 0, {
        width: height,
        align: 'center'
      });
      
    
    doc.restore();

    // Ticket type label (right edge, vertical)
    const typeLabels = {
      regular: 'REGULAR',
      vip: 'VIP',
      table_of_5: 'TABLE OF 5',
      table_of_10: 'TABLE OF 10'
    };
    const typeLabel = typeLabels[ticketData.ticketType];

    doc.save();
    doc.translate(x + width - 20, height / 2);
    doc.rotate(-90);
    
    doc.fontSize(10)
      .fillColor('#FFFFFF')
      .font('Helvetica-Bold')
      .text(typeLabel, 0, 0, {
        width: height
      });
    
    doc.restore();

    // Horizontal barcode at bottom right
    const barcodeY = height - 50;
    const barcodeWidth = width - 40;
    this.drawHorizontalBarcode(doc, x + 20, barcodeY, barcodeWidth, 20, ticketData.ticketNumber);

    // Ticket number below barcode
    const ticketNum = ticketData.ticketNumber.replace(/-/g, ' ').replace(/ /g, '');
    doc.fontSize(8)
      .fillColor('#FFFFFF')
      .font('Courier')
      .text(ticketNum, x + 20, barcodeY + 25, {
        width: barcodeWidth
      });
  }

  private static drawETHLogo(doc: PDFKit.PDFDocument, x: number, y: number, size: number): void {
    // Draw circular logo frame
    doc.circle(x + size/2, y + size/2, size/2)
      .fillColor('#FFFFFF')
      .opacity(0.2)
      .fill();

    doc.circle(x + size/2, y + size/2, size/2)
      .strokeColor('#000000')
      .lineWidth(2)
      .stroke();

    // Draw "ETH" text in the logo
    doc.fontSize(20)
      .fillColor('#000000')
      .font('Helvetica-Bold')
      .text('ETH', x + size/2 - 20, y + size/2 - 8, {
        width: 40
      });

    // Draw decorative circle around
    doc.circle(x + size/2, y + size/2, size/2 + 5)
      .strokeColor('#FFD700')
      .lineWidth(1)
      .opacity(0.6)
      .stroke();
  }

  private static drawVerticalBarcode(doc: PDFKit.PDFDocument, x: number, y: number, width: number, height: number, ticketNumber: string): void {
    const hash = ticketNumber.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const barCount = 20;
    const barWidth = width / barCount;
    
    for (let i = 0; i < barCount; i++) {
      const barHeight = height * (0.4 + (hash + i) % 6 * 0.1);
      const isThick = (hash + i) % 3 === 0;
      const actualWidth = isThick ? barWidth * 1.5 : barWidth;
      
      doc.rect(x + (i * barWidth), y + (height - barHeight), actualWidth, barHeight)
        .fillColor('#FFFFFF')
        .fill();
    }
  }

  private static drawHorizontalBarcode(doc: PDFKit.PDFDocument, x: number, y: number, width: number, height: number, ticketNumber: string): void {
    const hash = ticketNumber.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const barCount = 40;
    const barWidth = width / barCount;
    
    let currentX = x;
    
    for (let i = 0; i < barCount; i++) {
      const barHeight = height * (0.5 + (hash + i) % 5 * 0.1);
      const isThick = (hash + i) % 3 === 0;
      const actualWidth = isThick ? barWidth * 1.5 : barWidth;
      
      doc.rect(currentX, y + (height - barHeight), actualWidth, barHeight)
        .fillColor('#FFFFFF')
        .fill();
      
      currentX += actualWidth;
    }
  }
}
