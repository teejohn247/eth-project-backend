declare class EmailService {
    private transporter;
    private fromEmail;
    constructor();
    sendOTPEmail(email: string, otp: string, type: 'verification' | 'password_reset'): Promise<void>;
    private generateOTPEmailTemplate;
    verifyConnection(): Promise<boolean>;
}
declare const _default: EmailService;
export default _default;
//# sourceMappingURL=emailService.d.ts.map