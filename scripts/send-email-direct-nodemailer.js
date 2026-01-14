// Direct email sending script with fresh EmailService initialization
const path = require('path');
const fs = require('fs');

// Import nodemailer from node_modules
const nodemailer = require('nodemailer');

// Load environment - check if .env exists
const dotenv = require('dotenv');
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log('✅ .env file loaded');
} else {
  console.log('⚠️  No .env file found, using hardcoded values');
}

// Email config
const EMAIL_CONFIG = {
  host: process.env.BREVO_SMTP_HOST || 'smtp-relay.brevo.com',
  port: parseInt(process.env.BREVO_SMTP_PORT || '465'),
  secure: true,
  auth: {
    user: process.env.BREVO_SMTP_USER || 'teejohn247@gmail.com',
    pass: process.env.BREVO_SMTP_PASSWORD || '7mLKdgFUxq0T8Zra'
  }
};

console.log('📧 Email Configuration:');
console.log('   Host:', EMAIL_CONFIG.host);
console.log('   Port:', EMAIL_CONFIG.port);
console.log('   User:', EMAIL_CONFIG.auth.user);
console.log('   Has Password:', !!EMAIL_CONFIG.auth.pass);
console.log();

const TicketPdfGenerator = require('../dist/utils/ticketPdfGenerator').TicketPdfGenerator;

async function sendEmail() {
  try {
    console.log('🎟️ Generating test tickets...\n');

    const purchaseData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'teejohn247@gmail.com',
      purchaseReference: `ETH-2026-${Date.now().toString().slice(-6)}`,
      purchaseDate: new Date(),
      totalAmount: 70000
    };

    const tickets = [
      { ticketNumber: 'ETH-2026-REG001', ticketType: 'regular', price: 10000 },
      { ticketNumber: 'ETH-2026-REG002', ticketType: 'regular', price: 10000 },
      { ticketNumber: 'ETH-2026-VIP001', ticketType: 'vip', price: 50000 }
    ];

    const ticketSummary = [
      { ticketType: 'REGULAR', quantity: 2, unitPrice: 10000, totalPrice: 20000 },
      { ticketType: 'VIP', quantity: 1, unitPrice: 50000, totalPrice: 50000 }
    ];

    console.log('📋 Purchase Details:');
    console.log('   Name:', purchaseData.firstName, purchaseData.lastName);
    console.log('   Email:', purchaseData.email);
    console.log('   Reference:', purchaseData.purchaseReference);
    console.log('   Total:', `₦${purchaseData.totalAmount.toLocaleString()}`);

    // Generate PDF
    console.log('\n📄 Generating PDF tickets...');
    const pdfBuffer = await TicketPdfGenerator.generateAllTicketsPdf(tickets, purchaseData);
    console.log('✅ PDF generated:', (pdfBuffer.length / 1024 / 1024).toFixed(2), 'MB');

    // Generate email HTML (inline from emailService template structure)
    const ticketItems = ticketSummary.map((ticket, index) => {
      const isVIP = ticket.ticketType.toUpperCase().includes('VIP') || ticket.ticketType.toUpperCase().includes('COUPLE');
      return `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: ${index < ticketSummary.length - 1 ? '1px solid #27272A' : 'none'};">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 700; ${isVIP ? 'background: rgba(251, 191, 36, 0.15); color: #FBBF24;' : 'background: #27272A; color: #A1A1AA;'}">
              ${ticket.quantity}×
            </div>
            <div>
              <p style="color: #FFFFFF; font-size: 15px; font-weight: 600; margin: 0 0 4px 0; text-transform: uppercase;">${ticket.ticketType}</p>
              <p style="color: #71717A; font-size: 13px; margin: 0;">₦${ticket.unitPrice.toLocaleString()}/ticket</p>
            </div>
          </div>
          <p style="color: #FFFFFF; font-weight: 700; margin: 0; font-size: 16px;">₦${ticket.totalPrice.toLocaleString()}</p>
        </div>
      `;
    }).join('');

    const ticketNumberCards = tickets.map((t, index) => `
      <div style="position: relative; background: #27272A; border-radius: 12px; padding: 12px 16px; margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <span style="color: #FBBF24; font-size: 18px;">🎟️</span>
          <span style="color: #FFFFFF; font-family: 'Courier New', monospace; font-size: 14px;">${t.ticketNumber}</span>
        </div>
        <span style="color: #52525B; font-size: 12px;">#${index + 1}</span>
      </div>
    `).join('');

    // Read the preview HTML template
    const htmlPath = path.join(__dirname, '..', 'ticket-email-updated-preview.html');
    let htmlTemplate = fs.readFileSync(htmlPath, 'utf8');
    
    // Replace placeholders
    htmlTemplate = htmlTemplate.replace('Hi John!', `Hi ${purchaseData.firstName}!`);
    htmlTemplate = htmlTemplate.replace('TEST-1768390703326', purchaseData.purchaseReference);
    htmlTemplate = htmlTemplate.replace('₦70,000</span>', `₦${purchaseData.totalAmount.toLocaleString()}</span>`);

    // Create transporter
    console.log('\n📤 Creating email transporter...');
    const transporter = nodemailer.createTransporter(EMAIL_CONFIG);

    // Verify connection
    console.log('🔌 Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified\n');

    // Send email
    console.log('📧 Sending email to', purchaseData.email, '...');
    const info = await transporter.sendMail({
      from: `"Edo Talent Hunt" <${EMAIL_CONFIG.auth.user}>`,
      to: purchaseData.email,
      subject: `Your Edo Talent Hunt Tickets - ${purchaseData.purchaseReference}`,
      html: htmlTemplate,
      attachments: [
        {
          filename: `edo-talent-hunt-tickets-${purchaseData.purchaseReference}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    });

    console.log('\n✅ Email sent successfully!');
    console.log('   Message ID:', info.messageId);
    console.log('   Response:', info.response);
    console.log('\n📬 Check teejohn247@gmail.com inbox (and spam folder)');
    console.log('🎨 The email includes:');
    console.log('   • Performers collage image (from Cloudinary)');
    console.log('   • Edo Talent Hunt logo badge');
    console.log('   • Dark theme design');
    console.log('   • PDF ticket attachment (' + (pdfBuffer.length / 1024 / 1024).toFixed(2) + ' MB)');
    console.log('   • Ticket numbers:', tickets.map(t => t.ticketNumber).join(', '));

  } catch (error) {
    console.error('\n❌ Error:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

sendEmail();

