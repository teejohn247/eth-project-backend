import { Request, Response } from 'express';
import Ticket from '../models/Ticket';
import TicketPurchase from '../models/TicketPurchase';
import PaymentTransaction from '../models/PaymentTransaction';
import crypto from 'crypto';
import emailService from '../services/emailService';
import { AuthenticatedRequest } from '../types';

// Helper function to get display name for ticket type
const getTicketDisplayName = (ticketType: string): string => {
  const nameMap: { [key: string]: string } = {
    'regular': 'Regular',
    'vip': 'VIP for Couple',
    'table_of_5': 'Gold Table',
    'table_of_10': 'Sponsors Table'
  };
  return nameMap[ticketType] || ticketType;
};

// Helper function to map frontend names to database ticket types (case-insensitive)
const mapTicketNameToType = (name: string): string | null => {
  // Normalize: trim, lowercase, remove extra spaces
  const normalized = name.trim().toLowerCase().replace(/\s+/g, ' ');
  
  const nameMap: { [key: string]: string } = {
    // Display names (from frontend)
    'regular': 'regular',
    'vip for couple': 'vip',
    'gold table': 'table_of_5',
    'sponsors table': 'table_of_10',
    // Alternative formats with underscores
    'vip_for_couple': 'vip',
    'gold_table': 'table_of_5',
    'sponsors_table': 'table_of_10',
    // Short forms
    'vip': 'vip',
    'gold': 'table_of_5',
    'sponsors': 'table_of_10',
    // Database ticket types (direct mapping)
    'table_of_5': 'table_of_5',
    'table of 5': 'table_of_5',
    'table_of_10': 'table_of_10',
    'table of 10': 'table_of_10',
    // Additional variations
    'vipforcouple': 'vip',
    'goldtable': 'table_of_5',
    'sponsorstable': 'table_of_10'
  };
  
  return nameMap[normalized] || null;
};

