import { Request, Response } from 'express';
import Ticket from '../models/Ticket';
import TicketPurchase from '../models/TicketPurchase';
import PaymentTransaction from '../models/PaymentTransaction';
import crypto from 'crypto';
import emailService from '../services/emailService';
import { AuthenticatedRequest } from '../types';

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
    if (!firstName || !lastName || !email || !phone || !ticketArray || !Array.isArray(ticketArray) || ticketArray.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields: firstName, lastName, email, phone, and tickets array are required'
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
      const { ticketType, quantity } = ticketItem;

      if (!ticketType || !quantity || quantity < 1) {
        res.status(400).json({
          success: false,
          message: `Invalid ticket data: ticketType and quantity (min 1) are required for each ticket`
        });
        return;
      }

      if (!['regular', 'vip', 'table_of_5', 'table_of_10'].includes(ticketType)) {
        res.status(400).json({
          success: false,
          message: `Invalid ticket type: ${ticketType}. Must be regular, vip, table_of_5, or table_of_10`
        });
        return;
      }

      // Find ticket
      const ticket = await Ticket.findOne({ ticketType, isActive: true });

      if (!ticket) {
        res.status(404).json({
          success: false,
          message: `Ticket type ${ticketType} not found or inactive`
        });
        return;
      }

      // Check availability if quantity is limited
      if (ticket.availableQuantity !== undefined) {
        const available = ticket.availableQuantity - ticket.soldQuantity;
        if (quantity > available) {
          res.status(400).json({
            success: false,
            message: `Insufficient tickets available for ${ticketType}. Available: ${available}, Requested: ${quantity}`
          });
          return;
        }
      }

      const unitPrice = ticket.price;
      const totalPrice = unitPrice * quantity;

      ticketDetails.push({
        ticketId: ticket._id,
        ticketType: ticket.ticketType,
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
      phone,
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
export const verifyTicketPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { paymentReference } = req.params;
    const paymentData = req.body;

    // Find payment transaction
    const paymentTransaction = await PaymentTransaction.findOne({ reference: paymentReference });

    if (!paymentTransaction) {
      res.status(404).json({
        success: false,
        message: 'Payment transaction not found'
      });
      return;
    }

    // Find ticket purchase
    const ticketPurchase = await TicketPurchase.findOne({ paymentReference });

    if (!ticketPurchase) {
      res.status(404).json({
        success: false,
        message: 'Ticket purchase not found'
      });
      return;
    }

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

    // Map payment status
    let mappedStatus: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' = 'pending';
    const statusValue = paymentData.status || paymentData.transaction_status || paymentData.paymentStatus;

    if (statusValue === '0' || statusValue === 0 ||
        statusValue === 'successful' || statusValue === 'success' ||
        statusValue === 'completed' || statusValue === 'paid') {
      mappedStatus = 'completed';
    } else if (statusValue === '1' || statusValue === 1 ||
               statusValue === 'failed' || statusValue === 'failure' ||
               statusValue === 'declined' || statusValue === 'error') {
      mappedStatus = 'failed';
    } else if (statusValue === 'processing' || statusValue === 'pending') {
      mappedStatus = 'processing';
    }

    // Update payment transaction
    paymentTransaction.status = mappedStatus === 'completed' ? 'successful' : 
                                mappedStatus === 'failed' ? 'failed' : 'pending';
    paymentTransaction.gatewayResponse = paymentData;
    if (mappedStatus === 'completed') {
      paymentTransaction.processedAt = new Date();
    }
    await paymentTransaction.save();

    // If payment successful, update status (tickets already generated at purchase)
    if (mappedStatus === 'completed') {
      // Tickets are already generated at purchase time, just update payment status
      ticketPurchase.paymentStatus = 'completed';
      
      // If tickets weren't sent yet, send them now
      if (!ticketPurchase.ticketSent && ticketPurchase.ticketNumbers && ticketPurchase.ticketNumbers.length > 0) {
        try {
          await emailService.sendTicketEmail(
            ticketPurchase.email,
            ticketPurchase.firstName,
            ticketPurchase.lastName,
            ticketPurchase.purchaseReference,
            ticketPurchase.tickets,
            ticketPurchase.ticketNumbers,
            ticketPurchase.totalAmount
          );
          ticketPurchase.ticketSent = true;
          ticketPurchase.ticketSentAt = new Date();
        } catch (error: any) {
          console.error('Failed to send ticket email after payment verification:', error);
          // Don't fail if email fails
        }
      }
      
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

      const message = ticketPurchase.ticketSent
        ? 'Payment verified successfully. Tickets already sent to email.'
        : 'Payment verified successfully. Tickets sent to email.';

      res.status(200).json({
        success: true,
        message,
        data: {
          purchaseReference: ticketPurchase.purchaseReference,
          ticketNumbers: ticketPurchase.ticketNumbers || [],
          ticketSent: ticketPurchase.ticketSent,
          email: ticketPurchase.email
        }
      });
    } else {
      // Payment failed or pending
      ticketPurchase.paymentStatus = mappedStatus;
      await ticketPurchase.save();

      res.status(200).json({
        success: false,
        message: `Payment status: ${mappedStatus}`,
        data: {
          purchaseReference: ticketPurchase.purchaseReference,
          paymentStatus: mappedStatus
        }
      });
    }
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

