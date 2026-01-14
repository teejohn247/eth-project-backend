require('dotenv').config();
const mongoose = require('mongoose');

// Ticket schema
const TicketSchema = new mongoose.Schema({
  ticketType: {
    type: String,
    enum: ['regular', 'vip', 'table_of_5', 'table_of_10'],
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'NGN',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  availableQuantity: {
    type: Number,
    min: 0
  },
  soldQuantity: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

const Ticket = mongoose.model('Ticket', TicketSchema);

// Updated tickets matching the frontend
const ticketsToUpdate = [
  {
    ticketType: 'regular',
    name: 'Regular',
    description: 'Standard access - Per Person',
    price: 10000,
    currency: 'NGN',
    isActive: true
  },
  {
    ticketType: 'vip',
    name: 'VIP for Couple',
    description: 'VIP access for 2 people with premium seating',
    price: 50000,
    currency: 'NGN',
    isActive: true
  },
  {
    ticketType: 'table_of_5',
    name: 'Gold Table',
    description: 'Exclusive table seating for 5 guests',
    price: 500000,
    currency: 'NGN',
    isActive: true
  },
  {
    ticketType: 'table_of_10',
    name: 'Sponsors Table',
    description: 'Premium table seating for 10 guests',
    price: 1000000,
    currency: 'NGN',
    isActive: true
  }
];

async function updateTicketPrices() {
  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/edo-talent-hunt';
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully\n');

    console.log('📝 Updating ticket prices to match frontend...\n');

    for (const ticketData of ticketsToUpdate) {
      const result = await Ticket.findOneAndUpdate(
        { ticketType: ticketData.ticketType },
        { 
          $set: {
            name: ticketData.name,
            description: ticketData.description,
            price: ticketData.price,
            currency: ticketData.currency,
            isActive: ticketData.isActive
          }
        },
        { 
          upsert: true,
          new: true,
          runValidators: true
        }
      );

      console.log(`✅ Updated ${ticketData.ticketType}:`);
      console.log(`   Name: ${ticketData.name}`);
      console.log(`   Price: ₦${ticketData.price.toLocaleString()}`);
      console.log(`   Description: ${ticketData.description}\n`);
    }

    console.log('🎉 All ticket prices updated successfully!');
    console.log('\n📊 Current ticket pricing:');
    console.log('   Regular: ₦10,000');
    console.log('   VIP for Couple: ₦50,000');
    console.log('   Gold Table: ₦500,000');
    console.log('   Sponsors Table: ₦1,000,000');

    // Show all tickets
    console.log('\n📋 All tickets in database:');
    const allTickets = await Ticket.find({}).sort({ price: 1 });
    allTickets.forEach(ticket => {
      console.log(`\n   ${ticket.name} (${ticket.ticketType})`);
      console.log(`   - Price: ₦${ticket.price.toLocaleString()}`);
      console.log(`   - Active: ${ticket.isActive}`);
      console.log(`   - Sold: ${ticket.soldQuantity || 0}`);
    });

    // Disconnect
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating tickets:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

updateTicketPrices();

