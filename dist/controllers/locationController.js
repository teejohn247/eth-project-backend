"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCacheInfo = exports.searchLGAs = exports.getLGADetails = exports.getLGAsByState = exports.getAllStates = void 0;
const locationService_1 = __importDefault(require("../services/locationService"));
const locationService = locationService_1.default.getInstance();
const getAllStates = async (req, res) => {
    try {
        const states = await locationService.getAllStates();
        res.status(200).json({
            success: true,
            message: 'States retrieved successfully',
            data: {
                states,
                totalCount: states.length
            }
        });
    }
    catch (error) {
        console.error('Get all states error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve states',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};
exports.getAllStates = getAllStates;
const getLGAsByState = async (req, res) => {
    try {
        const { stateName } = req.params;
        if (!stateName || stateName.trim().length === 0) {
            res.status(400).json({
                success: false,
                message: 'State name is required'
            });
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
        });
    }
    catch (error) {
        console.error('Get LGAs by state error:', error);
        if (error.message.includes('not found')) {
            res.status(404).json({
                success: false,
                message: error.message
            });
        }
        else {
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve LGAs',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }
};
exports.getLGAsByState = getLGAsByState;
const getLGADetails = async (req, res) => {
    try {
        const { stateName, lgaName } = req.params;
        if (!stateName || stateName.trim().length === 0) {
            res.status(400).json({
                success: false,
                message: 'State name is required'
            });
            return;
        }
        if (!lgaName || lgaName.trim().length === 0) {
            res.status(400).json({
                success: false,
                message: 'LGA name is required'
            });
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
        });
    }
    catch (error) {
        console.error('Get LGA details error:', error);
        if (error.message.includes('not found')) {
            res.status(404).json({
                success: false,
                message: error.message
            });
        }
        else {
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve LGA details',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }
};
exports.getLGADetails = getLGADetails;
const searchLGAs = async (req, res) => {
    try {
        const { q, limit } = req.query;
        if (!q || typeof q !== 'string' || q.trim().length === 0) {
            res.status(400).json({
                success: false,
                message: 'Search query (q) is required'
            });
            return;
        }
        const searchLimit = limit ? parseInt(limit, 10) : 20;
        if (isNaN(searchLimit) || searchLimit < 1 || searchLimit > 100) {
            res.status(400).json({
                success: false,
                message: 'Limit must be a number between 1 and 100'
            });
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
        });
    }
    catch (error) {
        console.error('Search LGAs error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to search LGAs',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};
exports.searchLGAs = searchLGAs;
const getCacheInfo = async (req, res) => {
    try {
        const cacheInfo = locationService.getCacheInfo();
        res.status(200).json({
            success: true,
            message: 'Cache information retrieved successfully',
            data: cacheInfo
        });
    }
    catch (error) {
        console.error('Get cache info error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve cache information',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};
exports.getCacheInfo = getCacheInfo;
//# sourceMappingURL=locationController.js.map