import dotenv from 'dotenv';
dotenv.config();
import { connectDatabase, disconnectDatabase } from '../src/utils/database';
import mongoose from 'mongoose';
import Ticket from '../src/models/Ticket';

async function cleanupTickets() {
  try {
    // Connect to MongoDB
    await connectDatabase();
    console.log('✅ Connected to MongoDB');

    // Get the Ticket collection directly to delete VVIP
    const TicketCollection = mongoose.connection.collection('tickets');
    
    // Delete VVIP ticket
    const result = await TicketCollection.deleteOne({ ticketType: 'vvip' });
    
    if (result.deletedCount > 0) {
      console.log('✅ Deleted VVIP ticket');
    } else {
      console.log('ℹ️  No VVIP ticket found to delete');
    }

    // Display active tickets
    const activeTickets = await Ticket.find({ isActive: true }).sort({ price: 1 });
    
    console.log('\n📊 Active Tickets in Database:');
    console.log('─'.repeat(60));
    activeTickets.forEach((ticket: any) => {
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

cleanupTickets();

