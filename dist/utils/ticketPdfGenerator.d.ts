export declare class TicketPdfGenerator {
    static generateAllTicketsPdf(tickets: Array<{
        ticketNumber: string;
        ticketType: 'regular' | 'vip' | 'vvip';
        price: number;
    }>, purchaseData: {
        firstName: string;
        lastName: string;
        email: string;
        purchaseReference: string;
        purchaseDate: Date;
        totalAmount: number;
    }): Promise<Buffer>;
    private static drawLuxuryTicket;
    private static drawGoldenSection;
    private static drawBlackStubSection;
    private static drawETHLogo;
    private static drawVerticalBarcode;
    private static drawHorizontalBarcode;
}
//# sourceMappingURL=ticketPdfGenerator.d.ts.map