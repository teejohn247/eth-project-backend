declare class EmailService {
    private transporter;
    private fromEmail;
    constructor();
    sendOTPEmail(email: string, otp: string, type: 'verification' | 'password_reset'): Promise<void>;
    sendBulkParticipantInvitation(email: string, otp: string, firstName: string, bulkRegistrationNumber: string): Promise<void>;
    private generateOTPEmailTemplate;
    private generateBulkInvitationTemplate;
    sendTicketEmail(email: string, firstName: string, lastName: string, purchaseReference: string, tickets: Array<{
        ticketType: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
    }>, ticketNumbers: string[], totalAmount: number): Promise<void>;
    private generateTicketEmailTemplate;
    verifyConnection(): Promise<boolean>;
}
declare const _default: EmailService;
export default _default;
//# sourceMappingURL=emailService.d.ts.map