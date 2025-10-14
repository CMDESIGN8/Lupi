import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

class ApiService {
  constructor() {
    this.baseURL = BACKEND_URL;
  }

  async request(endpoint, options = {}) {
    const token = await this.getToken();
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    if (config.body) {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error en la solicitud');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  async getToken() {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
  }

  // Users endpoints
  async getUserProfile() {
    return this.request('/api/users/profile');
  }

  async updateUserProfile(profileData) {
    return this.request('/api/users/profile', {
      method: 'PUT',
      body: profileData,
    });
  }

  async getOnlinePlayers() {
    return this.request('/api/users/online');
  }

  async updatePlayerPosition(positionData) {
    return this.request('/api/users/position', {
      method: 'POST',
      body: positionData,
    });
  }

  // Missions endpoints
  async getMissions() {
    return this.request('/api/missions');
  }

  async getDailyMissions() {
    return this.request('/api/missions/daily');
  }

  async updateMissionProgress(missionId, progress) {
    return this.request('/api/missions/progress', {
      method: 'POST',
      body: { missionId, progress },
    });
  }

  // Shop endpoints
  async getAvatars() {
    return this.request('/api/shop/avatars');
  }

  async getUserAvatars() {
    return this.request('/api/shop/my-avatars');
  }

  async purchaseAvatar(avatarId) {
    return this.request('/api/shop/avatars/purchase', {
      method: 'POST',
      body: { avatarId },
    });
  }

  async equipAvatar(avatarId) {
    return this.request('/api/shop/avatars/equip', {
      method: 'POST',
      body: { avatarId },
    });
  }

  // Clubs endpoints
  async getClubs(search = '', page = 1) {
    const params = new URLSearchParams({ search, page: page.toString() });
    return this.request(`/api/clubs?${params}`);
  }

  async getClubDetails(clubId) {
    return this.request(`/api/clubs/${clubId}`);
  }

  async createClub(clubData) {
    return this.request('/api/clubs', {
      method: 'POST',
      body: clubData,
    });
  }

  async joinClub(clubId) {
    return this.request(`/api/clubs/${clubId}/join`, {
      method: 'POST',
    });
  }

  async leaveClub() {
    return this.request('/api/clubs/leave', {
      method: 'POST',
    });
  }
}

export const apiService = new ApiService();