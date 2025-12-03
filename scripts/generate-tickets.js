require('dotenv').config();
const mongoose = require('mongoose');

// Ticket schema (inline for script)
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

const tickets = [
  {
    ticketType: 'regular',
    name: 'Regular Ticket',
    description: 'Standard access to Edo Talent Hunt event',
    price: 5000,
    currency: 'NGN',
    isActive: true
  },
  {
    ticketType: 'vip',
    name: 'VIP Ticket',
    description: 'VIP access with premium seating and exclusive benefits',
    price: 15000,
    currency: 'NGN',
    isActive: true
  },
  {
    ticketType: 'table_of_5',
    name: 'Table of 5',
    description: 'Table seating for 5 people with premium experience',
    price: 1000000,
    currency: 'NGN',
    isActive: true
  },
  {
    ticketType: 'table_of_10',
    name: 'Table of 10',
    description: 'Table seating for 10 people with premium experience',
    price: 1500000,
    currency: 'NGN',
    isActive: true
  }
];

async function generateTickets() {
  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/edo-talent-hunt';
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully');

    // Clear existing tickets (optional - comment out if you want to keep existing)
    // await Ticket.deleteMany({});
    // console.log('🗑️  Cleared existing tickets');

    // Create or update tickets
    console.log('\n📝 Generating tickets...\n');
    
    for (const ticketData of tickets) {
      try {
        const existingTicket = await Ticket.findOne({ ticketType: ticketData.ticketType });
        
        if (existingTicket) {
          // Update existing ticket
          existingTicket.name = ticketData.name;
          existingTicket.description = ticketData.description;
          existingTicket.price = ticketData.price;
          existingTicket.currency = ticketData.currency;
          existingTicket.isActive = ticketData.isActive;
          await existingTicket.save();
          console.log(`✅ Updated ${ticketData.ticketType.toUpperCase()} ticket: ${ticketData.name} - ₦${ticketData.price.toLocaleString()}`);
        } else {
          // Create new ticket
          const ticket = new Ticket(ticketData);
          await ticket.save();
          console.log(`✅ Created ${ticketData.ticketType.toUpperCase()} ticket: ${ticketData.name} - ₦${ticketData.price.toLocaleString()}`);
        }
      } catch (error) {
        console.error(`❌ Error processing ${ticketData.ticketType} ticket:`, error.message);
      }
    }

    // Display summary
    console.log('\n📊 Ticket Summary:');
    const allTickets = await Ticket.find({ isActive: true }).sort({ price: 1 });
    allTickets.forEach(ticket => {
      console.log(`   ${ticket.ticketType.toUpperCase()}: ${ticket.name} - ₦${ticket.price.toLocaleString()} (${ticket.currency})`);
    });

    console.log('\n🎉 Ticket generation completed successfully!');
    
  } catch (error) {
    console.error('❌ Error generating tickets:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the script
generateTickets();

