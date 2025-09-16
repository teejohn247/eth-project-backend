import { Router } from 'express';
import { 
  getAllStates, 
  getLGAsByState, 
  getLGADetails, 
  searchLGAs, 
  getCacheInfo 
} from '../controllers/locationController';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     StateInfo:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: Name of the state
 *           example: "Lagos"
 *         lgaCount:
 *           type: integer
 *           description: Number of LGAs in the state
 *           example: 20
 *     
 *     LGAInfo:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: Name of the LGA
 *           example: "Ikeja"
 *         wardCount:
 *           type: integer
 *           description: Number of wards in the LGA
 *           example: 12
 *     
 *     Ward:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: Name of the ward
 *           example: "Agege"
 *         latitude:
 *           type: number
 *           format: float
 *           description: Ward latitude coordinate
 *           example: 6.625478
 *         longitude:
 *           type: number
 *           format: float
 *           description: Ward longitude coordinate
 *           example: 3.345678
 *     
 *     LGADetails:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: Name of the LGA
 *           example: "Ikeja"
 *         wards:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Ward'
 *           description: List of wards in the LGA
 *     
 *     SearchResult:
 *       type: object
 *       properties:
 *         state:
 *           type: string
 *           description: Name of the state
 *           example: "Lagos"
 *         lga:
 *           type: string
 *           description: Name of the LGA
 *           example: "Ikeja"
 *         wardCount:
 *           type: integer
 *           description: Number of wards in the LGA
 *           example: 12
 *     
 *     LocationResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Request success status
 *         message:
 *           type: string
 *           description: Response message
 *         data:
 *           type: object
 *           description: Response data
 *         error:
 *           type: string
 *           description: Error message (only in development)
 */

/**
 * @swagger
 * /api/v1/locations/states:
 *   get:
 *     summary: Get all Nigerian states
 *     tags: [Locations]
 *     description: Retrieve a list of all Nigerian states with their LGA counts
 *     responses:
 *       200:
 *         description: States retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/LocationResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         states:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/StateInfo'
 *                         totalCount:
 *                           type: integer
 *                           description: Total number of states
 *                           example: 36
 *             example:
 *               success: true
 *               message: "States retrieved successfully"
 *               data:
 *                 states:
 *                   - name: "Abia"
 *                     lgaCount: 17
 *                   - name: "Adamawa"
 *                     lgaCount: 21
 *                 totalCount: 36
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LocationResponse'
 */
router.get('/states', getAllStates);

/**
 * @swagger
 * /api/v1/locations/states/{stateName}/lgas:
 *   get:
 *     summary: Get LGAs by state
 *     tags: [Locations]
 *     description: Retrieve all Local Government Areas (LGAs) in a specific state
 *     parameters:
 *       - in: path
 *         name: stateName
 *         required: true
 *         schema:
 *           type: string
 *         description: Name of the state (case-insensitive)
 *         example: "Lagos"
 *     responses:
 *       200:
 *         description: LGAs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/LocationResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         state:
 *                           type: string
 *                           description: Name of the state
 *                           example: "Lagos"
 *                         lgas:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/LGAInfo'
 *                         totalCount:
 *                           type: integer
 *                           description: Total number of LGAs in the state
 *                           example: 20
 *             example:
 *               success: true
 *               message: "LGAs for Lagos state retrieved successfully"
 *               data:
 *                 state: "Lagos"
 *                 lgas:
 *                   - name: "Agege"
 *                     wardCount: 10
 *                   - name: "Ajeromi-Ifelodun"
 *                     wardCount: 15
 *                 totalCount: 20
 *       400:
 *         description: Bad request - State name is required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LocationResponse'
 *       404:
 *         description: State not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LocationResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LocationResponse'
 */
router.get('/states/:stateName/lgas', getLGAsByState);

/**
 * @swagger
 * /api/v1/locations/states/{stateName}/lgas/{lgaName}:
 *   get:
 *     summary: Get LGA details
 *     tags: [Locations]
 *     description: Retrieve detailed information about a specific LGA including all its wards
 *     parameters:
 *       - in: path
 *         name: stateName
 *         required: true
 *         schema:
 *           type: string
 *         description: Name of the state (case-insensitive)
 *         example: "Lagos"
 *       - in: path
 *         name: lgaName
 *         required: true
 *         schema:
 *           type: string
 *         description: Name of the LGA (case-insensitive)
 *         example: "Ikeja"
 *     responses:
 *       200:
 *         description: LGA details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/LocationResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         state:
 *                           type: string
 *                           description: Name of the state
 *                           example: "Lagos"
 *                         lga:
 *                           $ref: '#/components/schemas/LGADetails'
 *             example:
 *               success: true
 *               message: "Details for Ikeja LGA in Lagos state retrieved successfully"
 *               data:
 *                 state: "Lagos"
 *                 lga:
 *                   name: "Ikeja"
 *                   wards:
 *                     - name: "Agidingbi"
 *                       latitude: 6.605874
 *                       longitude: 3.316953
 *                     - name: "Airport"
 *                       latitude: 6.582923
 *                       longitude: 3.321160
 *       400:
 *         description: Bad request - State name and LGA name are required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LocationResponse'
 *       404:
 *         description: State or LGA not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LocationResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LocationResponse'
 */
router.get('/states/:stateName/lgas/:lgaName', getLGADetails);

/**
 * @swagger
 * /api/v1/locations/search:
 *   get:
 *     summary: Search LGAs
 *     tags: [Locations]
 *     description: Search for LGAs across all states by name
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 1
 *         description: Search query for LGA names
 *         example: "ikeja"
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Maximum number of results to return
 *         example: 10
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/LocationResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         query:
 *                           type: string
 *                           description: The search query used
 *                           example: "ikeja"
 *                         results:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/SearchResult'
 *                         totalCount:
 *                           type: integer
 *                           description: Total number of results found
 *                           example: 1
 *                         limit:
 *                           type: integer
 *                           description: Maximum results limit applied
 *                           example: 20
 *             example:
 *               success: true
 *               message: "Search results for \"ikeja\" retrieved successfully"
 *               data:
 *                 query: "ikeja"
 *                 results:
 *                   - state: "Lagos"
 *                     lga: "Ikeja"
 *                     wardCount: 10
 *                 totalCount: 1
 *                 limit: 20
 *       400:
 *         description: Bad request - Search query is required or invalid limit
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LocationResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LocationResponse'
 */
router.get('/search', searchLGAs);

/**
 * @swagger
 * /api/v1/locations/cache/info:
 *   get:
 *     summary: Get cache information
 *     tags: [Locations]
 *     description: Retrieve information about the location data cache status
 *     responses:
 *       200:
 *         description: Cache information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/LocationResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         isValid:
 *                           type: boolean
 *                           description: Whether the cache is currently valid
 *                           example: true
 *                         lastUpdated:
 *                           type: string
 *                           format: date-time
 *                           description: When the cache was last updated
 *                           example: "2025-09-16T14:30:00.000Z"
 *                         stateCount:
 *                           type: integer
 *                           description: Number of states in the cache
 *                           example: 36
 *             example:
 *               success: true
 *               message: "Cache information retrieved successfully"
 *               data:
 *                 isValid: true
 *                 lastUpdated: "2025-09-16T14:30:00.000Z"
 *                 stateCount: 36
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LocationResponse'
 */
router.get('/cache/info', getCacheInfo);

export default router;
