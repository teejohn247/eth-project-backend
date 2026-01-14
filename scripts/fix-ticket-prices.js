require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

async function updateTicketsDirectly() {
  try {
    // Get MongoDB URI from environment - use test database
    let MONGODB_URI = process.env.MONGODB_URI;
    
    // Add database name if not present
    if (MONGODB_URI && !MONGODB_URI.includes('?') && !MONGODB_URI.endsWith('/test')) {
      MONGODB_URI = MONGODB_URI.endsWith('/') 
        ? MONGODB_URI + 'test' 
        : MONGODB_URI + '/test';
    }
    
    console.log('🔌 Connecting to MongoDB...');
    console.log('   Database: test.tickets collection');
    
    if (!MONGODB_URI) {
      console.error('❌ MONGODB_URI not found in .env file');
      process.exit(1);
    }
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected successfully');
    console.log('   Database:', mongoose.connection.name);
    console.log('   Host:', mongoose.connection.host);
    console.log();

    // Get the tickets collection directly
    const db = mongoose.connection.db;
    const ticketsCollection = db.collection('tickets');

    // Show current tickets
    console.log('📋 Current tickets in database:');
    const currentTickets = await ticketsCollection.find({}).toArray();
    currentTickets.forEach(ticket => {
      console.log(`\n   ${ticket.ticketType}:`);
      console.log(`   - Name: ${ticket.name}`);
      console.log(`   - Price: ₦${ticket.price.toLocaleString()}`);
    });

    console.log('\n\n🔄 Updating tickets to match frontend prices...\n');

    // Update each ticket
    const updates = [
      {
        ticketType: 'regular',
        update: {
          $set: {
            name: 'Regular',
            description: 'Standard access - Per Person',
            price: 10000
          }
        }
      },
      {
        ticketType: 'vip',
        update: {
          $set: {
            name: 'VIP for Couple',
            description: 'VIP access for 2 people with premium seating',
            price: 50000
          }
        }
      },
      {
        ticketType: 'table_of_5',
        update: {
          $set: {
            name: 'Gold Table',
            description: 'Exclusive table seating for 5 guests',
            price: 500000
          }
        }
      },
      {
        ticketType: 'table_of_10',
        update: {
          $set: {
            name: 'Sponsors Table',
            description: 'Premium table seating for 10 guests',
            price: 1000000
          }
        }
      }
    ];

    for (const { ticketType, update } of updates) {
      const result = await ticketsCollection.updateOne(
        { ticketType: ticketType },
        update
      );
      
      if (result.modifiedCount > 0) {
        const updatedTicket = await ticketsCollection.findOne({ ticketType: ticketType });
        console.log(`✅ Updated ${ticketType}:`);
        console.log(`   Name: ${updatedTicket.name}`);
        console.log(`   Price: ₦${updatedTicket.price.toLocaleString()}`);
        console.log(`   Modified: ${result.modifiedCount} document(s)\n`);
      } else {
        console.log(`⚠️  No changes for ${ticketType} (already up to date or not found)\n`);
      }
    }

    // Show updated tickets
    console.log('\n📊 UPDATED TICKETS:');
    const updatedTickets = await ticketsCollection.find({}).sort({ price: 1 }).toArray();
    updatedTickets.forEach(ticket => {
      console.log(`\n   ✅ ${ticket.name} (${ticket.ticketType})`);
      console.log(`      Price: ₦${ticket.price.toLocaleString()}`);
      console.log(`      Description: ${ticket.description || 'N/A'}`);
      console.log(`      Active: ${ticket.isActive}`);
    });

    console.log('\n\n🎉 Ticket prices updated successfully!');
    console.log('\n💡 Refresh MongoDB Compass to see the changes');

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
}

updateTicketsDirectly();

