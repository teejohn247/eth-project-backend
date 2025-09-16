"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
class LocationService {
    constructor() {
        this.cache = null;
        this.DATA_URL = 'https://temikeezy.github.io/nigeria-geojson-data/data/full.json';
        this.CACHE_DURATION = 24 * 60 * 60 * 1000;
    }
    static getInstance() {
        if (!LocationService.instance) {
            LocationService.instance = new LocationService();
        }
        return LocationService.instance;
    }
    async fetchData() {
        try {
            console.log('🌍 Fetching Nigerian location data from external source...');
            const response = await axios_1.default.get(this.DATA_URL, {
                timeout: 10000,
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'Edo-Talent-Hunt-Backend/1.0.0'
                }
            });
            if (!response.data || !Array.isArray(response.data)) {
                throw new Error('Invalid data format received from location service');
            }
            console.log(`✅ Successfully fetched data for ${response.data.length} states`);
            return response.data;
        }
        catch (error) {
            console.error('❌ Failed to fetch location data:', error);
            throw new Error('Unable to fetch location data. Please try again later.');
        }
    }
    isCacheValid() {
        if (!this.cache)
            return false;
        const now = new Date();
        const cacheAge = now.getTime() - this.cache.lastUpdated.getTime();
        return cacheAge < this.CACHE_DURATION;
    }
    async refreshCache() {
        const states = await this.fetchData();
        this.cache = {
            states,
            lastUpdated: new Date()
        };
    }
    async getAllStates() {
        if (!this.isCacheValid()) {
            await this.refreshCache();
        }
        if (!this.cache) {
            throw new Error('Failed to load location data');
        }
        return this.cache.states.map(state => ({
            name: state.state,
            lgaCount: state.lgas.length
        }));
    }
    async getLGAsByState(stateName) {
        if (!this.isCacheValid()) {
            await this.refreshCache();
        }
        if (!this.cache) {
            throw new Error('Failed to load location data');
        }
        const state = this.cache.states.find(s => s.state.toLowerCase() === stateName.toLowerCase());
        if (!state) {
            throw new Error(`State '${stateName}' not found`);
        }
        return state.lgas.map(lga => ({
            name: lga.name,
            wardCount: lga.wards.length
        }));
    }
    async getLGADetails(stateName, lgaName) {
        if (!this.isCacheValid()) {
            await this.refreshCache();
        }
        if (!this.cache) {
            throw new Error('Failed to load location data');
        }
        const state = this.cache.states.find(s => s.state.toLowerCase() === stateName.toLowerCase());
        if (!state) {
            throw new Error(`State '${stateName}' not found`);
        }
        const lga = state.lgas.find(l => l.name.toLowerCase() === lgaName.toLowerCase());
        if (!lga) {
            throw new Error(`LGA '${lgaName}' not found in ${stateName} state`);
        }
        return lga;
    }
    async searchLGAs(query, limit = 20) {
        if (!this.isCacheValid()) {
            await this.refreshCache();
        }
        if (!this.cache) {
            throw new Error('Failed to load location data');
        }
        const results = [];
        const searchTerm = query.toLowerCase().trim();
        for (const state of this.cache.states) {
            for (const lga of state.lgas) {
                if (lga.name.toLowerCase().includes(searchTerm)) {
                    results.push({
                        state: state.state,
                        lga: lga.name,
                        wardCount: lga.wards.length
                    });
                    if (results.length >= limit) {
                        return results;
                    }
                }
            }
        }
        return results;
    }
    getCacheInfo() {
        return {
            isValid: this.isCacheValid(),
            lastUpdated: this.cache?.lastUpdated || null,
            stateCount: this.cache?.states.length || 0
        };
    }
}
exports.default = LocationService;
//# sourceMappingURL=locationService.js.map