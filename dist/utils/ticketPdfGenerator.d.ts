export declare class TicketPdfGenerator {
    static generateAllTicketsPdf(tickets: Array<{
        ticketNumber: string;
        ticketType: 'regular' | 'vip' | 'table_of_5' | 'table_of_10';
        price: number;
    }>, purchaseData: {
        firstName: string;
        lastName: string;
        email: string;
        purchaseReference: string;
        purchaseDate: Date;
        totalAmount: number;
    }): Promise<Buffer>;
    private static drawTicket;
    private static drawLeftSection;
    private static drawDashedBorder;
    private static drawRightSection;
    private static drawDashedTopBorder;
}
//# sourceMappingURL=ticketPdfGenerator.d.ts.map