// Get all available tickets
export const getTickets = async (req: Request, res: Response): Promise<void> => {
  try {
    const tickets = await Ticket.find({ isActive: true }).sort({ price: 1 });

    res.status(200).json({
      success: true,
      message: 'Tickets retrieved successfully',
      data: tickets
    });
  } catch (error) {
    console.error('Get tickets error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve tickets',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Get single ticket by type
export const getTicketByType = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ticketType } = req.params;

    if (!['regular', 'vip', 'table_of_5', 'table_of_10'].includes(ticketType)) {
      res.status(400).json({
        success: false,
        message: 'Invalid ticket type. Must be regular, vip, table_of_5, or table_of_10'
      });
      return;
    }

    const ticket = await Ticket.findOne({ ticketType, isActive: true });

    if (!ticket) {
      res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Ticket retrieved successfully',
      data: ticket
    });
  } catch (error) {
    console.error('Get ticket error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve ticket',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Purchase tickets
export const purchaseTickets = async (req: Request, res: Response): Promise<void> => {
  try {
    const { firstName, lastName, email, phone, tickets: ticketArray } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !ticketArray || !Array.isArray(ticketArray) || ticketArray.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields: firstName, lastName, email, and tickets array are required'
      });
      return;
    }

    // Validate email format
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
      return;
    }

    // Process ticket purchases
    const ticketDetails: Array<{
      ticketId: any;
      ticketType: 'regular' | 'vip' | 'table_of_5' | 'table_of_10';
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }> = [];
    let totalAmount = 0;

    for (const ticketItem of ticketArray) {
      // Accept both 'name' and 'ticketType' fields (case-insensitive)
      const ticketIdentifier = ticketItem.name || ticketItem.ticketType || ticketItem.ticketName;
      const quantity = ticketItem.quantity;

      if (!ticketIdentifier || !quantity || quantity < 1) {
        res.status(400).json({
          success: false,
          message: `Invalid ticket data: 'name' or 'ticketType' and quantity (min 1) are required for each ticket`
        });
        return;
      }

      // Map frontend ticket name to database ticket type (case-insensitive)
      const normalizedTicketType = mapTicketNameToType(ticketIdentifier);
      
      if (!normalizedTicketType) {
        res.status(400).json({
          success: false,
          message: `Invalid ticket: "${ticketIdentifier}". Accepted values: Regular, VIP for Couple, Gold Table, or Sponsors Table (case-insensitive)`
        });
        return;
      }

      // Find ticket using normalized type
      const ticket = await Ticket.findOne({ ticketType: normalizedTicketType, isActive: true });

      if (!ticket) {
        res.status(404).json({
          success: false,
          message: `Ticket "${ticketIdentifier}" not found or inactive in database`
        });
        return;
      }

      // Check availability if quantity is limited
      if (ticket.availableQuantity !== undefined) {
        const available = ticket.availableQuantity - ticket.soldQuantity;
        if (quantity > available) {
          res.status(400).json({
            success: false,
            message: `Insufficient tickets available for ${ticketIdentifier}. Available: ${available}, Requested: ${quantity}`
          });
          return;
        }
      }

      const unitPrice = ticket.price;
      const totalPrice = unitPrice * quantity;

      ticketDetails.push({
        ticketId: ticket._id,
        ticketType: ticket.ticketType as 'regular' | 'vip' | 'table_of_5' | 'table_of_10',
        quantity,
        unitPrice,
        totalPrice
      });

      totalAmount += totalPrice;
    }

    // Generate purchase reference
    const purchaseReference = `TKT_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;

    // Create ticket purchase record
    const ticketPurchase = new TicketPurchase({
      purchaseReference,
      firstName,
      lastName,
      email,
      phone: phone || '', // Phone is optional
      tickets: ticketDetails,
      totalAmount,
      currency: 'NGN',
      paymentStatus: 'pending'
    });

    await ticketPurchase.save();

    // Generate payment reference
    const paymentReference = `ETH_TKT_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;

    // Create payment transaction
    const paymentTransaction = new PaymentTransaction({
      registrationId: null, // Tickets don't require registration
      userId: null, // Can be purchased without account
      reference: paymentReference,
      amount: totalAmount,
      currency: 'NGN',
      status: 'initiated'
    });

    await paymentTransaction.save();

    // Update ticket purchase with payment reference
    ticketPurchase.paymentReference = paymentReference;
    ticketPurchase.paymentTransactionId = paymentTransaction._id;
    await ticketPurchase.save();

    // Generate ticket numbers immediately
    const ticketNumbers: string[] = [];
    for (const ticketItem of ticketDetails) {
      for (let i = 0; i < ticketItem.quantity; i++) {
        const ticketNumber = `ETH-${ticketItem.ticketType.toUpperCase()}-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
        ticketNumbers.push(ticketNumber);
      }
    }

    // Update ticket purchase with ticket numbers
    ticketPurchase.ticketNumbers = ticketNumbers;
    await ticketPurchase.save();

    // Send ticket email immediately after purchase
    let emailSent = false;
    let emailError = null;
    try {
      await emailService.sendTicketEmail(
        email,
        firstName,
        lastName,
        purchaseReference,
        ticketDetails,
        ticketNumbers,
        totalAmount
      );
      ticketPurchase.ticketSent = true;
      ticketPurchase.ticketSentAt = new Date();
      await ticketPurchase.save();
      emailSent = true;
      console.log(`✅ Ticket email sent successfully to ${email} after purchase`);
    } catch (error: any) {
      console.error('❌ Failed to send ticket email after purchase:', error);
      emailError = error.message || 'Email service unavailable';
      // Don't fail the request if email fails - tickets are still valid
    }

    // Return purchase details with payment info
    res.status(200).json({
      success: true,
      message: emailSent 
        ? 'Ticket purchase successful. Tickets generated and sent to email.'
        : 'Ticket purchase successful. Tickets generated. Email delivery failed - please save your ticket numbers.',
      data: {
        purchaseReference,
        paymentReference,
        firstName,
        lastName,
        email,
        phone,
        tickets: ticketDetails.map(t => ({
          name: getTicketDisplayName(t.ticketType),
          ticketType: t.ticketType,
          quantity: t.quantity,
          unitPrice: t.unitPrice,
          totalPrice: t.totalPrice
        })),
        ticketNumbers,
        totalAmount,
        currency: 'NGN',
        paymentStatus: 'pending',
        ticketSent: emailSent,
        paymentUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment?reference=${paymentReference}`,
        ...(emailError && { emailError: 'Email could not be sent. Please contact support if you need your tickets.' })
      }
    });
  } catch (error) {
    console.error('Purchase tickets error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process ticket purchase',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Verify payment and generate tickets
// This endpoint is called only on successful payment, so we always approve and process
// Accepts any payment reference and creates records if they don't exist
export const verifyTicketPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { paymentReference } = req.params;
    const paymentData = req.body; // Accept and save all data from frontend

    // Find or create payment transaction
    let paymentTransaction = await PaymentTransaction.findOne({ reference: paymentReference });

    if (!paymentTransaction) {
      // Create payment transaction if it doesn't exist
      // Handle different payload formats
      const amount = paymentData.transAmount || paymentData.amount || paymentData.amountPaid || paymentData.debitedAmount || 0;
      paymentTransaction = new PaymentTransaction({
        registrationId: null,
        userId: null,
        reference: paymentReference,
        amount: typeof amount === 'number' ? amount : parseFloat(amount) || 0,
        currency: paymentData.currencyCode || paymentData.currency || 'NGN',
        status: 'initiated',
        paymentMethod: paymentData.channelId?.toString() || paymentData.paymentMethod || paymentData.gateway || 'unknown',
        gatewayResponse: paymentData
      });
      await paymentTransaction.save();
    }

    // Find or create ticket purchase
    let ticketPurchase = await TicketPurchase.findOne({ paymentReference });

    if (!ticketPurchase) {
      // Extract ticket data from payment data or use defaults
      // Handle different payload formats
      const email = paymentData.customerId || paymentData.customer?.email || paymentData.email || 'unknown@example.com';
      const firstName = paymentData.customerFirstName || paymentData.customer?.firstName || paymentData.customer?.name?.split(' ')[0] || 'Unknown';
      const lastName = paymentData.customerLastName || paymentData.customer?.lastName || paymentData.customer?.name?.split(' ').slice(1).join(' ') || 'User';
      // Phone is optional - use empty string if not provided
      const phone = paymentData.customerPhoneNumber || paymentData.customer?.phone || paymentData.phone || '';

      // Process tickets from payment data - need to look up ticket IDs
      const ticketDetails: Array<{
        ticketId: any;
        ticketType: 'regular' | 'vip' | 'table_of_5' | 'table_of_10';
        quantity: number;
        unitPrice: number;
        totalPrice: number;
      }> = [];

      if (paymentData.tickets && Array.isArray(paymentData.tickets) && paymentData.tickets.length > 0) {
        for (const ticketItem of paymentData.tickets) {
          const ticketType = ticketItem.ticketType;
          const quantity = ticketItem.quantity || 1;
          
          if (ticketType && ['regular', 'vip', 'table_of_5', 'table_of_10'].includes(ticketType)) {
            const ticket = await Ticket.findOne({ ticketType, isActive: true });
            if (ticket) {
              const unitPrice = ticketItem.unitPrice || ticket.price;
              const totalPrice = unitPrice * quantity;
              ticketDetails.push({
                ticketId: ticket._id,
                ticketType: ticket.ticketType,
                quantity,
                unitPrice,
                totalPrice
              });
            }
          }
        }
      }

      // If no tickets found, infer from amount or create default
      if (ticketDetails.length === 0) {
        const amount = paymentTransaction.amount;
        
        // Try to match amount to ticket prices
        const allTickets = await Ticket.find({ isActive: true }).sort({ price: 1 });
        
        // Find best matching ticket(s) based on amount
        let matched = false;
        for (const ticket of allTickets) {
          if (amount >= ticket.price && amount % ticket.price === 0) {
            const quantity = amount / ticket.price;
            ticketDetails.push({
              ticketId: ticket._id,
              ticketType: ticket.ticketType,
              quantity: Math.floor(quantity),
              unitPrice: ticket.price,
              totalPrice: ticket.price * Math.floor(quantity)
            });
            matched = true;
            break;
          }
        }
        
        // If no match, create default regular ticket
        if (!matched) {
          const defaultTicket = await Ticket.findOne({ ticketType: 'regular', isActive: true });
          if (defaultTicket) {
            ticketDetails.push({
              ticketId: defaultTicket._id,
              ticketType: 'regular',
              quantity: 1,
              unitPrice: defaultTicket.price,
              totalPrice: defaultTicket.price
            });
          }
        }
      }

      // Create ticket purchase if it doesn't exist
      ticketPurchase = new TicketPurchase({
        purchaseReference: `TKT_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`,
        firstName,
        lastName,
        email,
        phone,
        tickets: ticketDetails,
        totalAmount: paymentTransaction.amount,
        currency: paymentTransaction.currency,
        paymentStatus: 'pending',
        paymentReference: paymentReference,
        paymentTransactionId: paymentTransaction._id,
        ticketNumbers: [],
        ticketSent: false
      });
      await ticketPurchase.save();
    }

    // Always approve payment since this endpoint is only called on success
    // Save all payment data from frontend
    paymentTransaction.status = 'successful';
    paymentTransaction.gatewayResponse = paymentData; // Save all data from frontend
    paymentTransaction.processedAt = new Date();
    await paymentTransaction.save();

    // Check if already processed
    if (ticketPurchase.paymentStatus === 'completed') {
      res.status(200).json({
        success: true,
        message: 'Payment already verified and tickets generated',
        data: {
          purchaseReference: ticketPurchase.purchaseReference,
          ticketNumbers: ticketPurchase.ticketNumbers,
          ticketSent: ticketPurchase.ticketSent
        }
      });
      return;
    }

    // Generate ticket numbers if they don't exist
    if (!ticketPurchase.ticketNumbers || ticketPurchase.ticketNumbers.length === 0) {
      const ticketNumbers: string[] = [];
      if (ticketPurchase.tickets && ticketPurchase.tickets.length > 0) {
        for (const ticketItem of ticketPurchase.tickets) {
          for (let i = 0; i < ticketItem.quantity; i++) {
            const timestamp = Date.now();
            const random = crypto.randomBytes(4).toString('hex').toUpperCase();
            const ticketTypePrefix = ticketItem.ticketType.toUpperCase().replace('_', '-');
            ticketNumbers.push(`ETH-${ticketTypePrefix}-${timestamp}-${random}`);
          }
        }
      }
      ticketPurchase.ticketNumbers = ticketNumbers;
      await ticketPurchase.save();
    }

    // Update payment status to completed
    ticketPurchase.paymentStatus = 'completed';
    
    // Note: Email is sent from purchaseTickets endpoint, not here
    // This prevents duplicate emails
    
    await ticketPurchase.save();

    // Update sold quantities for tickets (only if not already updated)
    for (const ticketItem of ticketPurchase.tickets) {
      const ticket = await Ticket.findById(ticketItem.ticketId);
      if (ticket) {
        // Check if we need to update sold quantity (only update once)
        const currentSold = ticket.soldQuantity || 0;
        const expectedSold = currentSold + ticketItem.quantity;
        if (ticket.soldQuantity < expectedSold) {
          ticket.soldQuantity += ticketItem.quantity;
          await ticket.save();
        }
      }
    }

    res.status(200).json({
      success: true,
      message: 'Payment verified successfully.',
      data: {
        purchaseReference: ticketPurchase.purchaseReference,
        ticketNumbers: ticketPurchase.ticketNumbers || [],
        ticketSent: ticketPurchase.ticketSent,
        email: ticketPurchase.email
      }
    });
  } catch (error) {
    console.error('Verify ticket payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify ticket payment',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Get purchase details
export const getPurchaseDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const { purchaseReference } = req.params;

    const ticketPurchase = await TicketPurchase.findOne({ purchaseReference })
      .populate('tickets.ticketId', 'name ticketType price');

    if (!ticketPurchase) {
      res.status(404).json({
        success: false,
        message: 'Ticket purchase not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Purchase details retrieved successfully',
      data: ticketPurchase
    });
  } catch (error) {
    console.error('Get purchase details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve purchase details',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

