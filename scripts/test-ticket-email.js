require('dotenv').config();
const nodemailer = require('nodemailer');

// Email configuration
const emailPort = parseInt(process.env.EMAIL_PORT || '465');
const config = {
  host: process.env.EMAIL_HOST || 'smtp-relay.brevo.com',
  port: emailPort,
  secure: emailPort === 465, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER || '99c77c001@smtp-brevo.com',
    pass: process.env.BREVO_SMTP_KEY || process.env.EMAIL_PASS || ''
  },
  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 15000
};

const fromEmail = process.env.EMAIL_FROM || 'edotalenthunt@themakersacad.com';

console.log('📧 Email configuration:', {
  host: config.host,
  port: config.port,
  user: config.auth.user,
  hasPassword: !!config.auth.pass
});

const transporter = nodemailer.createTransport(config);

// Generate ticket email template
function generateTicketEmailTemplate(firstName, lastName, purchaseReference, tickets, ticketNumbers, totalAmount) {
  const ticketRows = tickets.map((ticket, index) => {
    const startIndex = tickets.slice(0, index).reduce((sum, t) => sum + t.quantity, 0);
    const ticketNums = ticketNumbers.slice(startIndex, startIndex + ticket.quantity);
    
    return `
      <tr style="border-bottom: 1px solid #E2E8F0;">
        <td style="padding: 15px; text-align: left;">
          <strong style="color: #2D3748; text-transform: uppercase;">${ticket.ticketType}</strong>
        </td>
        <td style="padding: 15px; text-align: center; color: #4A5568;">${ticket.quantity}</td>
        <td style="padding: 15px; text-align: right; color: #4A5568;">₦${ticket.unitPrice.toLocaleString()}</td>
        <td style="padding: 15px; text-align: right; color: #2D3748; font-weight: 600;">₦${ticket.totalPrice.toLocaleString()}</td>
      </tr>
      <tr>
        <td colspan="4" style="padding: 10px 15px; background: #F7FAFC;">
          <div style="font-size: 12px; color: #718096;">
            <strong>Ticket Numbers:</strong> ${ticketNums.join(', ')}
          </div>
        </td>
      </tr>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Edo Talent Hunt Tickets</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          line-height: 1.6;
          color: #333333;
          background: linear-gradient(135deg, #F5F5DC 0%, #FFF8DC 50%, #FFFACD 100%);
          margin: 0;
          padding: 20px;
        }
        
        .email-wrapper {
          max-width: 600px;
          margin: 0 auto;
          background: #ffffff;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 25px 50px rgba(218, 165, 32, 0.2);
          border: 2px solid rgba(255, 215, 0, 0.3);
        }
        
        .header {
          background: linear-gradient(135deg, #FFD700 0%, #F4D03F 30%, #DAA520 70%, #B8860B 100%);
          padding: 60px 40px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        
        .circular-frame {
          width: 160px;
          height: 160px;
          margin: 0 auto 30px;
          background: #ffffff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 
            0 0 0 8px rgba(255, 255, 255, 0.8),
            0 0 0 16px rgba(255, 215, 0, 0.6),
            0 15px 35px rgba(0, 0, 0, 0.2);
        }
        
        .logo img {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          object-fit: cover;
        }
        
        .brand-name {
          font-size: 36px;
          font-weight: 900;
          color: #1a1a1a;
          text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.3);
          letter-spacing: 3px;
          margin: 0 0 10px 0;
          text-transform: uppercase;
        }
        
        .content {
          padding: 50px 40px;
          background: #ffffff;
        }
        
        .greeting {
          font-size: 24px;
          font-weight: 600;
          color: #2D3748;
          margin-bottom: 20px;
        }
        
        .success-badge {
          background: linear-gradient(135deg, #48BB78, #38A169);
          color: white;
          padding: 12px 24px;
          border-radius: 25px;
          font-size: 14px;
          font-weight: 700;
          text-transform: uppercase;
          display: inline-block;
          margin-bottom: 30px;
          box-shadow: 0 4px 15px rgba(72, 187, 120, 0.3);
        }
        
        .ticket-card {
          background: linear-gradient(135deg, #FFF9E6 0%, #FFF5CC 100%);
          border: 3px solid #FFD700;
          border-radius: 20px;
          padding: 30px;
          margin: 30px 0;
        }
        
        .purchase-info {
          background: #F7FAFC;
          border-radius: 12px;
          padding: 20px;
          margin: 20px 0;
        }
        
        .purchase-info p {
          margin: 8px 0;
          color: #4A5568;
          font-size: 14px;
        }
        
        .purchase-info strong {
          color: #2D3748;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        th {
          background: linear-gradient(135deg, #FFD700, #DAA520);
          color: #1a1a1a;
          padding: 15px;
          text-align: left;
          font-weight: 700;
          text-transform: uppercase;
          font-size: 12px;
          letter-spacing: 1px;
        }
        
        td {
          padding: 15px;
          color: #4A5568;
        }
        
        .total-row {
          background: linear-gradient(135deg, #FFD700, #DAA520);
          font-weight: 700;
          color: #1a1a1a;
        }
        
        .ticket-numbers {
          background: #F7FAFC;
          border-left: 4px solid #FFD700;
          padding: 20px;
          margin: 20px 0;
          border-radius: 8px;
        }
        
        .ticket-numbers h4 {
          color: #2D3748;
          margin-bottom: 10px;
          font-size: 16px;
        }
        
        .ticket-number {
          background: white;
          padding: 10px 15px;
          margin: 5px 0;
          border-radius: 8px;
          font-family: 'Courier New', monospace;
          font-weight: 600;
          color: #B8860B;
          border: 2px dashed #DAA520;
          display: inline-block;
          margin-right: 10px;
          margin-bottom: 10px;
        }
        
        .footer {
          background: linear-gradient(135deg, #F7FAFC 0%, #EDF2F7 100%);
          padding: 40px;
          text-align: center;
          border-top: 3px solid #E2E8F0;
        }
      </style>
    </head>
    <body>
      <div class="email-wrapper">
        <div class="header">
          <div class="circular-frame">
            <div class="logo">
              <img src="https://www.edotalenthunt.com/assets/img/project/eth-logo-wht.png" alt="Edo Talent Hunt Logo" />
            </div>
          </div>
          <h1 class="brand-name">Edo Talent Hunt</h1>
        </div>
        
        <div class="content">
          <div class="success-badge">✅ Payment Successful</div>
          
          <h2 class="greeting">Hello ${firstName} ${lastName}!</h2>
          
          <p style="color: #4A5568; margin-bottom: 30px; font-size: 16px;">
            Thank you for your purchase! Your tickets for Edo Talent Hunt have been successfully generated and are attached below.
          </p>
          
          <div class="purchase-info">
            <p><strong>Purchase Reference:</strong> ${purchaseReference}</p>
            <p><strong>Purchase Date:</strong> ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          
          <div class="ticket-card">
            <h3 style="color: #B8860B; margin-bottom: 20px; text-transform: uppercase; font-size: 18px;">Your Tickets</h3>
            
            <table>
              <thead>
                <tr>
                  <th>Ticket Type</th>
                  <th style="text-align: center;">Quantity</th>
                  <th style="text-align: right;">Unit Price</th>
                  <th style="text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${ticketRows}
                <tr class="total-row">
                  <td colspan="3" style="text-align: right; padding-right: 20px;"><strong>TOTAL</strong></td>
                  <td style="text-align: right;"><strong>₦${totalAmount.toLocaleString()}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div class="ticket-numbers">
            <h4>🎟️ Your Ticket Numbers</h4>
            <p style="color: #718096; font-size: 14px; margin-bottom: 15px;">
              Please save these ticket numbers. You'll need them for entry to the event.
            </p>
            ${ticketNumbers.map(num => `<span class="ticket-number">${num}</span>`).join('')}
          </div>
          
          <div style="background: #FFF5F5; border: 2px solid #FEB2B2; border-radius: 12px; padding: 20px; margin: 30px 0;">
            <h4 style="color: #742A2A; margin-bottom: 10px;">📋 Important Information</h4>
            <ul style="color: #742A2A; padding-left: 20px; line-height: 1.8;">
              <li>Please bring a valid ID and this email confirmation to the event</li>
              <li>Your ticket numbers are unique and non-transferable</li>
              <li>Arrive early to avoid delays at the entrance</li>
              <li>For any questions, contact our support team</li>
            </ul>
          </div>
        </div>
        
        <div class="footer">
          <div style="font-size: 18px; font-weight: 700; color: #2D3748; margin-bottom: 8px;">Edo Talent Hunt</div>
          <div style="font-size: 14px; color: #718096; margin-bottom: 20px; font-style: italic;">
            Empowering talents across Edo State and beyond
          </div>
          <div style="font-size: 13px; color: #718096; line-height: 1.5;">
            © 2024 Edo Talent Hunt. All rights reserved.<br>
            This is an automated message, please do not reply directly to this email.
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

async function testTicketEmail() {
  try {
    console.log('\n🧪 Testing ticket email service...\n');

    // Test data
    const testData = {
      firstName: 'John',
      lastName: 'Doe',
      purchaseReference: 'TKT_TEST_123456789',
      tickets: [
        {
          ticketType: 'regular',
          quantity: 2,
          unitPrice: 5000,
          totalPrice: 10000
        },
        {
          ticketType: 'vip',
          quantity: 1,
          unitPrice: 15000,
          totalPrice: 15000
        }
      ],
      ticketNumbers: [
        'ETH-REGULAR-TEST-001',
        'ETH-REGULAR-TEST-002',
        'ETH-VIP-TEST-001'
      ],
      totalAmount: 25000
    };

    const htmlContent = generateTicketEmailTemplate(
      testData.firstName,
      testData.lastName,
      testData.purchaseReference,
      testData.tickets,
      testData.ticketNumbers,
      testData.totalAmount
    );

    const mailOptions = {
      from: `"Edo Talent Hunt" <${fromEmail}>`,
      to: 'teejohn247@gmail.com',
      subject: '🎟️ Test - Your Edo Talent Hunt Tickets',
      html: htmlContent
    };

    console.log('📧 Sending test email to: teejohn247@gmail.com');
    console.log('📝 From:', fromEmail);
    console.log('📋 Subject:', mailOptions.subject);
    console.log('');

    // Verify connection first
    console.log('🔍 Verifying email service connection...');
    await transporter.verify();
    console.log('✅ Email service connection verified\n');

    // Send email
    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Test email sent successfully!');
    console.log('📧 Message ID:', info.messageId);
    console.log('📬 Response:', info.response);
    console.log('\n🎉 Email test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Failed to send test email:');
    console.error('Error:', error.message);
    if (error.code) {
      console.error('Error Code:', error.code);
    }
    if (error.response) {
      console.error('Response:', error.response);
    }
    process.exit(1);
  }
}

// Run the test
testTicketEmail();

