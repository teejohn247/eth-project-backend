import axios from 'axios';

interface Ward {
  name: string;
  latitude: number;
  longitude: number;
}

interface LGA {
  name: string;
  wards: Ward[];
}

interface State {
  state: string;
  lgas: LGA[];
}

interface LocationData {
  states: State[];
  lastUpdated: Date;
}

class LocationService {
  private static instance: LocationService;
  private cache: LocationData | null = null;
  private readonly DATA_URL = 'https://temikeezy.github.io/nigeria-geojson-data/data/full.json';
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  private constructor() {}

  public static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  private async fetchData(): Promise<State[]> {
    try {
      console.log('🌍 Fetching Nigerian location data from external source...');
      const response = await axios.get(this.DATA_URL, {
        timeout: 10000, // 10 seconds timeout
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
    } catch (error) {
      console.error('❌ Failed to fetch location data:', error);
      throw new Error('Unable to fetch location data. Please try again later.');
    }
  }

  private isCacheValid(): boolean {
    if (!this.cache) return false;
    
    const now = new Date();
    const cacheAge = now.getTime() - this.cache.lastUpdated.getTime();
    return cacheAge < this.CACHE_DURATION;
  }

  private async refreshCache(): Promise<void> {
    const states = await this.fetchData();
    this.cache = {
      states,
      lastUpdated: new Date()
    };
  }

  public async getAllStates(): Promise<{ name: string; lgaCount: number }[]> {
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

  public async getLGAsByState(stateName: string): Promise<{ name: string; wardCount: number }[]> {
    if (!this.isCacheValid()) {
      await this.refreshCache();
    }

    if (!this.cache) {
      throw new Error('Failed to load location data');
    }

    const state = this.cache.states.find(s => 
      s.state.toLowerCase() === stateName.toLowerCase()
    );

    if (!state) {
      throw new Error(`State '${stateName}' not found`);
    }

    return state.lgas.map(lga => ({
      name: lga.name,
      wardCount: lga.wards.length
    }));
  }

  public async getLGADetails(stateName: string, lgaName: string): Promise<LGA> {
    if (!this.isCacheValid()) {
      await this.refreshCache();
    }

    if (!this.cache) {
      throw new Error('Failed to load location data');
    }

    const state = this.cache.states.find(s => 
      s.state.toLowerCase() === stateName.toLowerCase()
    );

    if (!state) {
      throw new Error(`State '${stateName}' not found`);
    }

    const lga = state.lgas.find(l => 
      l.name.toLowerCase() === lgaName.toLowerCase()
    );

    if (!lga) {
      throw new Error(`LGA '${lgaName}' not found in ${stateName} state`);
    }

    return lga;
  }

  public async searchLGAs(query: string, limit: number = 20): Promise<{ state: string; lga: string; wardCount: number }[]> {
    if (!this.isCacheValid()) {
      await this.refreshCache();
    }

    if (!this.cache) {
      throw new Error('Failed to load location data');
    }

    const results: { state: string; lga: string; wardCount: number }[] = [];
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

  public getCacheInfo(): { isValid: boolean; lastUpdated: Date | null; stateCount: number } {
    return {
      isValid: this.isCacheValid(),
      lastUpdated: this.cache?.lastUpdated || null,
      stateCount: this.cache?.states.length || 0
    };
  }
}

export default LocationService;
