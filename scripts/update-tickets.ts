import dotenv from 'dotenv';
dotenv.config();
import { connectDatabase, disconnectDatabase } from '../src/utils/database';
import Ticket from '../src/models/Ticket';

async function updateTickets() {
  try {
    // Connect to MongoDB
    await connectDatabase();
    console.log('✅ Connected to MongoDB');

    const tickets = [
      { 
        ticketType: 'regular', 
        name: 'Regular', 
        description: 'Standard access to Edo Talent Hunt event', 
        price: 5000, 
        currency: 'NGN', 
        isActive: true 
      },
      { 
        ticketType: 'vip', 
        name: 'VIP', 
        description: 'VIP access with premium seating and exclusive benefits', 
        price: 15000, 
        currency: 'NGN', 
        isActive: true 
      },
      { 
        ticketType: 'table_of_5', 
        name: 'Table of 5', 
        description: 'Exclusive table seating for 5 guests', 
        price: 1000000, 
        currency: 'NGN', 
        isActive: true 
      },
      { 
        ticketType: 'table_of_10', 
        name: 'Table of 10', 
        description: 'Premium table seating for 10 guests', 
        price: 1500000, 
        currency: 'NGN', 
        isActive: true 
      }
    ];

    console.log('\n📝 Updating tickets in database...\n');

    for (const ticketData of tickets) {
      const existingTicket = await Ticket.findOne({ ticketType: ticketData.ticketType });

      if (existingTicket) {
        // Update existing ticket
        existingTicket.name = ticketData.name;
        existingTicket.description = ticketData.description;
        existingTicket.price = ticketData.price;
        existingTicket.currency = ticketData.currency;
        existingTicket.isActive = ticketData.isActive;
        await existingTicket.save();
        console.log(`✅ Updated: ${ticketData.name} - ₦${ticketData.price.toLocaleString()}`);
      } else {
        // Create new ticket
        const newTicket = new Ticket({
          ...ticketData,
          soldQuantity: 0
        });
        await newTicket.save();
        console.log(`✅ Created: ${ticketData.name} - ₦${ticketData.price.toLocaleString()}`);
      }
    }

    // Display all tickets
    const allTickets = await Ticket.find({}).sort({ price: 1 });
    console.log('\n📊 Current Tickets in Database:');
    console.log('─'.repeat(60));
    allTickets.forEach((ticket) => {
      console.log(`   ${ticket.name.padEnd(15)} | ₦${ticket.price.toLocaleString().padStart(12)} | ${ticket.ticketType}`);
    });
    console.log('─'.repeat(60));

    await disconnectDatabase();
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await disconnectDatabase();
    process.exit(1);
  }
}

updateTickets();

