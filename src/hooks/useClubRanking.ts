// hooks/useClubRanking.ts (actualizado)
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

interface ClubRanking {
  club: string;
  members: number;
  totalPoints: number;
  rank: number;
}

export function useClubRanking(userId: string) {
  const [clubRanking, setClubRanking] = useState<ClubRanking | null>(null);
  const [allClubsRanking, setAllClubsRanking] = useState<ClubRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [userClub, setUserClub] = useState<string>('');

  const loadClubRanking = async () => {
    if (!userId) return;
    
    setLoading(true);
    
    try {
      // 1. Obtener el club del usuario
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('club')
        .eq('id', userId)
        .single();

      if (!userProfile?.club) {
        setLoading(false);
        return;
      }

      setUserClub(userProfile.club);

      // 2. Obtener todos los perfiles
      const { data: allProfiles } = await supabase
        .from('profiles')
        .select('club, points');

      if (!allProfiles) {
        setLoading(false);
        return;
      }

      // 3. Agrupar por club
      const clubMap = new Map<string, { members: number; totalPoints: number }>();

      allProfiles.forEach(profile => {
        if (profile.club) {
          const existing = clubMap.get(profile.club);
          const points = profile.points || 0;
          
          if (existing) {
            existing.members += 1;
            existing.totalPoints += points;
          } else {
            clubMap.set(profile.club, {
              members: 1,
              totalPoints: points
            });
          }
        }
      });

      // 4. Ordenar por puntos
      const clubsArray = Array.from(clubMap.entries()).map(([club, data]) => ({
        club,
        members: data.members,
        totalPoints: data.totalPoints
      }));

      const sortedClubs = [...clubsArray].sort((a, b) => b.totalPoints - a.totalPoints);

      // 5. Agregar ranking
      const clubsWithRank = sortedClubs.map((club, index) => ({
        ...club,
        rank: index + 1
      }));

      setAllClubsRanking(clubsWithRank);

      // 6. Encontrar el ranking del club del usuario
      const userClubData = clubsWithRank.find(c => c.club === userProfile.club);
      if (userClubData) {
        setClubRanking(userClubData);
      }

    } catch (error) {
      console.error('Error loading club ranking:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClubRanking();

    const subscription = supabase
      .channel('club-ranking-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'profiles' },
        () => loadClubRanking()
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId]);

  return { clubRanking, allClubsRanking, userClub, loading, refresh: loadClubRanking };
}