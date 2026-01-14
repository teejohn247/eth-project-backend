require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Import the ticket PDF generator
const { TicketPdfGenerator } = require('../dist/utils/ticketPdfGenerator');

async function previewTicketDesign() {
  try {
    console.log('🎨 Generating ticket design preview...\n');

    // Create sample tickets for each type
    const sampleTickets = [
      {
        ticketNumber: 'ETH-REG-001',
        ticketType: 'regular',
        price: 10000
      },
      {
        ticketNumber: 'ETH-VIP-001',
        ticketType: 'vip',
        price: 50000
      },
      {
        ticketNumber: 'ETH-GOLD-001',
        ticketType: 'table_of_5',
        price: 500000
      },
      {
        ticketNumber: 'ETH-SPONSOR-001',
        ticketType: 'table_of_10',
        price: 1000000
      }
    ];

    const purchaseData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      purchaseReference: 'PREVIEW-001',
      purchaseDate: new Date('2026-01-14T16:00:00Z'),
      totalAmount: 1560000
    };

    console.log('📝 Generating PDF with sample tickets...');
    const pdfBuffer = await TicketPdfGenerator.generateAllTicketsPdf(sampleTickets, purchaseData);

    // Save to file
    const outputPath = path.join(__dirname, '../preview-tickets.pdf');
    fs.writeFileSync(outputPath, pdfBuffer);

    console.log(`✅ Ticket preview generated successfully!`);
    console.log(`📄 File saved to: ${outputPath}\n`);
    console.log('📋 Preview includes:');
    console.log('   - Regular Ticket (Orange/Red)');
    console.log('   - VIP for Couple (Pink/Magenta)');
    console.log('   - Gold Table (Black)');
    console.log('   - Sponsors Table (Blue)\n');
    console.log('💡 Open the PDF file to review the design before sending to emails.');

  } catch (error) {
    console.error('❌ Error generating ticket preview:', error);
    process.exit(1);
  }
}

// Run the preview
previewTicketDesign();


