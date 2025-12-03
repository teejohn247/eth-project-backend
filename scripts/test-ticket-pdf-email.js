require('dotenv').config();
const nodemailer = require('nodemailer');
const { TicketPdfGenerator } = require('../dist/utils/ticketPdfGenerator');

// Email configuration
const emailPort = parseInt(process.env.EMAIL_PORT || '465');
const config = {
  host: process.env.EMAIL_HOST || 'smtp-relay.brevo.com',
  port: emailPort,
  secure: emailPort === 465,
  auth: {
    user: process.env.EMAIL_USER || '99c77c001@smtp-brevo.com',
    pass: process.env.BREVO_SMTP_KEY || process.env.EMAIL_PASS || ''
  },
  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 15000
};

const fromEmail = process.env.EMAIL_FROM || 'edotalenthunt@themakersacad.com';
const transporter = nodemailer.createTransport(config);

async function testTicketPdfEmail() {
  try {
    console.log('🧪 Testing PDF Ticket Generation and Email\n');
    console.log('📧 Email Configuration:');
    console.log('   Host:', config.host);
    console.log('   Port:', config.port, '(secure)');
    console.log('   User:', config.auth.user);
    console.log('   Has Password:', !!config.auth.pass);
    console.log('');

    // Test data
    const testTickets = [
      {
        ticketNumber: 'ETH-REGULAR-TEST-001',
        ticketType: 'regular',
        price: 5000
      },
      {
        ticketNumber: 'ETH-REGULAR-TEST-002',
        ticketType: 'regular',
        price: 5000
      },
      {
        ticketNumber: 'ETH-VIP-TEST-001',
        ticketType: 'vip',
        price: 15000
      }
    ];

    const purchaseData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'teejohn247@gmail.com',
      purchaseReference: 'TKT_TEST_PDF_123456789',
      purchaseDate: new Date(),
      totalAmount: 25000
    };

    console.log('1️⃣ Generating PDF with all tickets...');
    const pdfBuffer = await TicketPdfGenerator.generateAllTicketsPdf(
      testTickets,
      purchaseData
    );
    console.log(`✅ PDF generated successfully (${(pdfBuffer.length / 1024).toFixed(2)} KB)\n`);

    console.log('2️⃣ Verifying email service connection...');
    await transporter.verify();
    console.log('✅ Email service connection verified\n');

    console.log('3️⃣ Sending email with PDF attachment...');
    
    const mailOptions = {
      from: `"Edo Talent Hunt" <${fromEmail}>`,
      to: 'teejohn247@gmail.com',
      subject: '🎟️ Test - Your Edo Talent Hunt Tickets (PDF)',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #DAA520;">Your Tickets Are Attached</h2>
          <p>Dear ${purchaseData.firstName} ${purchaseData.lastName},</p>
          <p>Thank you for your purchase! Your tickets for Edo Talent Hunt have been generated and are attached to this email as a PDF file.</p>
          <p><strong>Purchase Reference:</strong> ${purchaseData.purchaseReference}</p>
          <p><strong>Total Amount:</strong> ₦${purchaseData.totalAmount.toLocaleString()}</p>
          <p><strong>Number of Tickets:</strong> ${testTickets.length}</p>
          <p>Please download and save the attached PDF file. You'll need to bring it (or a printed copy) to the event.</p>
          <p style="margin-top: 30px; color: #666; font-size: 12px;">
            This is a test email from the Edo Talent Hunt backend system.
          </p>
        </div>
      `,
      attachments: [
        {
          filename: `Edo-Talent-Hunt-Tickets-${purchaseData.purchaseReference}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email with PDF attachment sent successfully!');
    console.log('   Message ID:', info.messageId);
    console.log('   Response:', info.response);
    console.log('   Attachment:', mailOptions.attachments[0].filename);
    console.log('\n🎉 Test completed successfully!');
    console.log('📬 Please check teejohn247@gmail.com inbox (and spam folder)');
    console.log('📎 The PDF file should be attached to the email');
    
  } catch (error) {
    console.error('\n❌ Test failed!\n');
    console.error('Error:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

testTicketPdfEmail();

