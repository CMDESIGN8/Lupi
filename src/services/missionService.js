class MissionService {
    constructor(apiClient) {
        this.apiClient = apiClient;
    }

    // Registrar evento de juego para progresar misiones
    async recordGameEvent(characterId, eventType, eventData = {}) {
        try {
            const response = await this.apiClient.post('/missions/progress', {
                characterId,
                missionType: eventType,
                progressValue: eventData.progressValue || 1,
                eventData
            });

            return response.data;
        } catch (error) {
            console.error('Error recording game event:', error);
            return [];
        }
    }

    // Eventos específicos del juego multideportivo
    async recordTrainingSession(characterId, sportType, duration) {
        return this.recordGameEvent(characterId, 'training_session', {
            sportType,
            duration
        });
    }

    async recordGameWin(characterId, sportType, againstBots = false) {
        const eventType = againstBots ? 'win_against_bots' : 'win_against_players';
        return this.recordGameEvent(characterId, eventType, {
            sportType,
            againstBots
        });
    }

    async recordClubJoin(characterId, clubId) {
        return this.recordGameEvent(characterId, 'club_join', {
            clubId
        });
    }

    async recordSkillUpgrade(characterId, skillType, pointsSpent) {
        return this.recordGameEvent(characterId, 'skill_upgrade', {
            skillType,
            pointsSpent
        });
    }

    async recordCurrencyEarned(characterId, amount, currencyType = 'lupicoins') {
        return this.recordGameEvent(characterId, 'currency_earned', {
            amount,
            currencyType
        });
    }
}

export default MissionService;