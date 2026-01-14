const mongoose = require('mongoose');

// Hardcode the MongoDB URI with database name
const MONGODB_URI = 'mongodb+srv://teejohn247_db_user:ZVfBQ6pkysvzFGJf@cluster0.zvzgfym.mongodb.net/test';

async function updateTicketsDirectly() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    console.log('   Database: test');
    
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      family: 4 // Force IPv4
    });
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
    
    if (currentTickets.length === 0) {
      console.log('   ⚠️  No tickets found in database!');
    } else {
      currentTickets.forEach(ticket => {
        console.log(`\n   ${ticket.ticketType}:`);
        console.log(`   - Name: ${ticket.name}`);
        console.log(`   - Price: ₦${ticket.price.toLocaleString()}`);
      });
    }

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
      } else if (result.matchedCount > 0) {
        console.log(`✓ ${ticketType} already up to date\n`);
      } else {
        console.log(`⚠️  ${ticketType} not found in database\n`);
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
    console.log('   (Press F5 or click the refresh button in Compass)');

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

