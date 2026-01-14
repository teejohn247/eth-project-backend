import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';

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

// Event details constants
const EVENT_DETAILS = {
  title: 'EDO TALENT HUNT',
  subtitle: 'GRAND Finale',
  organizer: 'Ministry of Arts,\nCulture & Tourism',
  venue: 'VICTOR UWAIFO CREATIVE HUB',
  address: '200, VEGETABLE MARKET, AIRPORT ROAD, BENIN CITY',
  date: '14 JAN 2026',
  time: '4PM',
  contacts: ['08138643441', '08149503130', '07056626808', '08078648585']
};

// Ticket type configurations matching HTML design
const TICKET_CONFIGS = {
  regular: {
    name: 'Regular\nTickets',
    price: '10K',
    label: 'Per Person',
    gradientStart: '#ff6b6b',
    gradientEnd: '#ee5a6f'
  },
  vip: {
    name: 'VIP for\nCouple',
    price: '50K',
    label: 'Two Persons',
    gradientStart: '#c44569',
    gradientEnd: '#d63447'
  },
  table_of_5: {
    name: 'Gold\nTable',
    price: '500K',
    label: 'Full Table',
    gradientStart: '#2c2c2c',
    gradientEnd: '#1a1a1a'
  },
  table_of_10: {
    name: 'Sponsors\nTable',
    price: '1M',
    label: 'Full Table',
    gradientStart: '#2c3e50',
    gradientEnd: '#3498db'
  }
};

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
          size: [600, 200], // Landscape ticket size matching HTML
          margins: { top: 0, bottom: 0, left: 0, right: 0 }
        });

        const chunks: Buffer[] = [];
        
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Load images
        const logoPath = path.join(process.cwd(), 'public', 'images', 'edo.png');
        const collagePath = path.join(process.cwd(), 'public', 'images', 'contestants-collage.jpg');
        
        let logoImage: Buffer | null = null;
        let collageImage: Buffer | null = null;

        // Try to load logo
        if (fs.existsSync(logoPath)) {
          logoImage = fs.readFileSync(logoPath);
        }

        // Try to load collage (if it exists)
        if (fs.existsSync(collagePath)) {
          collageImage = fs.readFileSync(collagePath);
        }

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

          this.drawTicket(doc, ticketData, logoImage, collageImage);
        });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  private static drawTicket(
    doc: PDFKit.PDFDocument,
    ticketData: TicketData,
    logoImage: Buffer | null,
    collageImage: Buffer | null
  ): void {
    const width = 600;
    const height = 200;
    const leftSectionWidth = width * 0.35; // 35% left section
    const rightSectionWidth = width * 0.65; // 65% right section
    const rightSectionX = leftSectionWidth;

    // Normalize ticket type to match config keys
    const normalizedType = ticketData.ticketType.toLowerCase().replace(/\s+/g, '_') as keyof typeof TICKET_CONFIGS;
    const config = TICKET_CONFIGS[normalizedType] || TICKET_CONFIGS.regular; // Default to regular if not found

    // Draw left section (ticket type and price)
    this.drawLeftSection(doc, ticketData, config, 0, 0, leftSectionWidth, height);

    // Draw dashed border
    this.drawDashedBorder(doc, leftSectionWidth, 0, height);

    // Draw right section (event details)
    this.drawRightSection(doc, ticketData, rightSectionX, 0, rightSectionWidth, height, logoImage, collageImage);
  }

  private static drawLeftSection(
    doc: PDFKit.PDFDocument,
    ticketData: TicketData,
    config: typeof TICKET_CONFIGS.regular,
    x: number,
    y: number,
    width: number,
    height: number
  ): void {
    // Gradient background (simulated with solid color - PDFKit doesn't support gradients easily)
    // Using the gradient end color as base
    doc.rect(x, y, width, height)
      .fillColor(config.gradientEnd)
      .fill();

    // Add some texture to simulate gradient
    for (let i = 0; i < height; i += 2) {
      const opacity = 0.3 + (i / height) * 0.2;
      doc.rect(x, y + i, width, 1)
        .fillColor(config.gradientStart)
        .opacity(opacity)
        .fill();
    }

    // Ticket type (centered)
    const typeY = y + 30;
    doc.fontSize(11)
      .fillColor('#FFFFFF')
      .font('Helvetica-Bold')
      .text(config.name, x + width / 2, typeY, {
        align: 'center',
        width: width - 20,
        lineGap: 2
      });

    // Price (large, bold)
    const priceY = typeY + 35;
    doc.fontSize(36)
      .fillColor('#FFFFFF')
      .font('Helvetica-Bold')
      .text(config.price, x + width / 2, priceY, {
        align: 'center',
        width: width - 20
      });

    // Label (Per Person, Two Persons, etc.)
    const labelY = priceY + 40;
    doc.fontSize(10)
      .fillColor('#FFFFFF')
      .font('Helvetica')
      .text(config.label, x + width / 2, labelY, {
        align: 'center',
        width: width - 20
      });

    // "Official Ticket" badge at bottom
    const badgeY = y + height - 25;
    const badgeWidth = 80;
    const badgeHeight = 15;
    const badgeX = x + (width - badgeWidth) / 2;

    // Badge background
    doc.rect(badgeX, badgeY, badgeWidth, badgeHeight)
      .fillColor('rgba(255, 255, 255, 0.2)')
      .fill();

    doc.rect(badgeX, badgeY, badgeWidth, badgeHeight)
      .strokeColor('rgba(255, 255, 255, 0.3)')
      .lineWidth(1)
      .stroke();

    // Badge text
    doc.fontSize(8)
      .fillColor('#FFFFFF')
      .font('Helvetica-Bold')
      .text('Official Ticket', badgeX + badgeWidth / 2, badgeY + 4, {
        align: 'center',
        width: badgeWidth
      });
  }

  private static drawDashedBorder(
    doc: PDFKit.PDFDocument,
    x: number,
    y: number,
    height: number
  ): void {
    // Draw dashed vertical line
    const dashLength = 8;
    const gapLength = 4;
    let currentY = y;

    while (currentY < y + height) {
      doc.moveTo(x, currentY)
        .lineTo(x, Math.min(currentY + dashLength, y + height))
        .strokeColor('#FFFFFF')
        .lineWidth(2)
        .opacity(0.5)
        .stroke();
      
      currentY += dashLength + gapLength;
    }
  }

  private static drawRightSection(
    doc: PDFKit.PDFDocument,
    ticketData: TicketData,
    x: number,
    y: number,
    width: number,
    height: number,
    logoImage: Buffer | null,
    collageImage: Buffer | null
  ): void {
    // White background
    doc.rect(x, y, width, height)
      .fillColor('#FFFFFF')
      .fill();

    // Event header section
    const headerY = y + 15;
    
    // Logo square (30x30)
    const logoSize = 30;
    const logoX = x + 15;
    const logoY = headerY;

    if (logoImage) {
      // Add logo image
      try {
        doc.image(logoImage, logoX, logoY, { width: logoSize, height: logoSize, fit: [logoSize, logoSize] });
      } catch (error) {
        // Fallback to colored square if image fails
        doc.rect(logoX, logoY, logoSize, logoSize)
          .fillColor('#4CAF50')
          .fill();
      }
    } else {
      // Fallback: green square
      doc.rect(logoX, logoY, logoSize, logoSize)
        .fillColor('#4CAF50')
        .fill();
    }

    // Organizer text next to logo
    const organizerX = logoX + logoSize + 8;
    doc.fontSize(10)
      .fillColor('#666666')
      .font('Helvetica')
      .text(EVENT_DETAILS.organizer, organizerX, logoY, {
        width: 150,
        lineGap: 1
      });

    // Event title with gradient effect (simulated)
    const titleX = x + 15;
    const titleY = headerY + 40;
    
    // Main title "EDO TALENT HUNT" with gradient highlight effect
    doc.fontSize(18)
      .fillColor('#333333')
      .font('Helvetica-Bold')
      .text('EDO', titleX, titleY, {
        width: width - 30
      });

    doc.fontSize(18)
      .fillColor('#333333')
      .font('Helvetica-Bold')
      .text('TALENT', titleX, titleY + 20, {
        width: width - 30
      });

    doc.fontSize(18)
      .fillColor('#333333')
      .font('Helvetica-Bold')
      .text('HUNT', titleX, titleY + 40, {
        width: width - 30
      });

    // Subtitle "GRAND Finale"
    const subtitleY = titleY + 65;
    doc.fontSize(14)
      .fillColor('#666666')
      .font('Helvetica-Bold')
      .text(EVENT_DETAILS.subtitle, titleX, subtitleY, {
        width: width - 30
      });

    // Event footer section
    const footerY = y + height - 50;
    const footerHeight = 35;

    // Dashed top border
    this.drawDashedTopBorder(doc, x, footerY, width);

    // Event details (left side)
    const detailsX = x + 15;
    const detailsY = footerY + 8;
    
    const contactText = `FOR INFO: ${EVENT_DETAILS.contacts.join(', ')}`;
    doc.fontSize(9)
      .fillColor('#888888')
      .font('Helvetica')
      .text(contactText, detailsX, detailsY, {
        width: width - 100,
        lineGap: 1.5
      });

    // Date badge (right side)
    const dateBadgeX = x + width - 75;
    const dateBadgeY = footerY + 5;
    const dateBadgeWidth = 60;
    const dateBadgeHeight = 30;

    // Date badge background with gradient (purple)
    doc.rect(dateBadgeX, dateBadgeY, dateBadgeWidth, dateBadgeHeight)
      .fillColor('#667eea')
      .fill();

    // Month
    doc.fontSize(10)
      .fillColor('#FFFFFF')
      .opacity(0.9)
      .font('Helvetica-Bold')
      .text('JAN', dateBadgeX + dateBadgeWidth / 2, dateBadgeY + 5, {
        align: 'center',
        width: dateBadgeWidth
      });
    
    doc.opacity(1); // Reset opacity

    // Day
    doc.fontSize(16)
      .fillColor('#FFFFFF')
      .font('Helvetica-Bold')
      .text('14', dateBadgeX + dateBadgeWidth / 2, dateBadgeY + 15, {
        align: 'center',
        width: dateBadgeWidth
      });

    // Optional: Add collage image in the middle area if available
    if (collageImage) {
      try {
        const collageX = x + width / 2 - 40;
        const collageY = y + height / 2 - 30;
        const collageWidth = 80;
        const collageHeight = 60;
        
        doc.image(collageImage, collageX, collageY, { 
          width: collageWidth, 
          height: collageHeight,
          fit: [collageWidth, collageHeight]
        });
      } catch (error) {
        // Silently fail if image can't be loaded
      }
    }
  }

  private static drawDashedTopBorder(
    doc: PDFKit.PDFDocument,
    x: number,
    y: number,
    width: number
  ): void {
    const dashLength = 8;
    const gapLength = 4;
    let currentX = x;

    while (currentX < x + width) {
      doc.moveTo(currentX, y)
        .lineTo(Math.min(currentX + dashLength, x + width), y)
        .strokeColor('#DDDDDD')
        .lineWidth(1)
        .stroke();
      
      currentX += dashLength + gapLength;
    }
  }
}
