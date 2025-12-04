"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TicketPdfGenerator = void 0;
const pdfkit_1 = __importDefault(require("pdfkit"));
class TicketPdfGenerator {
    static async generateAllTicketsPdf(tickets, purchaseData) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new pdfkit_1.default({
                    size: [800, 300],
                    margins: { top: 0, bottom: 0, left: 0, right: 0 }
                });
                const chunks = [];
                doc.on('data', (chunk) => chunks.push(chunk));
                doc.on('end', () => resolve(Buffer.concat(chunks)));
                doc.on('error', reject);
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
                    this.drawLuxuryTicket(doc, ticketData);
                });
                doc.end();
            }
            catch (error) {
                reject(error);
            }
        });
    }
    static drawLuxuryTicket(doc, ticketData) {
        const width = 800;
        const height = 300;
        const mainSectionWidth = width * 0.67;
        const stubSectionWidth = width * 0.33;
        const stubX = mainSectionWidth;
        doc.rect(5, 5, width, height)
            .fillColor('#000000')
            .opacity(0.1)
            .fill();
        this.drawGoldenSection(doc, ticketData, mainSectionWidth, height);
        this.drawBlackStubSection(doc, ticketData, stubX, stubSectionWidth, height);
    }
    static drawGoldenSection(doc, ticketData, width, height) {
        doc.rect(0, 0, width, height)
            .fillColor('#DAA520')
            .fill();
        for (let i = 0; i < width; i += 2) {
            doc.moveTo(i, 0)
                .lineTo(i, height)
                .strokeColor('#FFD700')
                .lineWidth(0.5)
                .opacity(0.3)
                .stroke();
        }
        doc.rect(0, 0, width, height)
            .fillColor('#FFD700')
            .opacity(0.4)
            .fill();
        this.drawVerticalBarcode(doc, 10, 20, 30, height - 40, ticketData.ticketNumber);
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
        const logoX = width / 2 - 40;
        const logoY = 30;
        this.drawETHLogo(doc, logoX, logoY, 80);
        doc.fontSize(48)
            .fillColor('#000000')
            .font('Helvetica-Bold')
            .text('TICKET', width / 2 - 100, 120, {
            align: 'center',
            width: 200
        });
        doc.fontSize(16)
            .fillColor('#000000')
            .font('Helvetica-Bold')
            .text('EDO TALENT HUNT', width / 2 - 100, 170, {
            align: 'center',
            width: 200
        });
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
        doc.fontSize(12)
            .fillColor('#000000')
            .font('Helvetica-Bold')
            .text(`${ticketData.firstName.toUpperCase()} ${ticketData.lastName.toUpperCase()}`, width / 2 - 100, 225, {
            align: 'center',
            width: 200
        });
        const hash = ticketData.ticketNumber.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const gate = String((hash % 50) + 1).padStart(2, '0');
        const row = String((hash % 30) + 1).padStart(2, '0');
        const seat = String((hash % 100) + 1).padStart(2, '0');
        const infoX = width / 2 - 120;
        const infoY = 250;
        doc.fontSize(10)
            .fillColor('#000000')
            .font('Helvetica')
            .text('GATE', infoX, infoY, { width: 80 })
            .text('ROW', infoX + 80, infoY, { width: 80 })
            .text('SEAT', infoX + 160, infoY, { width: 80 });
        doc.fontSize(14)
            .fillColor('#000000')
            .font('Helvetica-Bold')
            .text(gate, infoX, infoY + 15, { width: 80 })
            .text(row, infoX + 80, infoY + 15, { width: 80 })
            .text(seat, infoX + 160, infoY + 15, { width: 80 });
    }
    static drawBlackStubSection(doc, ticketData, x, width, height) {
        doc.rect(x, 0, width, height)
            .fillColor('#000000')
            .fill();
        for (let y = 0; y < height; y += 4) {
            doc.moveTo(x, y)
                .lineTo(x, y + 2)
                .strokeColor('#FFD700')
                .lineWidth(1)
                .opacity(0.5)
                .stroke();
        }
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
        const barcodeY = height - 50;
        const barcodeWidth = width - 40;
        this.drawHorizontalBarcode(doc, x + 20, barcodeY, barcodeWidth, 20, ticketData.ticketNumber);
        const ticketNum = ticketData.ticketNumber.replace(/-/g, ' ').replace(/ /g, '');
        doc.fontSize(8)
            .fillColor('#FFFFFF')
            .font('Courier')
            .text(ticketNum, x + 20, barcodeY + 25, {
            width: barcodeWidth
        });
    }
    static drawETHLogo(doc, x, y, size) {
        doc.circle(x + size / 2, y + size / 2, size / 2)
            .fillColor('#FFFFFF')
            .opacity(0.2)
            .fill();
        doc.circle(x + size / 2, y + size / 2, size / 2)
            .strokeColor('#000000')
            .lineWidth(2)
            .stroke();
        doc.fontSize(20)
            .fillColor('#000000')
            .font('Helvetica-Bold')
            .text('ETH', x + size / 2 - 20, y + size / 2 - 8, {
            width: 40
        });
        doc.circle(x + size / 2, y + size / 2, size / 2 + 5)
            .strokeColor('#FFD700')
            .lineWidth(1)
            .opacity(0.6)
            .stroke();
    }
    static drawVerticalBarcode(doc, x, y, width, height, ticketNumber) {
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
    static drawHorizontalBarcode(doc, x, y, width, height, ticketNumber) {
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
exports.TicketPdfGenerator = TicketPdfGenerator;
//# sourceMappingURL=ticketPdfGenerator.js.map