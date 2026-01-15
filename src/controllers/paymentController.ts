import { Request, Response } from 'express';
import Registration from '../models/Registration';
import PaymentTransaction from '../models/PaymentTransaction';
import crypto from 'crypto';
import { AuthenticatedRequest } from '../types';

// Initialize payment
export const initializePayment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { registrationId } = req.params;
    const { amount = 1090, currency = 'NGN' } = req.body;

    // Find registration
    const registration = await Registration.findOne({
      _id: registrationId,
      userId: req.user?.userId
    });

    if (!registration) {
      res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
      return;
    }

    // Check if payment is already completed
    if (registration.paymentInfo.paymentStatus === 'completed') {
      res.status(400).json({
        success: false,
        message: 'Payment has already been completed for this registration'
      });
      return;
    }

    // Generate unique payment reference
    const reference = `ETH_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;

    // Create payment transaction record
    const transaction = new PaymentTransaction({
      registrationId,
      userId: req.user?.userId,
      reference,
      amount,
      currency,
      status: 'initiated'
    });

    await transaction.save();

    // Update registration payment info
    registration.paymentInfo.paymentReference = reference;
    registration.paymentInfo.amount = amount;
    registration.paymentInfo.currency = currency;
    registration.paymentInfo.paymentStatus = 'pending';
    await registration.save();

    // Here you would integrate with your payment gateway (Credo, Paystack, etc.)
    // For now, we'll return a mock payment URL
    const paymentData = {
      reference,
      amount,
      currency,
      email: req.user?.email,
      callback_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/callback`,
      metadata: {
        registrationId,
        userId: req.user?.userId
      }
    };

    // Mock payment gateway response
    const paymentResponse = {
      status: true,
      message: 'Authorization URL created',
      data: {
        authorization_url: `https://checkout.paystack.com/${reference}`,
        access_code: `access_${reference}`,
        reference
      }
    };

    res.status(200).json({
      success: true,
      message: 'Payment initialized successfully',
      data: {
        reference,
        authorization_url: paymentResponse.data.authorization_url,
        access_code: paymentResponse.data.access_code,
        amount,
        currency
      }
    });
  } catch (error) {
    console.error('Initialize payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initialize payment',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Verify payment
export const verifyPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { reference } = req.params;

    // Find transaction
    const transaction = await PaymentTransaction.findOne({ reference });

    if (!transaction) {
      res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
      return;
    }

    // Here you would verify payment with your payment gateway
    // For now, we'll simulate a successful verification
    const verificationResponse = {
      status: true,
      message: 'Verification successful',
      data: {
        id: crypto.randomInt(1000000, 9999999),
        domain: 'test',
        status: 'success',
        reference: reference,
        amount: transaction.amount * 100, // Amount in kobo
        message: null,
        gateway_response: 'Successful',
        paid_at: new Date().toISOString(),
        created_at: transaction.createdAt.toISOString(),
        channel: 'card',
        currency: transaction.currency,
        ip_address: req.ip,
        metadata: {
          registrationId: transaction.registrationId,
          userId: transaction.userId
        },
        log: {
          start_time: Math.floor(Date.now() / 1000),
          time_spent: 5,
          attempts: 1,
          errors: 0,
          success: true,
          mobile: false,
          input: [],
          history: []
        },
        fees: 15.75,
        fees_split: null,
        authorization: {
          authorization_code: 'AUTH_' + crypto.randomBytes(8).toString('hex'),
          bin: '408408',
          last4: '4081',
          exp_month: '12',
          exp_year: '2030',
          channel: 'card',
          card_type: 'visa DEBIT',
          bank: 'Test Bank',
          country_code: 'NG',
          brand: 'visa',
          reusable: true,
          signature: 'SIG_' + crypto.randomBytes(16).toString('hex')
        },
        customer: {
          id: crypto.randomInt(1000000, 9999999),
          first_name: null,
          last_name: null,
          email: 'customer@email.com',
          customer_code: 'CUS_' + crypto.randomBytes(8).toString('hex'),
          phone: null,
          metadata: null,
          risk_action: 'default',
          international_format_phone: null
        },
        plan_object: {},
        subaccount: {}
      }
    };

    // Update transaction status
    if (verificationResponse.data.status === 'success') {
      transaction.status = 'successful';
      transaction.gatewayReference = verificationResponse.data.id.toString();
      transaction.gatewayResponse = verificationResponse.data;
      transaction.paymentMethod = verificationResponse.data.channel;
      transaction.processedAt = new Date();
      await transaction.save();

      // Update registration payment status
      const registration = await Registration.findById(transaction.registrationId);
      if (registration) {
        registration.paymentInfo.paymentStatus = 'completed';
        registration.paymentInfo.transactionId = verificationResponse.data.id.toString();
        registration.paymentInfo.paymentMethod = verificationResponse.data.channel;
        registration.paymentInfo.paidAt = new Date();
        registration.paymentInfo.paymentResponse = verificationResponse.data;
        
        // Mark payment step as completed
        if (!registration.completedSteps.includes(7)) {
          registration.completedSteps.push(7);
        }
        registration.currentStep = Math.max(7, registration.currentStep);
        
        await registration.save();
      }

      res.status(200).json({
        success: true,
        message: 'Payment verified successfully',
        data: {
          reference,
          status: 'successful',
          amount: transaction.amount,
          currency: transaction.currency,
          paidAt: transaction.processedAt,
          gatewayResponse: verificationResponse.data
        }
      });
    } else {
      transaction.status = 'failed';
      transaction.failureReason = verificationResponse.message || 'Payment verification failed';
      await transaction.save();

      // Update registration payment status
      const registration = await Registration.findById(transaction.registrationId);
      if (registration) {
        registration.paymentInfo.paymentStatus = 'failed';
        await registration.save();
      }

      res.status(400).json({
        success: false,
        message: 'Payment verification failed',
        data: {
          reference,
          status: 'failed',
          reason: transaction.failureReason
        }
      });
    }
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Get payment status
export const getPaymentStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { registrationId } = req.params;

    const registration = await Registration.findOne({
      _id: registrationId,
      userId: req.user?.userId
    }).select('paymentInfo');

    if (!registration) {
      res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
      return;
    }

    const transaction = await PaymentTransaction.findOne({
      registrationId,
      userId: req.user?.userId
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Payment status retrieved successfully',
      data: {
        paymentStatus: registration.paymentInfo.paymentStatus,
        amount: registration.paymentInfo.amount,
        currency: registration.paymentInfo.currency,
        reference: registration.paymentInfo.paymentReference,
        paidAt: registration.paymentInfo.paidAt,
        transaction: transaction ? {
          reference: transaction.reference,
          status: transaction.status,
          paymentMethod: transaction.paymentMethod,
          processedAt: transaction.processedAt
        } : null
      }
    });
  } catch (error) {
    console.error('Get payment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve payment status',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Payment webhook handler (for Paystack/Credo webhooks)
// Original webhook handler - COMMENTED OUT
// export const handlePaymentWebhook = async (req: Request, res: Response): Promise<void> => {
//   try {
//     const payload = req.body;
//     const signature = req.headers['x-paystack-signature'] as string;

//     // Verify webhook signature (you should use your actual webhook secret)
//     const webhookSecret = process.env.PAYSTACK_WEBHOOK_SECRET || 'your-webhook-secret';
//     const hash = crypto.createHmac('sha512', webhookSecret).update(JSON.stringify(payload)).digest('hex');

//     if (hash !== signature) {
//       res.status(400).json({
//         success: false,
//         message: 'Invalid webhook signature'
//       });
//       return;
//     }

//     const { event, data } = payload;

//     if (event === 'charge.success') {
//       const { reference, status, amount, currency } = data;

//       // Find and update transaction
//       const transaction = await PaymentTransaction.findOne({ reference });
      
//       if (transaction) {
//         transaction.status = status === 'success' ? 'successful' : 'failed';
//         transaction.gatewayResponse = data;
//         transaction.processedAt = new Date();
//         await transaction.save();

//         // Update registration payment status
//         const registration = await Registration.findById(transaction.registrationId);
//         if (registration && status === 'success') {
//           registration.paymentInfo.paymentStatus = 'completed';
//           registration.paymentInfo.paidAt = new Date();
//           registration.paymentInfo.paymentResponse = data;
          
//           // Mark payment step as completed
//           if (!registration.completedSteps.includes(7)) {
//             registration.completedSteps.push(7);
//           }
//           registration.currentStep = Math.max(7, registration.currentStep);
          
//           await registration.save();
//         }
//       }
//     }

//     res.status(200).json({
//       success: true,
//       message: 'Webhook processed successfully'
//     });
//   } catch (error) {
//     console.error('Payment webhook error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Webhook processing failed',
//       error: process.env.NODE_ENV === 'development' ? error : undefined
//     });
//   }
// };

// New unified webhook handler for both registration and vote payments
// Signature verification function for Credo webhooks
const verifySignature = (signature: string, token: string, businessCode: string): boolean => {
  try {
    // Construct the signed content as per Credo docs
    const signedContent = `${token}${businessCode}`;
    
    // Create SHA512 hash
    const hash = crypto
      .createHash('sha512')
      .update(signedContent)
      .digest('hex');
    
    // Compare with provided signature
    return hash === signature;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
};

export const handlePaymentWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const payload = req.body;
    console.log({payload})
    // const signature = req.headers['x-signature'] as string;

    // if (!signature) {
    //   console.error('❌ No signature provided in webhook');
    //   res.status(401).json({
    //     success: false,
    //     message: 'No signature provided'
    //   });
    //   return;
    // }

    // // Verify webhook signature using Credo's method
    // const isValidSignature = verifySignature(
    //   signature,
    //   payload.token || payload.data?.token || '',
    //   payload.businessCode || payload.data?.businessCode || ''
    // );

    // if (!isValidSignature) {
    //   console.error('❌ Invalid webhook signature');
    //   res.status(401).json({
    //     success: false,
    //     message: 'Invalid signature'
    //   });
    //   return;
    // }

    console.log('✅ Webhook signature verified');

    console.log('📥 Vote payment webhook received:', JSON.stringify(payload, null, 2));

    // Extract data from nested structure (payload.data or direct payload)
    const data = payload.data || payload;
    
    // Extract payment reference and metadata
    const reference = data.transRef || data.reference || data.businessRef || payload.transRef || payload.reference || payload.businessRef;
    const metadata = data.metadata || payload.metadata || [];
    
    // Import Vote and Contestant models
    const Vote = (await import('../models/Vote')).default;
    const Contestant = (await import('../models/Contestant')).default;

    // Check if this payment reference has already been processed
    const existingVote = await Vote.findOne({ paymentReference: reference });
    const existingTransaction = await PaymentTransaction.findOne({ reference: reference });
    
    if (existingVote || existingTransaction) {
      console.log(`⏭️  Payment reference ${reference} already processed - ignoring webhook`);
      res.status(200).json({
        success: true,
        message: 'Payment already processed - webhook ignored'
      });
      return;
    }

    // Handle vote payment
    console.log('Processing vote payment...');
    
    // Extract vote data from metadata
    let contestantId, numberOfVotes, amountPaid;
    if (Array.isArray(metadata)) {
      const metadataMap: any = {};
      metadata.forEach((item: any) => {
        if (item.insightTag && item.insightTagValue) {
          metadataMap[item.insightTag] = item.insightTagValue;
        }
      });
      
      contestantId = metadataMap.contestantId;
      numberOfVotes = parseInt(metadataMap.votesPurchased) || 1;
      amountPaid = parseFloat(metadataMap.amountPaid) || data.transAmount || data.amount || payload.transAmount || payload.amount || 0;
    }

    // Check if payment was successful (status: 0 = success, or event is TRANSACTION.SUCCESSFUL)
    const isSuccessful = (payload.event === 'TRANSACTION.SUCCESSFUL') || 
                        (data.status === 0 || data.status === '0') || 
                        (payload.status === 0 || payload.status === '0');
    
    if (!isSuccessful) {
      console.log('❌ Vote payment failed');
      res.status(200).json({ success: true, message: 'Failed payment acknowledged' });
      return;
    }

    // Find or create vote
    let vote = await Vote.findOne({ paymentReference: reference });

    if (!vote) {
      console.log('Creating new vote record...');
      
      if (!contestantId) {
        console.error('❌ No contestant ID in metadata');
        res.status(200).json({ success: true, message: 'Webhook received but missing contestant ID' });
        return;
      }

      // Find contestant
      const contestant = await Contestant.findById(contestantId);
      if (!contestant) {
        console.error(`❌ Contestant not found: ${contestantId}`);
        res.status(200).json({ success: true, message: 'Webhook received but contestant not found' });
        return;
      }

      // Create payment transaction
      const paymentTransaction = new PaymentTransaction({
        registrationId: null,
        userId: null,
        reference: reference,
        amount: amountPaid,
        currency: data.currencyCode || payload.currencyCode || 'NGN',
        status: 'initiated',
        paymentMethod: data.paymentMethod || data.channelId?.toString() || payload.channelId?.toString() || 'unknown',
        gatewayResponse: payload
      });
      await paymentTransaction.save();

      // Extract customer info from nested structure
      const customer = data.customer || {};
      const customerEmail = customer.customerEmail || data.customerId || payload.customerId || contestant.email;
      const customerFirstName = customer.firstName || payload.customerFirstName || '';
      const customerLastName = customer.lastName || payload.customerLastName || '';
      const customerPhone = customer.phoneNo || payload.customerPhoneNumber || '';

      // Create vote
      vote = new Vote({
        contestantId: contestant._id,
        contestantEmail: customerEmail,
        numberOfVotes: numberOfVotes,
        amountPaid: amountPaid,
        currency: data.currencyCode || payload.currencyCode || 'NGN',
        voterInfo: {
          firstName: customerFirstName,
          lastName: customerLastName,
          email: customerEmail,
          phone: customerPhone
        },
        paymentReference: reference,
        paymentTransactionId: paymentTransaction._id,
        paymentStatus: 'pending',
        paymentMethod: data.paymentMethod || data.channelId?.toString() || payload.channelId?.toString() || 'unknown',
        notes: "From Webhook"
      });
      await vote.save();
    }

    // Update vote status to completed
    const previousStatus = vote.paymentStatus;
    vote.paymentStatus = 'completed';
    await vote.save();

    // Update payment transaction
    if (vote.paymentTransactionId) {
      const paymentTransaction = await PaymentTransaction.findById(vote.paymentTransactionId);
      if (paymentTransaction) {
        paymentTransaction.status = 'successful';
        paymentTransaction.gatewayResponse = payload;
        paymentTransaction.processedAt = new Date();
        await paymentTransaction.save();
      }
    }

    // Update contestant stats if not already counted
    if (previousStatus !== 'completed') {
      const contestantId = vote.contestantId && typeof vote.contestantId === 'object' && vote.contestantId._id 
        ? vote.contestantId._id 
        : vote.contestantId;
      
      const contestant = await Contestant.findById(contestantId);
      if (contestant) {
        await Contestant.updateOne(
          { _id: contestantId },
          { 
            $inc: { 
              totalVotes: vote.numberOfVotes,
              totalVoteAmount: vote.amountPaid
            }
          }
        );
        console.log(`✅ Updated contestant ${contestant.contestantNumber}: +${vote.numberOfVotes} votes, +₦${vote.amountPaid}`);
      }
    }

    console.log('✅ Vote payment processed successfully');
    res.status(200).json({
      success: true,
      message: 'Vote payment processed successfully'
    });

  } catch (error) {
    console.error('❌ Payment webhook error:', error);
    res.status(500).json({
        success: false,
      message: 'Webhook processing failed',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Handle ticket payment webhook
export const handleTicketPaymentWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const payload = req.body;
    console.log('📥 Ticket payment webhook received:', JSON.stringify(payload, null, 2));

    // Extract data from nested structure (payload.data or direct payload)
    const data = payload.data || payload;
    
    // Extract payment reference
    const reference = data.transRef || data.reference || data.businessRef || payload.transRef || payload.reference || payload.businessRef;
    
    if (!reference) {
      console.error('❌ No payment reference in webhook');
      res.status(200).json({
        success: true,
        message: 'Webhook received but no reference found'
      });
      return;
    }

    // Import TicketPurchase and Ticket models
    const TicketPurchase = (await import('../models/TicketPurchase')).default;
    const Ticket = (await import('../models/Ticket')).default;
    const emailService = (await import('../services/emailService')).default;

    // Check if this payment reference has already been processed (to avoid duplicates)
    const existingTransaction = await PaymentTransaction.findOne({ reference });
    
    if (existingTransaction && existingTransaction.status === 'successful') {
      console.log(`⏭️ Payment reference ${reference} already processed - ignoring webhook`);
      res.status(200).json({
        success: true,
        message: 'Payment already processed - webhook ignored'
      });
      return;
    }

    // Find ticket purchase by payment reference
    const ticketPurchase = await TicketPurchase.findOne({ paymentReference: reference });
    
    // if (!ticketPurchase) {
    //   console.log(`⚠️ Ticket purchase not found for reference: ${reference}`);
    //   console.log('This may be a payment initiated outside the system or a different payment type');
    //   res.status(200).json({
    //     success: true,
    //     message: 'Ticket purchase not found - webhook acknowledged'
    //   });
    //   return;
    // }

    // Check if payment was already processed (additional check)
    if (ticketPurchase.paymentStatus === 'completed') {
      console.log(`⏭️ Ticket purchase ${ticketPurchase.purchaseReference} already completed - ignoring webhook`);
      res.status(200).json({
        success: true,
        message: 'Ticket purchase already completed - webhook ignored'
      });
      return;
    }

    // Check if payment was successful (status: 0 = success, or event is TRANSACTION.SUCCESSFUL)
    const isSuccessful = (payload.event === 'TRANSACTION.SUCCESSFUL') || 
                        (data.status === 0 || data.status === '0') || 
                        (payload.status === 0 || payload.status === '0');
    
    if (!isSuccessful) {
      console.log('❌ Ticket payment failed');
      ticketPurchase.paymentStatus = 'failed';
      await ticketPurchase.save();
      
      // Update payment transaction
      const paymentTransaction = await PaymentTransaction.findOne({ reference });
      if (paymentTransaction) {
        paymentTransaction.status = 'failed';
        paymentTransaction.failureReason = data.responseMessage || payload.responseMessage || 'Payment failed';
        paymentTransaction.gatewayResponse = payload;
        await paymentTransaction.save();
      }
      
      res.status(200).json({ success: true, message: 'Failed payment acknowledged' });
      return;
    }

    console.log('✅ Payment successful - processing ticket purchase...');

    // Update payment status to completed
    const previousStatus = ticketPurchase.paymentStatus;
    ticketPurchase.paymentStatus = 'completed' as any; // Type assertion for 'completed'
    await ticketPurchase.save();

    // Update payment transaction
    const paymentTransaction = await PaymentTransaction.findOne({ reference });
    if (paymentTransaction) {
      paymentTransaction.status = 'successful';
      paymentTransaction.gatewayResponse = payload;
      paymentTransaction.processedAt = new Date();
      await paymentTransaction.save();
      console.log('✅ Payment transaction updated');
    }

    // Update sold quantities for tickets (only if not already updated)
    if ((previousStatus as string) !== 'completed') {
      for (const ticketItem of ticketPurchase.tickets) {
        const ticket = await Ticket.findById(ticketItem.ticketId);
        if (ticket) {
          ticket.soldQuantity += ticketItem.quantity;
          await ticket.save();
          console.log(`✅ Updated ticket ${ticketItem.ticketType}: +${ticketItem.quantity} sold`);
        }
      }
    }

    // Send ticket email if not already sent
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
        await ticketPurchase.save();
        console.log(`✅ Ticket email sent to ${ticketPurchase.email}`);
      } catch (emailError) {
        console.error('❌ Failed to send ticket email:', emailError);
        // Don't fail the webhook if email fails
      }
    }

    console.log('✅ Ticket payment processed successfully');
    res.status(200).json({
      success: true,
      message: 'Ticket payment processed successfully',
      data: {
        purchaseReference: ticketPurchase.purchaseReference,
        paymentReference: reference,
        ticketNumbers: ticketPurchase.ticketNumbers,
        email: ticketPurchase.email,
        ticketSent: ticketPurchase.ticketSent
      }
    });

  } catch (error) {
    console.error('❌ Ticket payment webhook error:', error);
    res.status(500).json({
      success: false,
      message: 'Webhook processing failed',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};



// Refund payment (admin only)
export const refundPayment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { reference } = req.params;
    const { reason } = req.body;

    // Check admin role
    if (req.user?.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.'
      });
      return;
    }

    const transaction = await PaymentTransaction.findOne({ reference });

    if (!transaction) {
      res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
      return;
    }

    if (transaction.status !== 'successful') {
      res.status(400).json({
        success: false,
        message: 'Only successful transactions can be refunded'
      });
      return;
    }

    // Here you would process refund with your payment gateway
    // For now, we'll simulate a successful refund
    const refundResponse = {
      status: true,
      message: 'Refund successful',
      data: {
        transaction: {
          reference,
          amount: transaction.amount,
          currency: transaction.currency,
          status: 'refunded',
          refunded_at: new Date().toISOString()
        }
      }
    };

    // Update transaction status
    transaction.status = 'refunded';
    transaction.gatewayResponse = { ...transaction.gatewayResponse, refund: refundResponse.data };
    await transaction.save();

    // Update registration payment status
    const registration = await Registration.findById(transaction.registrationId);
    if (registration) {
      registration.paymentInfo.paymentStatus = 'refunded';
      await registration.save();
    }

    res.status(200).json({
      success: true,
      message: 'Payment refunded successfully',
      data: {
        reference,
        amount: transaction.amount,
        currency: transaction.currency,
        reason,
        refundedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Refund payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process refund',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Save flexible payment info
export const savePaymentInfo = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { registrationId } = req.params;
    const paymentData = req.body; // Accept any structure from frontend
    
    // Extract userId from payment data if provided
    const { userId: bodyUserId, ...actualPaymentData } = paymentData;

    // Validate that we have some payment data
    if (!actualPaymentData || Object.keys(actualPaymentData).length === 0) {
      res.status(400).json({
        success: false,
        message: 'Payment data is required'
      });
      return;
    }

    // Find registration using multiple strategies:
    // 1. registrationId from params
    // 2. userId from request body
    // 3. authenticated user's userId
    let registration;
    
    if (registrationId && registrationId !== 'undefined' && registrationId !== 'null') {
      // Try to find by registration ID first
      registration = await Registration.findOne({
        _id: registrationId,
        userId: req.user?.userId
      });
    }
    
    // If not found by registrationId, try to find by userId from body or authenticated user
    if (!registration) {
      const targetUserId = bodyUserId || req.user?.userId;
      registration = await Registration.findOne({
        userId: targetUserId
      });
      
      // Ensure the authenticated user has permission to access this registration
      if (registration && registration.userId.toString() !== req.user?.userId) {
        res.status(403).json({
          success: false,
          message: 'Unauthorized to access this registration'
        });
        return;
      }
    }

    if (!registration) {
      res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
      return;
    }

    // Extract common payment fields if they exist in the frontend data
    const {
      reference,
      amount,
      transAmount, // Payment gateways often use transAmount instead of amount
      currency = 'NGN',
      status,
      gateway,
      transactionId,
      paymentMethod,
      email,
      ...otherData
    } = actualPaymentData;

    // Use transAmount if available, otherwise fallback to amount
    const paymentAmount = transAmount ? parseFloat(transAmount.toString()) : (amount ? parseFloat(amount.toString()) : null);

    // Generate reference if not provided
    const paymentReference = reference || `ETH_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;

    // Create or update payment transaction
    let transaction = await PaymentTransaction.findOne({
      registrationId: registration._id,
      userId: req.user?.userId
    });

    if (!transaction) {
      transaction = new PaymentTransaction({
        registrationId: registration._id,
        userId: req.user?.userId,
        reference: paymentReference,
        amount: paymentAmount || 0, // Remove default 1090, use 0 if no amount provided
        currency: currency,
        status: status == 0 || status == '0' ? 'successful' : "pending"
      });
    } 

    // Update transaction with flexible data
    if (paymentAmount) transaction.amount = paymentAmount;
    if (currency) transaction.currency = currency;
    if (paymentMethod) transaction.paymentMethod = paymentMethod;
    if (transactionId) transaction.gatewayReference = transactionId;
    
    // Map status values to our enum (flexible handling for different gateways)
    if (status) {
      let mappedStatus: 'initiated' | 'pending' | 'successful' | 'failed' | 'cancelled' | 'refunded' = 'pending'; // default
      
      // Handle different status formats from various payment gateways
      if (status === 'successful' || status === 'success' || status === 'completed' || 
          status === '0' || status === 0 || status === 'SUCCESSFUL' || 
          status === 'SUCCESS' || status === 'COMPLETED') {
        mappedStatus = 'successful';
        transaction.processedAt = new Date();
      } else if (status === 'failed' || status === 'failure' || status === 'error' || 
                 status === '1' || status === 1 || status === 'FAILED' || 
                 status === 'FAILURE' || status === 'ERROR') {
        mappedStatus = 'failed';
      } else if (status === 'pending' || status === 'processing' || status === 'initiated' ||
                 status === 'PENDING' || status === 'PROCESSING' || status === 'INITIATED') {
        mappedStatus = 'pending';
      } else if (status === 'cancelled' || status === 'canceled' || status === 'CANCELLED' || 
                 status === 'CANCELED') {
        mappedStatus = 'cancelled';
      }
      
      transaction.status = mappedStatus;
    }
    
    // Store all payment data in gatewayResponse for flexibility
    transaction.gatewayResponse = {
      ...transaction.gatewayResponse,
      frontendData: actualPaymentData,
      updatedAt: new Date()
    };

    await transaction.save();

    // Map payment status for registration (using same logic as transaction)
    let registrationPaymentStatus = 'pending';
    if (status === 'successful' || status === 'success' || status === 'completed' || 
        status === '0' || status === 0 || status === 'SUCCESSFUL' || 
        status === 'SUCCESS' || status === 'COMPLETED') {
      registrationPaymentStatus = 'completed';
    } else if (status === 'failed' || status === 'failure' || status === 'error' || 
               status === '1' || status === 1 || status === 'FAILED' || 
               status === 'FAILURE' || status === 'ERROR') {
      registrationPaymentStatus = 'failed';
    }

    // Update registration payment info with flexible structure
    registration.paymentInfo = {
      ...registration.paymentInfo,
      paymentReference: paymentReference,
      amount: paymentAmount || registration.paymentInfo.amount, // Use paymentAmount (transAmount or amount)
      currency: currency,
      paymentStatus: registrationPaymentStatus,
      transactionId: transactionId || transaction.gatewayReference,
      paymentMethod: paymentMethod,
      paymentResponse: actualPaymentData,
      paidAt: registrationPaymentStatus === 'completed' ? new Date() : registration.paymentInfo.paidAt
    };

    // Handle bulk registration payment
    if (registration.registrationType === 'bulk' && registration.bulkRegistrationId) {
      try {
        const { BulkRegistration } = await import('../models');
        const bulkRegistration = await BulkRegistration.findById(registration.bulkRegistrationId);
        
        if (bulkRegistration) {
          // Update bulk registration payment info
          bulkRegistration.paymentInfo = {
            paymentStatus: registrationPaymentStatus === 'completed' ? 'completed' : 
                          registrationPaymentStatus === 'failed' ? 'failed' : 'pending',
            paymentReference: paymentReference,
            transactionId: transactionId || transaction.gatewayReference,
            paymentMethod: paymentMethod,
            paidAt: registrationPaymentStatus === 'completed' ? new Date() : undefined,
            paymentResponse: actualPaymentData
          };

          // Update bulk registration status
          if (registrationPaymentStatus === 'completed') {
            bulkRegistration.status = 'active';
            
            // Update user role to sponsor when they successfully pay for bulk registration
            try {
              const { User } = await import('../models');
              await User.findByIdAndUpdate(bulkRegistration.ownerId, { role: 'sponsor' });
              console.log(`✅ Updated user ${bulkRegistration.ownerId} role to sponsor after bulk payment`);
            } catch (error) {
              console.error('Failed to update user role to sponsor:', error);
              // Don't fail payment processing if role update fails
            }
          } else if (registrationPaymentStatus === 'failed') {
            bulkRegistration.status = 'payment_pending';
          }

          await bulkRegistration.save();
        }
      } catch (error) {
        console.error('Failed to update bulk registration payment:', error);
        // Don't fail the main payment processing if bulk update fails
      }
    }

    // Mark payment step as completed if payment is successful
    if (registration.paymentInfo.paymentStatus === 'completed') {
      const paymentStep = 8; // Payment is step 8
      if (!registration.completedSteps.includes(paymentStep)) {
        registration.completedSteps.push(paymentStep);
        registration.currentStep = Math.max(registration.currentStep, paymentStep);
      }
      
      // For bulk registrations, don't auto-submit since the flow continues with adding participants
      // For regular registrations, auto-submit when payment is completed
      if (registration.registrationType !== 'bulk' && registration.status === 'draft') {
        registration.status = 'submitted';
        registration.submittedAt = new Date();
      }
    }

    await registration.save();

    // Prepare response data
    const responseData: any = {
      registrationId: registration._id,
      paymentReference: paymentReference,
      paymentStatus: registration.paymentInfo.paymentStatus,
      amount: registration.paymentInfo.amount,
      currency: registration.paymentInfo.currency,
      transactionId: transaction.gatewayReference,
      currentStep: registration.currentStep,
      completedSteps: registration.completedSteps,
      registrationStatus: registration.status,
      savedData: paymentData // Return what was saved for confirmation
    };

    // Add bulk registration information if applicable
    if (registration.registrationType === 'bulk' && registration.bulkRegistrationId) {
      try {
        const { BulkRegistration } = await import('../models');
        const bulkRegistration = await BulkRegistration.findById(registration.bulkRegistrationId);
        
        if (bulkRegistration) {
          responseData.bulkRegistration = {
            bulkRegistrationId: bulkRegistration._id,
            bulkRegistrationNumber: bulkRegistration.bulkRegistrationNumber,
            totalSlots: bulkRegistration.totalSlots,
            usedSlots: bulkRegistration.usedSlots,
            availableSlots: bulkRegistration.availableSlots,
            status: bulkRegistration.status,
            canAddParticipants: bulkRegistration.status === 'active',
            nextStep: bulkRegistration.status === 'active' ? 'add_participants' : 'payment',
            addParticipantEndpoint: bulkRegistration.status === 'active' ? 
              `/api/v1/registrations/${registration._id}/participants` : undefined
          };
        }
      } catch (error) {
        console.error('Failed to fetch bulk registration info for response:', error);
      }
    }

    const message = registration.registrationType === 'bulk' && registration.paymentInfo.paymentStatus === 'completed' 
      ? 'Bulk payment processed successfully. You can now add participants.'
      : 'Payment information saved successfully';

    res.status(200).json({
      success: true,
      message: message,
      data: responseData
    });

  } catch (error) {
    console.error('Save payment info error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save payment information',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Get all payment transactions with filtering
export const getAllPayments = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      paymentMethod,
      currency,
      userId,
      registrationId,
      startDate,
      endDate,
      amountMin,
      amountMax,
      search
    } = req.query;

    // Build filter object - always filter by authenticated user
    const filter: any = {
      userId: req.user?.userId // Only show payments for the authenticated user
    };

    // Status filter
    if (status) {
      filter.status = status;
    }

    // Payment method filter
    if (paymentMethod) {
      filter.paymentMethod = paymentMethod;
    }

    // Currency filter
    if (currency) {
      filter.currency = currency;
    }

    // Note: userId parameter is ignored - always use authenticated user's ID

    // Registration ID filter
    if (registrationId) {
      filter.registrationId = registrationId;
    }

    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate as string);
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate as string);
      }
    }

    // Amount range filter
    if (amountMin || amountMax) {
      filter.amount = {};
      if (amountMin) {
        filter.amount.$gte = parseFloat(amountMin as string);
      }
      if (amountMax) {
        filter.amount.$lte = parseFloat(amountMax as string);
      }
    }

    // Search filter (reference, gatewayReference)
    if (search) {
      filter.$or = [
        { reference: { $regex: search, $options: 'i' } },
        { gatewayReference: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * limitNumber;

    // Get total count for pagination
    const totalCount = await PaymentTransaction.countDocuments(filter);

    // Get payments with population
    const payments = await PaymentTransaction.find(filter)
      .populate('userId', 'firstName lastName email')
      .populate('registrationId', 'registrationNumber registrationType status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber)
      .lean();

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limitNumber);
    const hasNextPage = pageNumber < totalPages;
    const hasPrevPage = pageNumber > 1;

    res.status(200).json({
      success: true,
      message: 'Payment transactions retrieved successfully',
      data: {
        payments,
        pagination: {
          currentPage: pageNumber,
          totalPages,
          totalCount,
          limit: limitNumber,
          hasNextPage,
          hasPrevPage
        },
        filters: {
          status,
          paymentMethod,
          currency,
          registrationId,
          startDate,
          endDate,
          amountMin,
          amountMax,
          search
        }
      }
    });
  } catch (error: any) {
    console.error('Get all payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve payment transactions',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Update payment transaction (admin only)
export const updatePaymentTransaction = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { reference } = req.params;
    const updateData = req.body;

    // Check admin role
    if (req.user?.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.'
      });
      return;
    }

    // Validate that we have some update data
    if (!updateData || Object.keys(updateData).length === 0) {
      res.status(400).json({
        success: false,
        message: 'Update data is required'
      });
      return;
    }

    // Find transaction by reference (since endpoint now uses reference parameter)
    // Always try to find by reference first, then fallback to ObjectId if it looks like one
    let transaction;
    
    // Check if it looks like a MongoDB ObjectId (24 hex characters)
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(reference);
    
    if (isObjectId) {
      // Try ObjectId first for valid ObjectId format
      transaction = await PaymentTransaction.findById(reference);
    } else {
      // For anything else (including ETH references), search by reference field
      transaction = await PaymentTransaction.findOne({ reference: reference });
    }

    if (!transaction) {
      res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
      return;
    }

    // Extract updatable fields
    const {
      status,
      amount,
      transAmount, // Alternative amount field used by some gateways
      debitedAmount, // Another alternative amount field
      currency,
      currencyCode, // Alternative currency field
      paymentMethod,
      gatewayReference,
      failureReason,
      gatewayResponse,
      notes, // Admin notes
      ...otherData
    } = updateData;

    // Track what was changed for audit
    const changes: any = {};
    const oldValues: any = {};

    // Update status if provided (with flexible status mapping)
    let statusToUpdate = status;
    
    // Map various status formats to our enum
    if (statusToUpdate !== undefined) {
      if (statusToUpdate === 'successful' || statusToUpdate === 'success' || statusToUpdate === 'completed' || 
          statusToUpdate === '0' || statusToUpdate === 0 || statusToUpdate === 'SUCCESSFUL' || 
          statusToUpdate === 'SUCCESS' || statusToUpdate === 'COMPLETED') {
        statusToUpdate = 'successful';
      } else if (statusToUpdate === 'failed' || statusToUpdate === 'failure' || statusToUpdate === 'error' || 
                 statusToUpdate === '1' || statusToUpdate === 1 || statusToUpdate === 'FAILED' || 
                 statusToUpdate === 'FAILURE' || statusToUpdate === 'ERROR') {
        statusToUpdate = 'failed';
      } else if (statusToUpdate === 'initiated' || statusToUpdate === 'INITIATED') {
        statusToUpdate = 'initiated';
      } else if (statusToUpdate === 'cancelled' || statusToUpdate === 'canceled' || statusToUpdate === 'CANCELLED' || 
                 statusToUpdate === 'CANCELED') {
        statusToUpdate = 'cancelled';
      } else if (statusToUpdate === 'pending' || statusToUpdate === 'processing' || statusToUpdate === 'PENDING' || 
                 statusToUpdate === 'PROCESSING') {
        statusToUpdate = 'pending';
      }
    }
    
    if (statusToUpdate && ['initiated', 'pending', 'successful', 'failed', 'cancelled', 'refunded'].includes(statusToUpdate)) {
      if (transaction.status !== statusToUpdate) {
        oldValues.status = transaction.status;
        changes.status = statusToUpdate;
        transaction.status = statusToUpdate;

        // Set processedAt for successful transactions
        if (statusToUpdate === 'successful' && !transaction.processedAt) {
          transaction.processedAt = new Date();
          changes.processedAt = transaction.processedAt;
        }
      }
    }

    // Update amount if provided (check multiple possible field names)
    let amountToUpdate = amount;
    if (amountToUpdate === undefined && transAmount !== undefined) {
      amountToUpdate = transAmount;
    }
    if (amountToUpdate === undefined && debitedAmount !== undefined) {
      amountToUpdate = debitedAmount;
    }
    
    if (amountToUpdate !== undefined) {
      const newAmount = parseFloat(amountToUpdate.toString());
      if (!isNaN(newAmount) && transaction.amount !== newAmount) {
        oldValues.amount = transaction.amount;
        changes.amount = newAmount;
        transaction.amount = newAmount;
      }
    }

    // Update currency if provided (check multiple possible field names)
    let currencyToUpdate = currency;
    if (!currencyToUpdate && currencyCode) {
      currencyToUpdate = currencyCode;
    }
    
    if (currencyToUpdate && transaction.currency !== currencyToUpdate) {
      oldValues.currency = transaction.currency;
      changes.currency = currencyToUpdate;
      transaction.currency = currencyToUpdate;
    }

    // Update payment method if provided
    if (paymentMethod && transaction.paymentMethod !== paymentMethod) {
      oldValues.paymentMethod = transaction.paymentMethod;
      changes.paymentMethod = paymentMethod;
      transaction.paymentMethod = paymentMethod;
    }

    // Update gateway reference if provided
    if (gatewayReference && transaction.gatewayReference !== gatewayReference) {
      oldValues.gatewayReference = transaction.gatewayReference;
      changes.gatewayReference = gatewayReference;
      transaction.gatewayReference = gatewayReference;
    }

    // Update failure reason if provided
    if (failureReason !== undefined) {
      if (transaction.failureReason !== failureReason) {
        oldValues.failureReason = transaction.failureReason;
        changes.failureReason = failureReason;
        transaction.failureReason = failureReason;
      }
    }

    // Update gateway response if provided (merge with existing)
    if (gatewayResponse) {
      const updatedGatewayResponse = {
        ...transaction.gatewayResponse,
        ...gatewayResponse,
        adminUpdate: {
          updatedAt: new Date(),
          updatedBy: req.user?.userId,
          changes: changes
        }
      };
      transaction.gatewayResponse = updatedGatewayResponse;
      changes.gatewayResponse = 'updated';
    }

    // Add admin notes if provided
    if (notes) {
      const adminNotes = {
        note: notes,
        addedBy: req.user?.userId,
        addedAt: new Date()
      };
      
      if (!transaction.gatewayResponse) {
        transaction.gatewayResponse = {};
      }
      
      if (!transaction.gatewayResponse.adminNotes) {
        transaction.gatewayResponse.adminNotes = [];
      }
      
      transaction.gatewayResponse.adminNotes.push(adminNotes);
      changes.adminNotes = 'added';
    }

    // Update the transaction
    transaction.updatedAt = new Date();
    await transaction.save();

    // Update corresponding registration if transaction status changed to successful or failed
    if (changes.status) {
      const registration = await Registration.findById(transaction.registrationId);
      if (registration) {
        let registrationPaymentStatus = registration.paymentInfo.paymentStatus;
        
        if (changes.status === 'successful') {
          registrationPaymentStatus = 'completed';
          registration.paymentInfo.paidAt = new Date();
          
          // Mark payment step as completed
          const paymentStep = 8;
          if (!registration.completedSteps.includes(paymentStep)) {
            registration.completedSteps.push(paymentStep);
            registration.currentStep = Math.max(registration.currentStep, paymentStep);
          }
          
          // Auto-submit non-bulk registrations
          if (registration.registrationType !== 'bulk' && registration.status === 'draft') {
            registration.status = 'submitted';
            registration.submittedAt = new Date();
          }
        } else if (changes.status === 'failed') {
          registrationPaymentStatus = 'failed';
        } else if (changes.status === 'refunded') {
          registrationPaymentStatus = 'refunded';
        }

        // Update registration payment info
        registration.paymentInfo.paymentStatus = registrationPaymentStatus;
        if (changes.amount) registration.paymentInfo.amount = changes.amount;
        if (changes.currency) registration.paymentInfo.currency = changes.currency;
        if (changes.paymentMethod) registration.paymentInfo.paymentMethod = changes.paymentMethod;
        if (changes.gatewayReference) registration.paymentInfo.transactionId = changes.gatewayReference;

        await registration.save();

        // Handle bulk registration updates
        if (registration.registrationType === 'bulk' && registration.bulkRegistrationId) {
          try {
            const { BulkRegistration } = await import('../models');
            const bulkRegistration = await BulkRegistration.findById(registration.bulkRegistrationId);
            
            if (bulkRegistration) {
              bulkRegistration.paymentInfo.paymentStatus = registrationPaymentStatus;
              if (changes.currency) bulkRegistration.currency = changes.currency;
              if (changes.paymentMethod) bulkRegistration.paymentInfo.paymentMethod = changes.paymentMethod;
              if (changes.gatewayReference) bulkRegistration.paymentInfo.transactionId = changes.gatewayReference;

              // Update total amount if amount changed
              if (changes.amount) {
                bulkRegistration.totalAmount = changes.amount;
                // Recalculate price per slot if needed
                if (bulkRegistration.totalSlots > 0) {
                  bulkRegistration.pricePerSlot = changes.amount / bulkRegistration.totalSlots;
                }
              }

              // Update bulk registration status
              if (registrationPaymentStatus === 'completed') {
                bulkRegistration.status = 'active';
                bulkRegistration.paymentInfo.paidAt = new Date();
                
                // Update user role to sponsor
                try {
                  const { User } = await import('../models');
                  await User.findByIdAndUpdate(bulkRegistration.ownerId, { role: 'sponsor' });
                  console.log(`✅ Updated user ${bulkRegistration.ownerId} role to sponsor after payment update`);
                } catch (error) {
                  console.error('Failed to update user role to sponsor:', error);
                }
              } else if (registrationPaymentStatus === 'failed') {
                bulkRegistration.status = 'payment_pending';
              }

              await bulkRegistration.save();
            }
          } catch (error) {
            console.error('Failed to update bulk registration:', error);
          }
        }
      }
    }

    // Prepare response
    const responseData = {
      transactionId: transaction._id,
      reference: transaction.reference,
      status: transaction.status,
      amount: transaction.amount,
      currency: transaction.currency,
      paymentMethod: transaction.paymentMethod,
      gatewayReference: transaction.gatewayReference,
      processedAt: transaction.processedAt,
      updatedAt: transaction.updatedAt,
      changes: changes,
      oldValues: oldValues
    };

    res.status(200).json({
      success: true,
      message: 'Payment transaction updated successfully',
      data: responseData
    });

  } catch (error: any) {
    console.error('Update payment transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update payment transaction',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Create transaction from frontend payload
export const createTransaction = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { registrationId } = req.params;
    const transactionData = req.body;

    // Validate that we have transaction data
    if (!transactionData || Object.keys(transactionData).length === 0) {
      res.status(400).json({
        success: false,
        message: 'Transaction data is required'
      });
      return;
    }

    // Check admin role
    if (req.user?.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.'
      });
      return;
    }

    // Find registration (admin can access any registration)
    console.log(`🔍 Admin looking for registration ${registrationId}`);
    
    const registration = await Registration.findById(registrationId);

    if (!registration) {
      console.log(`❌ Registration not found: ${registrationId}`);
      
      res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
      return;
    }

    console.log(`✅ Registration found: ${registration._id} (User: ${registration.userId})`);

    // Extract transaction fields from payload
    const {
      reference,
      amount,
      transAmount, // Some gateways use transAmount
      currency = 'NGN',
      status = 'pending',
      paymentMethod,
      gateway,
      transactionId,
      gatewayReference,
      email,
      ...otherData
    } = transactionData;

    // Use transAmount if available, otherwise use amount
    const transactionAmount = transAmount ? parseFloat(transAmount.toString()) : 
                              (amount ? parseFloat(amount.toString()) : 1090);

    // Generate reference if not provided
    const transactionReference = reference || `ETH_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;

    // Check if transaction with this reference already exists
    const existingTransaction = await PaymentTransaction.findOne({ 
      reference: transactionReference 
    });

    if (existingTransaction) {
      res.status(409).json({
        success: false,
        message: 'Transaction with this reference already exists',
        data: {
          existingReference: transactionReference,
          existingStatus: existingTransaction.status
        }
      });
      return;
    }

    // Map status to our enum
    let mappedStatus: 'initiated' | 'pending' | 'successful' | 'failed' | 'cancelled' | 'refunded' = 'pending';
    
    if (status === 'successful' || status === 'success' || status === 'completed' || 
        status === '0' || status === 0 || status === 'SUCCESSFUL' || 
        status === 'SUCCESS' || status === 'COMPLETED') {
      mappedStatus = 'successful';
    } else if (status === 'failed' || status === 'failure' || status === 'error' || 
               status === '1' || status === 1 || status === 'FAILED' || 
               status === 'FAILURE' || status === 'ERROR') {
      mappedStatus = 'failed';
    } else if (status === 'initiated' || status === 'INITIATED') {
      mappedStatus = 'initiated';
    } else if (status === 'cancelled' || status === 'canceled' || status === 'CANCELLED' || 
               status === 'CANCELED') {
      mappedStatus = 'cancelled';
    }

    // Create new transaction
    const transaction = new PaymentTransaction({
      registrationId: registration._id,
      userId: registration.userId, // Use the registration's user ID, not the admin's
      reference: transactionReference,
      amount: transactionAmount,
      currency: currency,
      status: mappedStatus,
      paymentMethod: paymentMethod,
      gatewayReference: transactionId || gatewayReference,
      gatewayResponse: {
        frontendData: transactionData,
        createdAt: new Date(),
        createdByAdmin: req.user?.userId // Track which admin created this
      }
    });

    // Set processedAt if transaction is successful
    if (mappedStatus === 'successful') {
      transaction.processedAt = new Date();
    }

    await transaction.save();

    // Update registration payment info
    const registrationPaymentStatus = mappedStatus === 'successful' ? 'completed' : 
                                     mappedStatus === 'failed' ? 'failed' : 'pending';

    registration.paymentInfo = {
      ...registration.paymentInfo,
      paymentReference: transactionReference,
      amount: transactionAmount,
      currency: currency,
      paymentStatus: registrationPaymentStatus,
      transactionId: transaction.gatewayReference,
      paymentMethod: paymentMethod,
      paymentResponse: transactionData,
      paidAt: mappedStatus === 'successful' ? new Date() : registration.paymentInfo.paidAt
    };

    // Update registration steps and status if payment is successful
    if (mappedStatus === 'successful') {
      const paymentStep = 8; // Payment is step 8
      if (!registration.completedSteps.includes(paymentStep)) {
        registration.completedSteps.push(paymentStep);
        registration.currentStep = Math.max(registration.currentStep, paymentStep);
      }
      
      // For regular registrations, auto-submit when payment is completed
      // For bulk registrations, don't auto-submit since the flow continues with adding participants
      if (registration.registrationType !== 'bulk' && registration.status === 'draft') {
        registration.status = 'submitted';
        registration.submittedAt = new Date();
      }
    }

    // Handle bulk registration updates
    if (registration.registrationType === 'bulk' && registration.bulkRegistrationId) {
      try {
        const { BulkRegistration } = await import('../models');
        const bulkRegistration = await BulkRegistration.findById(registration.bulkRegistrationId);
        
        if (bulkRegistration) {
          bulkRegistration.paymentInfo = {
            paymentStatus: registrationPaymentStatus === 'completed' ? 'completed' : 
                          registrationPaymentStatus === 'failed' ? 'failed' : 'pending',
            paymentReference: transactionReference,
            transactionId: transaction.gatewayReference,
            paymentMethod: paymentMethod,
            paidAt: mappedStatus === 'successful' ? new Date() : undefined,
            paymentResponse: transactionData
          };

          // Update bulk registration status
          if (mappedStatus === 'successful') {
            bulkRegistration.status = 'active';
            
            // Update user role to sponsor when they successfully pay for bulk registration
            try {
              const { User } = await import('../models');
              await User.findByIdAndUpdate(bulkRegistration.ownerId, { role: 'sponsor' });
              console.log(`✅ Updated user ${bulkRegistration.ownerId} role to sponsor after transaction creation`);
            } catch (error) {
              console.error('Failed to update user role to sponsor:', error);
            }
          } else if (mappedStatus === 'failed') {
            bulkRegistration.status = 'payment_pending';
          }

          await bulkRegistration.save();
        }
      } catch (error) {
        console.error('Failed to update bulk registration:', error);
        // Don't fail the main transaction creation if bulk update fails
      }
    }

    await registration.save();

    // Prepare response data
    const responseData: any = {
      transactionId: transaction._id,
      reference: transactionReference,
      status: mappedStatus,
      amount: transactionAmount,
      currency: currency,
      paymentMethod: paymentMethod,
      gatewayReference: transaction.gatewayReference,
      registrationId: registration._id,
      registrationStatus: registration.status,
      currentStep: registration.currentStep,
      completedSteps: registration.completedSteps,
      paymentStatus: registration.paymentInfo.paymentStatus,
      createdAt: transaction.createdAt,
      processedAt: transaction.processedAt
    };

    // Add bulk registration information if applicable
    if (registration.registrationType === 'bulk' && registration.bulkRegistrationId) {
      try {
        const { BulkRegistration } = await import('../models');
        const bulkRegistration = await BulkRegistration.findById(registration.bulkRegistrationId);
        
        if (bulkRegistration) {
          responseData.bulkRegistration = {
            bulkRegistrationId: bulkRegistration._id,
            bulkRegistrationNumber: bulkRegistration.bulkRegistrationNumber,
            totalSlots: bulkRegistration.totalSlots,
            usedSlots: bulkRegistration.usedSlots,
            availableSlots: bulkRegistration.availableSlots,
            status: bulkRegistration.status,
            canAddParticipants: bulkRegistration.status === 'active' && mappedStatus === 'successful',
            nextStep: bulkRegistration.status === 'active' ? 'add_participants' : 'payment'
          };
        }
      } catch (error) {
        console.error('Failed to fetch bulk registration info for response:', error);
      }
    }

    const message = registration.registrationType === 'bulk' && mappedStatus === 'successful'
      ? 'Transaction created successfully. You can now add participants to your bulk registration.'
      : mappedStatus === 'successful' 
        ? 'Transaction created successfully. Payment completed.'
        : 'Transaction created successfully.';

    res.status(201).json({
      success: true,
      message: message,
      data: responseData
    });

  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create transaction',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};
