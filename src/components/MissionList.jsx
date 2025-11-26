import React, { useState, useEffect } from 'react';
import "../styles/MissionList.css";

const MissionList = ({ character, wallet, apiClient, compact = false, onMissionUpdate }) => {
    const [missions, setMissions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (character?.id && apiClient) {
            loadMissions();
        } else {
            // Fallback a misiones de prueba si no hay API
            setMissions(getMockMissions());
            setLoading(false);
        }
    }, [character?.id]);

    const loadMissions = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get(`/missions/${character.id}`);
            setMissions(response.data);
        } catch (error) {
            console.error('Error loading missions:', error);
            // Fallback a misiones mock
            setMissions(getMockMissions());
        } finally {
            setLoading(false);
        }
    };

    const getMockMissions = () => {
        return [
            {
                id: 1,
                title: "Entrenamiento Diario",
                description: "Completa 3 sesiones de entrenamiento",
                icon: "🎯",
                mission_type: "daily",
                objective_type: "training_sessions",
                objective_value: 3,
                reward_xp: 100,
                reward_lupicoins: 50,
                progress: character?.training_sessions || 0,
                isCompleted: (character?.training_sessions || 0) >= 3,
                claimedReward: false
            },
            {
                id: 2,
                title: "Victoria en Arena",
                description: "Gana 1 partida contra bots",
                icon: "⚔️",
                mission_type: "combat",
                objective_type: "win_against_bots",
                objective_value: 1,
                reward_xp: 200,
                reward_lupicoins: 100,
                progress: character?.bot_wins || 0,
                isCompleted: (character?.bot_wins || 0) >= 1,
                claimedReward: false
            },
            {
                id: 3,
                title: "Unirse a un Club",
                description: "Forma parte de una comunidad",
                icon: "🏆",
                mission_type: "social",
                objective_type: "club_join",
                objective_value: 1,
                reward_xp: 150,
                reward_lupicoins: 75,
                progress: character?.club_id ? 1 : 0,
                isCompleted: !!character?.club_id,
                claimedReward: false
            },
            {
                id: 4,
                title: "Victoria en Arena",
                description: "Gana 3 partida contra bots",
                icon: "⚔️",
                mission_type: "combat",
                objective_type: "win_against_bots",
                objective_value: 3,
                reward_xp: 200,
                reward_lupicoins: 100,
                progress: character?.bot_wins || 3,
                isCompleted: (character?.bot_wins || 1) >= 1,
                claimedReward: false
            },
            {
                id: 5,
                title: "Victoria en Arena",
                description: "Gana 5 partida contra bots",
                icon: "⚔️",
                mission_type: "combat",
                objective_type: "win_against_bots",
                objective_value: 5,
                reward_xp: 200,
                reward_lupicoins: 100,
                progress: character?.bot_wins || 4,
                isCompleted: (character?.bot_wins || 0) >= 1,
                claimedReward: false
            },
        ];
    };

    const claimReward = async (missionId) => {
        if (!apiClient) {
            alert('Sistema de recompensas no disponible');
            return;
        }

        try {
            const response = await apiClient.post('/missions/claim', {
                characterId: character.id,
                missionId
            });

            if (response.data.success) {
                setMissions(prev => prev.map(mission => 
                    mission.id === missionId 
                        ? { ...mission, claimedReward: true }
                        : mission
                ));
                
                if (onMissionUpdate) onMissionUpdate();
                
                // Mostrar notificación de recompensa
                showRewardNotification(response.data.rewards);
            }
        } catch (error) {
            console.error('Error claiming reward:', error);
            alert('Error al reclamar la recompensa');
        }
    };

    const showRewardNotification = (rewards) => {
        const message = [
            rewards.xp > 0 && `+${rewards.xp} XP`,
            rewards.lupicoins > 0 && `+${rewards.lupicoins} Lupicoins`,
            rewards.item && `+ ${rewards.item}`
        ].filter(Boolean).join('\n');
        
        alert(`¡Recompensa obtenida!\n${message}`);
    };

    const getProgressPercentage = (progress, total) => {
        if (total === 0) return 0;
        return Math.min(100, (progress / total) * 100);
    };

    const getMissionTypeClass = (missionType) => {
        const typeMap = {
            daily: 'daily',
            weekly: 'weekly',
            achievement: 'achievement',
            tutorial: 'tutorial',
            combat: 'combat',
            social: 'social',
            economy: 'economy',
            progress: 'progress'
        };
        return typeMap[missionType] || 'daily';
    };

    if (loading) {
        return (
            <div className="missions-loading">
                <div className="loading-spinner"></div>
                {!compact && <p>Cargando misiones...</p>}
            </div>
        );
    }

    return (
        <div className={`missions-list ${compact ? 'compact' : 'full'}`}>
            {missions.map((mission) => {
                const percentage = getProgressPercentage(mission.progress, mission.objective_value);
                const isCompleted = mission.isCompleted;
                const typeClass = getMissionTypeClass(mission.mission_type);

                return (
                    <div 
                        key={mission.id} 
                        className={`mission-item ${typeClass} ${isCompleted ? 'completed' : ''} ${compact ? 'compact' : ''}`}
                    >
                        <div className="mission-icon">
                            {mission.icon || '🎯'}
                        </div>

                        <div className="mission-content">
                            <div className="mission-header">
                                <h4>{mission.title}</h4>
                                <div className="mission-rewards">
                                    {mission.reward_xp > 0 && (
                                        <span className="reward-xp">+{mission.reward_xp} XP</span>
                                    )}
                                    {mission.reward_lupicoins > 0 && (
                                        <span className="reward-coins">+{mission.reward_lupicoins} 🪙</span>
                                    )}
                                </div>
                            </div>
                            
                            <p>{mission.description}</p>

                            <div className="mission-progress">
                                <div className="progress-bar">
                                    <div 
                                        className="progress-fill" 
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                                
                                <div className="progress-actions">
                                    <span className="progress-text">
                                        {isCompleted 
                                            ? (mission.claimedReward ? 'RECLAMADA' : '¡COMPLETADA!')
                                            : `${mission.progress}/${mission.objective_value}`
                                        }
                                    </span>
                                    
                                    {isCompleted && !mission.claimedReward && (
                                        <button 
                                            className="claim-button"
                                            onClick={() => claimReward(mission.id)}
                                        >
                                            Reclamar
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}

            {missions.length === 0 && (
                <div className="no-missions">
                    No hay misiones disponibles en este momento.
                </div>
            )}
        </div>
    );
};

export default MissionList;