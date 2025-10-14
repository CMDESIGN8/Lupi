import React, { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { apiService } from '../services/api';
import ClubList from '../components/clubs/ClubList';
import Loading from '../components/common/Loading';

const Clubs = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  const { data: clubsData, loading, error, refetch } = useApi(
    () => apiService.getClubs(searchTerm, currentPage),
    { autoFetch: false }
  );

  React.useEffect(() => {
    refetch();
  }, [searchTerm, currentPage]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleJoinClub = async (clubId) => {
    try {
      await apiService.joinClub(clubId);
      alert('¡Te has unido al club exitosamente!');
      refetch();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  if (loading) return <Loading />;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="clubs-page">
      <div className="page-header">
        <h1>🏆 Clubes Deportivos</h1>
        <p>Encuentra y únete a clubes de tu deporte favorito</p>
      </div>

      <div className="clubs-actions">
        <input
          type="text"
          placeholder="Buscar clubes..."
          value={searchTerm}
          onChange={handleSearch}
          className="search-input"
        />
        <button className="btn btn-primary">
          Crear Nuevo Club
        </button>
      </div>

      <ClubList 
        clubs={clubsData?.clubs || []}
        onJoinClub={handleJoinClub}
        pagination={clubsData?.pagination}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

export default Clubs;