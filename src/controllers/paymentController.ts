import { Request, Response } from 'express';
import Registration from '../models/Registration';
import PaymentTransaction from '../models/PaymentTransaction';
import crypto from 'crypto';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

// Initialize payment
export const initializePayment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { registrationId } = req.params;
    const { amount = 1090, currency = 'NGN' } = req.body;

    // Find registration
    const registration = await Registration.findOne({
      _id: registrationId,
      userId: req.user?.id
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
      userId: req.user?.id,
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
        userId: req.user?.id
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
      userId: req.user?.id
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
      userId: req.user?.id
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
export const handlePaymentWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const payload = req.body;
    const signature = req.headers['x-paystack-signature'] as string;

    // Verify webhook signature (you should use your actual webhook secret)
    const webhookSecret = process.env.PAYSTACK_WEBHOOK_SECRET || 'your-webhook-secret';
    const hash = crypto.createHmac('sha512', webhookSecret).update(JSON.stringify(payload)).digest('hex');

    if (hash !== signature) {
      res.status(400).json({
        success: false,
        message: 'Invalid webhook signature'
      });
      return;
    }

    const { event, data } = payload;

    if (event === 'charge.success') {
      const { reference, status, amount, currency } = data;

      // Find and update transaction
      const transaction = await PaymentTransaction.findOne({ reference });
      
      if (transaction) {
        transaction.status = status === 'success' ? 'successful' : 'failed';
        transaction.gatewayResponse = data;
        transaction.processedAt = new Date();
        await transaction.save();

        // Update registration payment status
        const registration = await Registration.findById(transaction.registrationId);
        if (registration && status === 'success') {
          registration.paymentInfo.paymentStatus = 'completed';
          registration.paymentInfo.paidAt = new Date();
          registration.paymentInfo.paymentResponse = data;
          
          // Mark payment step as completed
          if (!registration.completedSteps.includes(7)) {
            registration.completedSteps.push(7);
          }
          registration.currentStep = Math.max(7, registration.currentStep);
          
          await registration.save();
        }
      }
    }

    res.status(200).json({
      success: true,
      message: 'Webhook processed successfully'
    });
  } catch (error) {
    console.error('Payment webhook error:', error);
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
