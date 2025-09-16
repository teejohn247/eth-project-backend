interface Ward {
    name: string;
    latitude: number;
    longitude: number;
}
interface LGA {
    name: string;
    wards: Ward[];
}
declare class LocationService {
    private static instance;
    private cache;
    private readonly DATA_URL;
    private readonly CACHE_DURATION;
    private constructor();
    static getInstance(): LocationService;
    private fetchData;
    private isCacheValid;
    private refreshCache;
    getAllStates(): Promise<{
        name: string;
        lgaCount: number;
    }[]>;
    getLGAsByState(stateName: string): Promise<{
        name: string;
        wardCount: number;
    }[]>;
    getLGADetails(stateName: string, lgaName: string): Promise<LGA>;
    searchLGAs(query: string, limit?: number): Promise<{
        state: string;
        lga: string;
        wardCount: number;
    }[]>;
    getCacheInfo(): {
        isValid: boolean;
        lastUpdated: Date | null;
        stateCount: number;
    };
}
export default LocationService;
//# sourceMappingURL=locationService.d.ts.map