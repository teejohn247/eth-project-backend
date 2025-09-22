import { Response } from 'express';
import Complaint from '../models/Complaint';
import { User } from '../models';
import { AuthenticatedRequest } from '../types';

// Create a new complaint
export const createComplaint = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { complaintType, description } = req.body;
    const userId = req.user?.userId;

    // Create new complaint
    const complaint = new Complaint({
      userId,
      complaintType,
      description
    });

    await complaint.save();

    // Populate user details for response
    const populatedComplaint = await Complaint.findById(complaint._id)
      .populate('userId', 'firstName lastName email')
      .lean();

    // Format response with user details
    const response = {
      _id: populatedComplaint?._id,
      firstName: (populatedComplaint?.userId as any)?.firstName,
      lastName: (populatedComplaint?.userId as any)?.lastName,
      email: (populatedComplaint?.userId as any)?.email,
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
  } catch (error) {
    console.error('Create complaint error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit complaint',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Get user's complaints
export const getUserComplaints = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { page = 1, limit = 10, status } = req.query;

    // Build filter
    const filter: any = { userId };
    if (status) {
      filter.status = status;
    }

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Get complaints with pagination
    const complaints = await Complaint.find(filter)
      .populate('userId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const totalCount = await Complaint.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / Number(limit));

    // Format response
    const formattedComplaints = complaints.map(complaint => ({
      _id: complaint._id,
      firstName: (complaint.userId as any)?.firstName,
      lastName: (complaint.userId as any)?.lastName,
      email: (complaint.userId as any)?.email,
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
  } catch (error) {
    console.error('Get user complaints error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve complaints',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Get single complaint details
export const getComplaintById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const complaint = await Complaint.findOne({ _id: id, userId })
      .populate('userId', 'firstName lastName email')
      .lean();

    if (!complaint) {
      res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
      return;
    }

    // Format response
    const response = {
      _id: complaint._id,
      firstName: (complaint.userId as any)?.firstName,
      lastName: (complaint.userId as any)?.lastName,
      email: (complaint.userId as any)?.email,
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
  } catch (error) {
    console.error('Get complaint by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve complaint',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Admin: Get all complaints
export const getAllComplaints = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20, status, complaintType } = req.query;

    // Build filter
    const filter: any = {};
    if (status) {
      filter.status = status;
    }
    if (complaintType) {
      filter.complaintType = { $regex: complaintType, $options: 'i' };
    }

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Get complaints with pagination
    const complaints = await Complaint.find(filter)
      .populate('userId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const totalCount = await Complaint.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / Number(limit));

    // Format response
    const formattedComplaints = complaints.map(complaint => ({
      _id: complaint._id,
      firstName: (complaint.userId as any)?.firstName,
      lastName: (complaint.userId as any)?.lastName,
      email: (complaint.userId as any)?.email,
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
  } catch (error) {
    console.error('Get all complaints error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve complaints',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Admin: Update complaint status
export const updateComplaintStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const complaint = await Complaint.findById(id);

    if (!complaint) {
      res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
      return;
    }

    // Update status
    complaint.status = status;
    
    // Set resolvedAt if status is Resolved
    if (status === 'Resolved' && !complaint.resolvedAt) {
      complaint.resolvedAt = new Date();
    }

    await complaint.save();

    // Get updated complaint with user details
    const updatedComplaint = await Complaint.findById(id)
      .populate('userId', 'firstName lastName email')
      .lean();

    // Format response
    const response = {
      _id: updatedComplaint?._id,
      firstName: (updatedComplaint?.userId as any)?.firstName,
      lastName: (updatedComplaint?.userId as any)?.lastName,
      email: (updatedComplaint?.userId as any)?.email,
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
  } catch (error) {
    console.error('Update complaint status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update complaint status',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};
