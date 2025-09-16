import { Request, Response } from 'express';
import LocationService from '../services/locationService';

const locationService = LocationService.getInstance();

interface LocationResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export const getAllStates = async (req: Request, res: Response): Promise<void> => {
  try {
    const states = await locationService.getAllStates();
    
    res.status(200).json({
      success: true,
      message: 'States retrieved successfully',
      data: {
        states,
        totalCount: states.length
      }
    } as LocationResponse);
  } catch (error: any) {
    console.error('Get all states error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve states',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    } as LocationResponse);
  }
};

export const getLGAsByState = async (req: Request, res: Response): Promise<void> => {
  try {
    const { stateName } = req.params;
    
    if (!stateName || stateName.trim().length === 0) {
      res.status(400).json({
        success: false,
        message: 'State name is required'
      } as LocationResponse);
      return;
    }

    const lgas = await locationService.getLGAsByState(stateName);
    
    res.status(200).json({
      success: true,
      message: `LGAs for ${stateName} state retrieved successfully`,
      data: {
        state: stateName,
        lgas,
        totalCount: lgas.length
      }
    } as LocationResponse);
  } catch (error: any) {
    console.error('Get LGAs by state error:', error);
    
    if (error.message.includes('not found')) {
      res.status(404).json({
        success: false,
        message: error.message
      } as LocationResponse);
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve LGAs',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      } as LocationResponse);
    }
  }
};

export const getLGADetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const { stateName, lgaName } = req.params;
    
    if (!stateName || stateName.trim().length === 0) {
      res.status(400).json({
        success: false,
        message: 'State name is required'
      } as LocationResponse);
      return;
    }

    if (!lgaName || lgaName.trim().length === 0) {
      res.status(400).json({
        success: false,
        message: 'LGA name is required'
      } as LocationResponse);
      return;
    }

    const lgaDetails = await locationService.getLGADetails(stateName, lgaName);
    
    res.status(200).json({
      success: true,
      message: `Details for ${lgaName} LGA in ${stateName} state retrieved successfully`,
      data: {
        state: stateName,
        lga: lgaDetails
      }
    } as LocationResponse);
  } catch (error: any) {
    console.error('Get LGA details error:', error);
    
    if (error.message.includes('not found')) {
      res.status(404).json({
        success: false,
        message: error.message
      } as LocationResponse);
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve LGA details',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      } as LocationResponse);
    }
  }
};

export const searchLGAs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { q, limit } = req.query;
    
    if (!q || typeof q !== 'string' || q.trim().length === 0) {
      res.status(400).json({
        success: false,
        message: 'Search query (q) is required'
      } as LocationResponse);
      return;
    }

    const searchLimit = limit ? parseInt(limit as string, 10) : 20;
    
    if (isNaN(searchLimit) || searchLimit < 1 || searchLimit > 100) {
      res.status(400).json({
        success: false,
        message: 'Limit must be a number between 1 and 100'
      } as LocationResponse);
      return;
    }

    const results = await locationService.searchLGAs(q.trim(), searchLimit);
    
    res.status(200).json({
      success: true,
      message: `Search results for "${q}" retrieved successfully`,
      data: {
        query: q.trim(),
        results,
        totalCount: results.length,
        limit: searchLimit
      }
    } as LocationResponse);
  } catch (error: any) {
    console.error('Search LGAs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search LGAs',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    } as LocationResponse);
  }
};

export const getCacheInfo = async (req: Request, res: Response): Promise<void> => {
  try {
    const cacheInfo = locationService.getCacheInfo();
    
    res.status(200).json({
      success: true,
      message: 'Cache information retrieved successfully',
      data: cacheInfo
    } as LocationResponse);
  } catch (error: any) {
    console.error('Get cache info error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve cache information',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    } as LocationResponse);
  }
};
