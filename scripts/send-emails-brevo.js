const nodemailer = require('nodemailer');
const fs = require('fs');
require('dotenv').config();

// Brevo SMTP Configuration
const SMTP_CONFIG = {
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: '99c77c001@smtp-brevo.com',
    pass: process.env.BREVO_SMTP_KEY // Store the key in .env file
  }
};

// Email recipients with their details
const recipients = [
  { 
    name: 'Divine Agbonlahor Osawoname', 
    email: 'evanchenthesurgeon@gmail.com', 
    file: '1-divine-evanchenthesurgeon',
    password: 'MightyHawk364%'
  },
  { 
    name: 'Divine Agbonlahor Osawoname', 
    email: 'classicosonic7@gmail.com', 
    file: '2-divine-classicosonic7',
    password: 'OceanSwift249&'
  },
  { 
    name: 'Osayande Uwa Matthew', 
    email: 'benardgregory935@gmail.com', 
    file: '3-osayande-benardgregory935',
    password: 'MountainBear517$'
  },
  { 
    name: 'Minloveth Owenaze', 
    email: 'lovethowenaze85@gmail.com', 
    file: '4-minloveth-lovethowenaze85',
    password: 'CrystalNoble365$'
  },
  { 
    name: 'Cha Nath', 
    email: 'omofowaaroma@gmail.com', 
    file: '5-cha-omofowaaroma',
    password: 'ApexCrystal515*'
  },
  { 
    name: 'OSEMWENGIE EHIZPRAIZE', 
    email: 'ehizpraize58@gmail.com', 
    file: '6-osemwengie-ehizpraize58',
    password: 'TigerMighty823&'
  },
  { 
    name: 'Osas Paul', 
    email: 'osasokunrobo1@gmail.com', 
    file: '7-osas-osasokunrobo1',
    password: 'TigerPrime540%'
  }
];

async function sendActivationEmails() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('SENDING ACTIVATION EMAILS VIA BREVO');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Create transporter
  const transporter = nodemailer.createTransport(SMTP_CONFIG);

  // Verify connection
  try {
    await transporter.verify();
    console.log('✅ SMTP connection verified\n');
  } catch (error) {
    console.error('❌ SMTP connection failed:', error.message);
    console.log('\nPlease make sure BREVO_SMTP_KEY is set in your .env file');
    process.exit(1);
  }

  const results = [];

  // Send emails to each recipient
  for (const recipient of recipients) {
    console.log(`Sending to: ${recipient.email}`);
    
    try {
      // Read HTML email content
      const htmlContent = fs.readFileSync(`emails/${recipient.file}.html`, 'utf8');
      const textContent = fs.readFileSync(`emails/${recipient.file}.txt`, 'utf8');

      // Email options
      const mailOptions = {
        from: '"Edo Talent Hunt" <edotalenthunt@themakersacad.com>',
        to: recipient.email,
        subject: 'Your Edo Talent Hunt Account Has Been Activated',
        text: textContent,
        html: htmlContent
      };

      // Send email
      const info = await transporter.sendMail(mailOptions);
      
      console.log(`✅ Email sent successfully`);
      console.log(`   Message ID: ${info.messageId}`);
      console.log(`   Name: ${recipient.name}`);
      console.log(`   Password: ${recipient.password}\n`);
      
      results.push({ 
        ...recipient, 
        status: 'sent', 
        messageId: info.messageId 
      });
      
      // Wait 1 second between emails to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`❌ Failed to send to ${recipient.email}`);
      console.error(`   Error: ${error.message}\n`);
      
      results.push({ 
        ...recipient, 
        status: 'failed', 
        error: error.message 
      });
    }
  }

  // Print summary
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('EMAIL SENDING SUMMARY');
  console.log('═══════════════════════════════════════════════════════════\n');

  const successful = results.filter(r => r.status === 'sent');
  const failed = results.filter(r => r.status === 'failed');

  console.log(`Total emails: ${results.length}`);
  console.log(`Successfully sent: ${successful.length}`);
  console.log(`Failed: ${failed.length}\n`);

  if (successful.length > 0) {
    console.log('✅ SUCCESSFULLY SENT:\n');
    successful.forEach((r, i) => {
      console.log(`${i + 1}. ${r.email}`);
      console.log(`   Name: ${r.name}`);
      console.log(`   Password: ${r.password}`);
      console.log(`   Message ID: ${r.messageId}\n`);
    });
  }

  if (failed.length > 0) {
    console.log('❌ FAILED TO SEND:\n');
    failed.forEach((r, i) => {
      console.log(`${i + 1}. ${r.email}`);
      console.log(`   Error: ${r.error}\n`);
    });
  }

  console.log('═══════════════════════════════════════════════════════════');
}

// Run the script
sendActivationEmails().catch(console.error);

