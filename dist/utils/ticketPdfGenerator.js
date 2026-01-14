"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TicketPdfGenerator = void 0;
const pdfkit_1 = __importDefault(require("pdfkit"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
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
class TicketPdfGenerator {
    static async generateAllTicketsPdf(tickets, purchaseData) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new pdfkit_1.default({
                    size: [600, 200],
                    margins: { top: 0, bottom: 0, left: 0, right: 0 }
                });
                const chunks = [];
                doc.on('data', (chunk) => chunks.push(chunk));
                doc.on('end', () => resolve(Buffer.concat(chunks)));
                doc.on('error', reject);
                const logoPath = path_1.default.join(process.cwd(), 'public', 'images', 'edo.png');
                const collagePath = path_1.default.join(process.cwd(), 'public', 'images', 'contestants-collage.jpg');
                let logoImage = null;
                let collageImage = null;
                if (fs_1.default.existsSync(logoPath)) {
                    logoImage = fs_1.default.readFileSync(logoPath);
                }
                if (fs_1.default.existsSync(collagePath)) {
                    collageImage = fs_1.default.readFileSync(collagePath);
                }
                tickets.forEach((ticket, index) => {
                    if (index > 0) {
                        doc.addPage();
                    }
                    const ticketData = {
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
            }
            catch (error) {
                reject(error);
            }
        });
    }
    static drawTicket(doc, ticketData, logoImage, collageImage) {
        const width = 600;
        const height = 200;
        const leftSectionWidth = width * 0.35;
        const rightSectionWidth = width * 0.65;
        const rightSectionX = leftSectionWidth;
        const normalizedType = ticketData.ticketType.toLowerCase().replace(/\s+/g, '_');
        const config = TICKET_CONFIGS[normalizedType] || TICKET_CONFIGS.regular;
        this.drawLeftSection(doc, ticketData, config, 0, 0, leftSectionWidth, height);
        this.drawDashedBorder(doc, leftSectionWidth, 0, height);
        this.drawRightSection(doc, ticketData, rightSectionX, 0, rightSectionWidth, height, logoImage, collageImage);
    }
    static drawLeftSection(doc, ticketData, config, x, y, width, height) {
        doc.rect(x, y, width, height)
            .fillColor(config.gradientEnd)
            .fill();
        for (let i = 0; i < height; i += 2) {
            const opacity = 0.3 + (i / height) * 0.2;
            doc.rect(x, y + i, width, 1)
                .fillColor(config.gradientStart)
                .opacity(opacity)
                .fill();
        }
        const typeY = y + 30;
        doc.fontSize(11)
            .fillColor('#FFFFFF')
            .font('Helvetica-Bold')
            .text(config.name, x + width / 2, typeY, {
            align: 'center',
            width: width - 20,
            lineGap: 2
        });
        const priceY = typeY + 35;
        doc.fontSize(36)
            .fillColor('#FFFFFF')
            .font('Helvetica-Bold')
            .text(config.price, x + width / 2, priceY, {
            align: 'center',
            width: width - 20
        });
        const labelY = priceY + 40;
        doc.fontSize(10)
            .fillColor('#FFFFFF')
            .font('Helvetica')
            .text(config.label, x + width / 2, labelY, {
            align: 'center',
            width: width - 20
        });
        const badgeY = y + height - 25;
        const badgeWidth = 80;
        const badgeHeight = 15;
        const badgeX = x + (width - badgeWidth) / 2;
        doc.rect(badgeX, badgeY, badgeWidth, badgeHeight)
            .fillColor('rgba(255, 255, 255, 0.2)')
            .fill();
        doc.rect(badgeX, badgeY, badgeWidth, badgeHeight)
            .strokeColor('rgba(255, 255, 255, 0.3)')
            .lineWidth(1)
            .stroke();
        doc.fontSize(8)
            .fillColor('#FFFFFF')
            .font('Helvetica-Bold')
            .text('Official Ticket', badgeX + badgeWidth / 2, badgeY + 4, {
            align: 'center',
            width: badgeWidth
        });
    }
    static drawDashedBorder(doc, x, y, height) {
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
    static drawRightSection(doc, ticketData, x, y, width, height, logoImage, collageImage) {
        doc.rect(x, y, width, height)
            .fillColor('#FFFFFF')
            .fill();
        const headerY = y + 15;
        const logoSize = 30;
        const logoX = x + 15;
        const logoY = headerY;
        if (logoImage) {
            try {
                doc.image(logoImage, logoX, logoY, { width: logoSize, height: logoSize, fit: [logoSize, logoSize] });
            }
            catch (error) {
                doc.rect(logoX, logoY, logoSize, logoSize)
                    .fillColor('#4CAF50')
                    .fill();
            }
        }
        else {
            doc.rect(logoX, logoY, logoSize, logoSize)
                .fillColor('#4CAF50')
                .fill();
        }
        const organizerX = logoX + logoSize + 8;
        doc.fontSize(10)
            .fillColor('#666666')
            .font('Helvetica')
            .text(EVENT_DETAILS.organizer, organizerX, logoY, {
            width: 150,
            lineGap: 1
        });
        const titleX = x + 15;
        const titleY = headerY + 40;
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
        const subtitleY = titleY + 65;
        doc.fontSize(14)
            .fillColor('#666666')
            .font('Helvetica-Bold')
            .text(EVENT_DETAILS.subtitle, titleX, subtitleY, {
            width: width - 30
        });
        const footerY = y + height - 50;
        const footerHeight = 35;
        this.drawDashedTopBorder(doc, x, footerY, width);
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
        const dateBadgeX = x + width - 75;
        const dateBadgeY = footerY + 5;
        const dateBadgeWidth = 60;
        const dateBadgeHeight = 30;
        doc.rect(dateBadgeX, dateBadgeY, dateBadgeWidth, dateBadgeHeight)
            .fillColor('#667eea')
            .fill();
        doc.fontSize(10)
            .fillColor('#FFFFFF')
            .opacity(0.9)
            .font('Helvetica-Bold')
            .text('JAN', dateBadgeX + dateBadgeWidth / 2, dateBadgeY + 5, {
            align: 'center',
            width: dateBadgeWidth
        });
        doc.opacity(1);
        doc.fontSize(16)
            .fillColor('#FFFFFF')
            .font('Helvetica-Bold')
            .text('14', dateBadgeX + dateBadgeWidth / 2, dateBadgeY + 15, {
            align: 'center',
            width: dateBadgeWidth
        });
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
            }
            catch (error) {
            }
        }
    }
    static drawDashedTopBorder(doc, x, y, width) {
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
exports.TicketPdfGenerator = TicketPdfGenerator;
//# sourceMappingURL=ticketPdfGenerator.js.map