"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPurchaseDetails = exports.verifyTicketPayment = exports.purchaseTickets = exports.getTicketByType = exports.getTickets = void 0;
const Ticket_1 = __importDefault(require("../models/Ticket"));
const TicketPurchase_1 = __importDefault(require("../models/TicketPurchase"));
const PaymentTransaction_1 = __importDefault(require("../models/PaymentTransaction"));
const crypto_1 = __importDefault(require("crypto"));
const emailService_1 = __importDefault(require("../services/emailService"));
const getTicketDisplayName = (ticketType) => {
    const nameMap = {
        'regular': 'Regular',
        'vip': 'VIP for Couple',
        'table_of_5': 'Gold Table',
        'table_of_10': 'Sponsors Table'
    };
    return nameMap[ticketType] || ticketType;
};
const mapTicketNameToType = (name) => {
    const normalized = name.trim().toLowerCase().replace(/\s+/g, ' ');
    const nameMap = {
        'regular': 'regular',
        'vip for couple': 'vip',
        'gold table': 'table_of_5',
        'sponsors table': 'table_of_10',
        'vip_for_couple': 'vip',
        'gold_table': 'table_of_5',
        'sponsors_table': 'table_of_10',
        'vip': 'vip',
        'gold': 'table_of_5',
        'sponsors': 'table_of_10',
        'table_of_5': 'table_of_5',
        'table of 5': 'table_of_5',
        'table_of_10': 'table_of_10',
        'table of 10': 'table_of_10',
        'vipforcouple': 'vip',
        'goldtable': 'table_of_5',
        'sponsorstable': 'table_of_10'
    };
    return nameMap[normalized] || null;
};
const getTickets = async (req, res) => {
    try {
        const tickets = await Ticket_1.default.find({ isActive: true }).sort({ price: 1 });
        res.status(200).json({
            success: true,
            message: 'Tickets retrieved successfully',
            data: tickets
        });
    }
    catch (error) {
        console.error('Get tickets error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve tickets',
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
};
exports.getTickets = getTickets;
const getTicketByType = async (req, res) => {
    try {
        const { ticketType } = req.params;
        if (!['regular', 'vip', 'table_of_5', 'table_of_10'].includes(ticketType)) {
            res.status(400).json({
                success: false,
                message: 'Invalid ticket type. Must be regular, vip, table_of_5, or table_of_10'
            });
            return;
        }
        const ticket = await Ticket_1.default.findOne({ ticketType, isActive: true });
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
    }
    catch (error) {
        console.error('Get ticket error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve ticket',
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
};
exports.getTicketByType = getTicketByType;
const purchaseTickets = async (req, res) => {
    try {
        const { firstName, lastName, email, phone, tickets: ticketArray } = req.body;
        if (!firstName || !lastName || !email || !ticketArray || !Array.isArray(ticketArray) || ticketArray.length === 0) {
            res.status(400).json({
                success: false,
                message: 'Missing required fields: firstName, lastName, email, and tickets array are required'
            });
            return;
        }
        const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
        if (!emailRegex.test(email)) {
            res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });
            return;
        }
        const ticketDetails = [];
        let totalAmount = 0;
        for (const ticketItem of ticketArray) {
            const ticketIdentifier = ticketItem.name || ticketItem.ticketType || ticketItem.ticketName;
            const quantity = ticketItem.quantity;
            if (!ticketIdentifier || !quantity || quantity < 1) {
                res.status(400).json({
                    success: false,
                    message: `Invalid ticket data: 'name' or 'ticketType' and quantity (min 1) are required for each ticket`
                });
                return;
            }
            const normalizedTicketType = mapTicketNameToType(ticketIdentifier);
            if (!normalizedTicketType) {
                res.status(400).json({
                    success: false,
                    message: `Invalid ticket: "${ticketIdentifier}". Accepted values: Regular, VIP for Couple, Gold Table, or Sponsors Table (case-insensitive)`
                });
                return;
            }
            const ticket = await Ticket_1.default.findOne({ ticketType: normalizedTicketType, isActive: true });
            if (!ticket) {
                res.status(404).json({
                    success: false,
                    message: `Ticket "${ticketIdentifier}" not found or inactive in database`
                });
                return;
            }
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
                ticketType: ticket.ticketType,
                quantity,
                unitPrice,
                totalPrice
            });
            totalAmount += totalPrice;
        }
        const purchaseReference = `TKT_${Date.now()}_${crypto_1.default.randomBytes(8).toString('hex')}`;
        const ticketPurchase = new TicketPurchase_1.default({
            purchaseReference,
            firstName,
            lastName,
            email,
            phone: phone || '',
            tickets: ticketDetails,
            totalAmount,
            currency: 'NGN',
            paymentStatus: 'pending'
        });
        await ticketPurchase.save();
        const paymentReference = `ETH_TKT_${Date.now()}_${crypto_1.default.randomBytes(8).toString('hex')}`;
        const paymentTransaction = new PaymentTransaction_1.default({
            registrationId: null,
            userId: null,
            reference: paymentReference,
            amount: totalAmount,
            currency: 'NGN',
            status: 'initiated'
        });
        await paymentTransaction.save();
        ticketPurchase.paymentReference = paymentReference;
        ticketPurchase.paymentTransactionId = paymentTransaction._id;
        await ticketPurchase.save();
        const ticketNumbers = [];
        for (const ticketItem of ticketDetails) {
            for (let i = 0; i < ticketItem.quantity; i++) {
                const ticketNumber = `ETH-${ticketItem.ticketType.toUpperCase()}-${Date.now()}-${crypto_1.default.randomBytes(4).toString('hex').toUpperCase()}`;
                ticketNumbers.push(ticketNumber);
            }
        }
        ticketPurchase.ticketNumbers = ticketNumbers;
        await ticketPurchase.save();
        let emailSent = false;
        let emailError = null;
        try {
            await emailService_1.default.sendTicketEmail(email, firstName, lastName, purchaseReference, ticketDetails, ticketNumbers, totalAmount);
            ticketPurchase.ticketSent = true;
            ticketPurchase.ticketSentAt = new Date();
            await ticketPurchase.save();
            emailSent = true;
            console.log(`✅ Ticket email sent successfully to ${email} after purchase`);
        }
        catch (error) {
            console.error('❌ Failed to send ticket email after purchase:', error);
            emailError = error.message || 'Email service unavailable';
        }
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
    }
    catch (error) {
        console.error('Purchase tickets error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process ticket purchase',
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
};
exports.purchaseTickets = purchaseTickets;
const verifyTicketPayment = async (req, res) => {
    try {
        const { paymentReference } = req.params;
        const paymentData = req.body;
        let paymentTransaction = await PaymentTransaction_1.default.findOne({ reference: paymentReference });
        if (!paymentTransaction) {
            const amount = paymentData.transAmount || paymentData.amount || paymentData.amountPaid || paymentData.debitedAmount || 0;
            paymentTransaction = new PaymentTransaction_1.default({
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
        let ticketPurchase = await TicketPurchase_1.default.findOne({ paymentReference });
        if (!ticketPurchase) {
            const email = paymentData.customerId || paymentData.customer?.email || paymentData.email || 'unknown@example.com';
            const firstName = paymentData.customerFirstName || paymentData.customer?.firstName || paymentData.customer?.name?.split(' ')[0] || 'Unknown';
            const lastName = paymentData.customerLastName || paymentData.customer?.lastName || paymentData.customer?.name?.split(' ').slice(1).join(' ') || 'User';
            const phone = paymentData.customerPhoneNumber || paymentData.customer?.phone || paymentData.phone || '';
            const ticketDetails = [];
            if (paymentData.tickets && Array.isArray(paymentData.tickets) && paymentData.tickets.length > 0) {
                for (const ticketItem of paymentData.tickets) {
                    const ticketType = ticketItem.ticketType;
                    const quantity = ticketItem.quantity || 1;
                    if (ticketType && ['regular', 'vip', 'table_of_5', 'table_of_10'].includes(ticketType)) {
                        const ticket = await Ticket_1.default.findOne({ ticketType, isActive: true });
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
            if (ticketDetails.length === 0) {
                const amount = paymentTransaction.amount;
                const allTickets = await Ticket_1.default.find({ isActive: true }).sort({ price: 1 });
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
                if (!matched) {
                    const defaultTicket = await Ticket_1.default.findOne({ ticketType: 'regular', isActive: true });
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
            ticketPurchase = new TicketPurchase_1.default({
                purchaseReference: `TKT_${Date.now()}_${crypto_1.default.randomBytes(8).toString('hex')}`,
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
        paymentTransaction.status = 'successful';
        paymentTransaction.gatewayResponse = paymentData;
        paymentTransaction.processedAt = new Date();
        await paymentTransaction.save();
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
        if (!ticketPurchase.ticketNumbers || ticketPurchase.ticketNumbers.length === 0) {
            const ticketNumbers = [];
            if (ticketPurchase.tickets && ticketPurchase.tickets.length > 0) {
                for (const ticketItem of ticketPurchase.tickets) {
                    for (let i = 0; i < ticketItem.quantity; i++) {
                        const timestamp = Date.now();
                        const random = crypto_1.default.randomBytes(4).toString('hex').toUpperCase();
                        const ticketTypePrefix = ticketItem.ticketType.toUpperCase().replace('_', '-');
                        ticketNumbers.push(`ETH-${ticketTypePrefix}-${timestamp}-${random}`);
                    }
                }
            }
            ticketPurchase.ticketNumbers = ticketNumbers;
            await ticketPurchase.save();
        }
        ticketPurchase.paymentStatus = 'completed';
        if (!ticketPurchase.ticketSent && ticketPurchase.ticketNumbers && ticketPurchase.ticketNumbers.length > 0) {
            try {
                await emailService_1.default.sendTicketEmail(ticketPurchase.email, ticketPurchase.firstName, ticketPurchase.lastName, ticketPurchase.purchaseReference, ticketPurchase.tickets, ticketPurchase.ticketNumbers, ticketPurchase.totalAmount);
                ticketPurchase.ticketSent = true;
                ticketPurchase.ticketSentAt = new Date();
            }
            catch (error) {
                console.error('Failed to send ticket email after payment verification:', error);
            }
        }
        await ticketPurchase.save();
        for (const ticketItem of ticketPurchase.tickets) {
            const ticket = await Ticket_1.default.findById(ticketItem.ticketId);
            if (ticket) {
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
    }
    catch (error) {
        console.error('Verify ticket payment error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to verify ticket payment',
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
};
exports.verifyTicketPayment = verifyTicketPayment;
const getPurchaseDetails = async (req, res) => {
    try {
        const { purchaseReference } = req.params;
        const ticketPurchase = await TicketPurchase_1.default.findOne({ purchaseReference })
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
    }
    catch (error) {
        console.error('Get purchase details error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve purchase details',
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
};
exports.getPurchaseDetails = getPurchaseDetails;
//# sourceMappingURL=ticketController.js.map