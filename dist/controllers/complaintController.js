"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateComplaintStatus = exports.getAllComplaints = exports.getComplaintById = exports.getUserComplaints = exports.createComplaint = void 0;
const Complaint_1 = __importDefault(require("../models/Complaint"));
const createComplaint = async (req, res) => {
    try {
        const { complaintType, description } = req.body;
        const userId = req.user?.userId;
        const complaint = new Complaint_1.default({
            userId,
            complaintType,
            description
        });
        await complaint.save();
        const populatedComplaint = await Complaint_1.default.findById(complaint._id)
            .populate('userId', 'firstName lastName email')
            .lean();
        const response = {
            _id: populatedComplaint?._id,
            firstName: populatedComplaint?.userId?.firstName,
            lastName: populatedComplaint?.userId?.lastName,
            email: populatedComplaint?.userId?.email,
            complaintType: populatedComplaint?.complaintType,
            description: populatedComplaint?.description,
            status: populatedComplaint?.status,
            createdAt: populatedComplaint?.createdAt,
            resolvedAt: populatedComplaint?.resolvedAt
        };
        res.status(201).json({
            success: true,
            message: 'Complaint submitted successfully',
            data: response
        });
    }
    catch (error) {
        console.error('Create complaint error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit complaint',
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
};
exports.createComplaint = createComplaint;
const getUserComplaints = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { page = 1, limit = 10, status } = req.query;
        const filter = { userId };
        if (status) {
            filter.status = status;
        }
        const skip = (Number(page) - 1) * Number(limit);
        const complaints = await Complaint_1.default.find(filter)
            .populate('userId', 'firstName lastName email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit))
            .lean();
        const totalCount = await Complaint_1.default.countDocuments(filter);
        const totalPages = Math.ceil(totalCount / Number(limit));
        const formattedComplaints = complaints.map(complaint => ({
            _id: complaint._id,
            firstName: complaint.userId?.firstName,
            lastName: complaint.userId?.lastName,
            email: complaint.userId?.email,
            complaintType: complaint.complaintType,
            description: complaint.description,
            status: complaint.status,
            createdAt: complaint.createdAt,
            resolvedAt: complaint.resolvedAt
        }));
        res.status(200).json({
            success: true,
            message: 'Complaints retrieved successfully',
            data: formattedComplaints,
            pagination: {
                currentPage: Number(page),
                totalPages,
                totalCount,
                limit: Number(limit),
                hasNextPage: Number(page) < totalPages,
                hasPrevPage: Number(page) > 1
            }
        });
    }
    catch (error) {
        console.error('Get user complaints error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve complaints',
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
};
exports.getUserComplaints = getUserComplaints;
const getComplaintById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;
        const complaint = await Complaint_1.default.findOne({ _id: id, userId })
            .populate('userId', 'firstName lastName email')
            .lean();
        if (!complaint) {
            res.status(404).json({
                success: false,
                message: 'Complaint not found'
            });
            return;
        }
        const response = {
            _id: complaint._id,
            firstName: complaint.userId?.firstName,
            lastName: complaint.userId?.lastName,
            email: complaint.userId?.email,
            complaintType: complaint.complaintType,
            description: complaint.description,
            status: complaint.status,
            createdAt: complaint.createdAt,
            resolvedAt: complaint.resolvedAt
        };
        res.status(200).json({
            success: true,
            message: 'Complaint retrieved successfully',
            data: response
        });
    }
    catch (error) {
        console.error('Get complaint by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve complaint',
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
};
exports.getComplaintById = getComplaintById;
const getAllComplaints = async (req, res) => {
    try {
        const { page = 1, limit = 20, status, complaintType } = req.query;
        const filter = {};
        if (status) {
            filter.status = status;
        }
        if (complaintType) {
            filter.complaintType = { $regex: complaintType, $options: 'i' };
        }
        const skip = (Number(page) - 1) * Number(limit);
        const complaints = await Complaint_1.default.find(filter)
            .populate('userId', 'firstName lastName email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit))
            .lean();
        const totalCount = await Complaint_1.default.countDocuments(filter);
        const totalPages = Math.ceil(totalCount / Number(limit));
        const formattedComplaints = complaints.map(complaint => ({
            _id: complaint._id,
            firstName: complaint.userId?.firstName,
            lastName: complaint.userId?.lastName,
            email: complaint.userId?.email,
            complaintType: complaint.complaintType,
            description: complaint.description,
            status: complaint.status,
            createdAt: complaint.createdAt,
            resolvedAt: complaint.resolvedAt
        }));
        res.status(200).json({
            success: true,
            message: 'All complaints retrieved successfully',
            data: formattedComplaints,
            pagination: {
                currentPage: Number(page),
                totalPages,
                totalCount,
                limit: Number(limit),
                hasNextPage: Number(page) < totalPages,
                hasPrevPage: Number(page) > 1
            },
            filters: {
                status,
                complaintType
            }
        });
    }
    catch (error) {
        console.error('Get all complaints error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve complaints',
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
};
exports.getAllComplaints = getAllComplaints;
const updateComplaintStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const complaint = await Complaint_1.default.findById(id);
        if (!complaint) {
            res.status(404).json({
                success: false,
                message: 'Complaint not found'
            });
            return;
        }
        complaint.status = status;
        if (status === 'Resolved' && !complaint.resolvedAt) {
            complaint.resolvedAt = new Date();
        }
        await complaint.save();
        const updatedComplaint = await Complaint_1.default.findById(id)
            .populate('userId', 'firstName lastName email')
            .lean();
        const response = {
            _id: updatedComplaint?._id,
            firstName: updatedComplaint?.userId?.firstName,
            lastName: updatedComplaint?.userId?.lastName,
            email: updatedComplaint?.userId?.email,
            complaintType: updatedComplaint?.complaintType,
            description: updatedComplaint?.description,
            status: updatedComplaint?.status,
            createdAt: updatedComplaint?.createdAt,
            resolvedAt: updatedComplaint?.resolvedAt
        };
        res.status(200).json({
            success: true,
            message: 'Complaint status updated successfully',
            data: response
        });
    }
    catch (error) {
        console.error('Update complaint status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update complaint status',
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
};
exports.updateComplaintStatus = updateComplaintStatus;
//# sourceMappingURL=complaintController.js.map