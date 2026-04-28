// src/components/admin/AdminAlbumPanel.tsx
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { POSITION_ICONS, type Position, type Category } from '../types/cards';

// ==================== CONFIGURACIÓN ====================
const CATEGORIES: { id: Category; name: string; maxCards: number; icon: string }[] = [
  { id: '1era', name: '1ª DIVISIÓN', maxCards: 25, icon: '🏆' },
  { id: '3ra', name: '3ª DIVISIÓN', maxCards: 20, icon: '⚡' },
  { id: '4ta', name: '4ª DIVISIÓN', maxCards: 20, icon: '🛡️' },
  { id: '5ta', name: '5ª DIVISIÓN', maxCards: 20, icon: '🌟' },
  { id: '6ta', name: '6ª DIVISIÓN', maxCards: 20, icon: '💪' },
  { id: '7ma', name: '7ª DIVISIÓN', maxCards: 20, icon: '🎯' },
  { id: '8va', name: '8ª DIVISIÓN', maxCards: 15, icon: '🌱' },
  { id: 'femenino', name: 'FEMENINO', maxCards: 40, icon: '👩' },
  { id: 'Promocionales', name: 'PROMOCIONALES', maxCards: 25, icon: '✨' },
  { id: 'veteranos', name: 'VETERANOS', maxCards: 20, icon: '👴' },
  
  // 👇 Los socios NO se agregan manualmente, vienen de los usuarios
];

const POSITIONS: Position[] = ['arquero', 'cierre', 'ala', 'pivot'];

interface NPCPlayer {
  id: string;
  name: string;
  position: Position;
  category: Category;
  overall_rating: number;
  pace: number;
  dribbling: number;
  passing: number;
  defending: number;
  finishing: number;
  physical: number;
  photo_url?: string;
  can_be_replaced: boolean;
  is_replaced: boolean;
  replaces_profile_id?: string;
}

interface RealPlayer {
  id: string;
  username: string;
  position: Position;
  category: Category;
  pace: number;
  dribbling: number;
  passing: number;
  defending: number;
  finishing: number;
  physical: number;
  total_battles: number;
  total_wins: number;
  registered_at: string;
}

export function AdminAlbumPanel() {
  const [activeTab, setActiveTab] = useState<'official' | 'users'>('official');
  const [officialPlayers, setOfficialPlayers] = useState<NPCPlayer[]>([]);
  const [realPlayers, setRealPlayers] = useState<RealPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<NPCPlayer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'position' | 'category' | 'ovr'>('name'); // NUEVO
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc'); // NUEVO
  const [stats, setStats] = useState({ total: 0, owned: 0, completed: 0 });
  
  // ==================== ORDENAMIENTO ====================
const sortPlayers = (players: any[], sortBy: string, sortOrder: string) => {
  return [...players].sort((a, b) => {
    let valueA, valueB;
    
    switch(sortBy) {
      case 'name':
        valueA = a.name || a.username;
        valueB = b.name || b.username;
        break;
      case 'position':
        const positionOrder = { 'arquero': 1, 'cierre': 2, 'ala': 3, 'pivot': 4 };
        valueA = positionOrder[a.position as keyof typeof positionOrder] || 99;
        valueB = positionOrder[b.position as keyof typeof positionOrder] || 99;
        break;
      case 'category':
        const categoryOrder = {
          '1era': 1, '3ra': 2, '4ta': 3, '5ta': 4, '6ta': 5, 
          '7ma': 6, '8va': 7, 'femenino': 8, 'Promocionales': 9, 'veteranos': 10
        };
        valueA = categoryOrder[a.category as keyof typeof categoryOrder] || 99;
        valueB = categoryOrder[b.category as keyof typeof categoryOrder] || 99;
        break;
      case 'ovr':
        if (a.overall_rating !== undefined) {
          valueA = a.overall_rating;
          valueB = b.overall_rating;
        } else {
          // Para jugadores reales (calculan OVR)
          valueA = Math.floor((a.pace + a.dribbling + a.passing + a.defending + a.finishing + a.physical) / 6);
          valueB = Math.floor((b.pace + b.dribbling + b.passing + b.defending + b.finishing + b.physical) / 6);
        }
        break;
      default:
        valueA = a.name || a.username;
        valueB = b.name || b.username;
    }
    
    if (sortOrder === 'asc') {
      return valueA > valueB ? 1 : -1;
    } else {
      return valueA < valueB ? 1 : -1;
    }
  });
};
  
  // Formulario para nuevo jugador
  const [formData, setFormData] = useState({
    name: '',
    position: 'ala' as Position,
    category: '1era' as Category,
    pace: 50,
    dribbling: 50,
    passing: 50,
    defending: 50,
    finishing: 50,
    physical: 50,
  });

  // ==================== CARGAR DATOS ====================
  const loadData = async () => {
  setLoading(true);
  
  try {
    // 1. Cargar NPCs (jugadores oficiales)
    const { data: npcs, error: npcsError } = await supabase
      .from('players')
      .select('*')
      .order('category', { ascending: true })
      .order('name', { ascending: true });
    
    if (npcsError) throw npcsError;
    
    setOfficialPlayers(npcs || []);
    
    // Calcular estadísticas de NPCs
    const totalNPCs = npcs?.length || 0;
    const replacedNPCs = npcs?.filter(p => p.is_replaced === true).length || 0;
    
    // 2. Cargar SOCIOS REALES desde profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*'); // Seleccionar todas las columnas
    
    if (profilesError) {
      console.error('Error loading profiles:', profilesError);
    } else {
      console.log('👥 Socios en DB:', profiles?.length || 0);
      
      // Transformar los perfiles al formato RealPlayer
      const realPlayersData: RealPlayer[] = (profiles || []).map(profile => ({
        id: profile.id,
        username: profile.username || 'Anónimo',
        position: (profile.position as Position) || 'ala',
        category: (profile.category as Category) || 'socios',
        pace: profile.user_card_pace || 50,
        dribbling: profile.user_card_dribbling || 50,
        passing: profile.user_card_passing || 50,
        defending: profile.user_card_defending || 50,
        finishing: profile.user_card_finishing || 50,
        physical: profile.user_card_physical || 50,
        total_battles: profile.total_battles_lifetime || 0, // 👈 CORREGIDO
        total_wins: profile.total_wins_lifetime || 0,       // 👈 CORREGIDO
        registered_at: profile.created_at || new Date().toISOString(),
      }));
      
      console.log('📊 Socios transformados:', realPlayersData.length);
      setRealPlayers(realPlayersData);
    }
    
    setStats({
      total: totalNPCs,
      owned: 0,
      completed: replacedNPCs,
    });
    
  } catch (error) {
    console.error('Error loading data:', error);
    alert('Error al cargar los datos');
  } finally {
    setLoading(false);
  }
};
  
  useEffect(() => {
    loadData();
  }, []);
  
  // ==================== CRUD DE JUGADORES OFICIALES ====================
  // ==================== CRUD DE JUGADORES OFICIALES ====================
const calculateOVR = (stats: typeof formData) => {
  return Math.floor(
    (stats.pace + stats.dribbling + stats.passing + 
     stats.defending + stats.finishing + stats.physical) / 6
  );
};

const addPlayer = async () => {
  const overall = calculateOVR(formData);
  
  const { data, error } = await supabase
    .from('players')
    .insert([{
      name: formData.name,
      position: formData.position,
      category: formData.category,
      overall_rating: overall,
      pace: formData.pace,
      dribbling: formData.dribbling,
      passing: formData.passing,
      defending: formData.defending,
      finishing: formData.finishing,
      physical: formData.physical,
      can_be_replaced: true,
      is_replaced: false,
    }])
    .select();
  
  if (error) {
    console.error('Error adding player:', error);
    alert('Error al agregar jugador: ' + error.message);
  } else {
    alert(`✅ ¡${formData.name} agregado al álbum!`);
    setShowAddForm(false);
    setFormData({
      name: '', position: 'ala', category: '1era',
      pace: 50, dribbling: 50, passing: 50,
      defending: 50, finishing: 50, physical: 50,
    });
    await loadData(); // Asegurar que se espere la recarga
  }
};

const updatePlayer = async () => {
  if (!editingPlayer) return;
  
  // Calcular el OVR con los datos actualizados del form
  const overall = calculateOVR(formData);
  
  console.log('Actualizando jugador:', editingPlayer.id);
  console.log('Datos a actualizar:', {
    name: formData.name,
    position: formData.position,
    category: formData.category,
    overall_rating: overall,
    pace: formData.pace,
    dribbling: formData.dribbling,
    passing: formData.passing,
    defending: formData.defending,
    finishing: formData.finishing,
    physical: formData.physical,
  });
  
  const { error } = await supabase
    .from('players')
    .update({
      name: formData.name,
      position: formData.position,
      category: formData.category,
      overall_rating: overall,
      pace: formData.pace,
      dribbling: formData.dribbling,
      passing: formData.passing,
      defending: formData.defending,
      finishing: formData.finishing,
      physical: formData.physical,
    })
    .eq('id', editingPlayer.id);
  
  if (error) {
    console.error('Error detallado:', error);
    alert('Error al actualizar: ' + error.message);
  } else {
    alert(`✅ ${formData.name} actualizado correctamente`);
    setEditingPlayer(null);
    setFormData({
      name: '', position: 'ala', category: '1era',
      pace: 50, dribbling: 50, passing: 50,
      defending: 50, finishing: 50, physical: 50,
    });
    await loadData(); // Esperar a que se recarguen los datos
  }
};
  
  const deletePlayer = async (player: NPCPlayer) => {
  console.log('🗑️ Intentando eliminar:', player.name);
  console.log('ID del estado:', player.id);
  
  // 🔍 VERIFICAR si el jugador existe en DB ahora mismo
  const { data: existing, error: checkError } = await supabase
    .from('players')
    .select('id, name')
    .eq('id', player.id)
    .maybeSingle(); // 👈 maybeSingle no da error si no existe
  
  if (!existing) {
    console.warn('⚠️ Jugador no encontrado en DB, buscando por nombre...');
    
    // Buscar por nombre
    const { data: byName } = await supabase
      .from('players')
      .select('id, name')
      .ilike('name', player.name)
      .maybeSingle();
    
    if (byName) {
      console.log('✅ Encontrado con ID correcto:', byName.id);
      // Eliminar usando el ID correcto
      const { error: deleteError } = await supabase
        .from('players')
        .delete()
        .eq('id', byName.id);
      
      if (deleteError) {
        alert('Error: ' + deleteError.message);
      } else {
        alert(`✅ "${player.name}" eliminado correctamente`);
        // Actualizar estado local
        setOfficialPlayers(prev => prev.filter(p => p.id !== byName.id));
      }
    } else {
      alert(`❌ "${player.name}" no existe en la base de datos. Recargando lista...`);
      await loadData(); // Recargar para sincronizar
    }
    return;
  }
  
  // Si existe, eliminar
  const confirmed = confirm(`¿Eliminar a ${player.name}?`);
  if (!confirmed) return;
  
  const { error: deleteError } = await supabase
    .from('players')
    .delete()
    .eq('id', player.id);
  
  if (deleteError) {
    alert('Error: ' + deleteError.message);
  } else {
    alert(`✅ "${player.name}" eliminado`);
    setOfficialPlayers(prev => prev.filter(p => p.id !== player.id));
  }
};

const cleanOrphanedPlayers = async () => {
  console.log('🧹 Limpiando datos huérfanos...');
  
  // Recargar desde DB
  await loadData();
  
  // Mostrar cuántos jugadores había antes
  console.log('Jugadores después de sincronizar:', officialPlayers.length);
  
  alert(`✅ Datos sincronizados. ${officialPlayers.length} jugadores cargados.`);
};
  
  const markAsReplaced = async (player: NPCPlayer) => {
    const realPlayerName = prompt(`¿Qué usuario real reemplaza a ${player.name}? (nombre de usuario)`);
    if (!realPlayerName) return;
    
    // Buscar el perfil del usuario
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', realPlayerName)
      .single();
    
    if (!profile) {
      alert('Usuario no encontrado');
      return;
    }
    
    const { error } = await supabase
      .from('players')
      .update({
        is_replaced: true,
        replaces_profile_id: profile.id,
      })
      .eq('id', player.id);
    
    if (error) {
      alert('Error al marcar como reemplazado');
    } else {
      alert(`✅ ${player.name} ahora es reemplazado por ${realPlayerName}`);
      loadData();
    }
  };
  
  // ==================== GENERACIÓN MASIVA ====================
  const generateRandomPlayer = () => {
    const categories = ['1era', '3ra', '4ta', '5ta', '6ta', '7ma', '8va', 'femenino', 'Promocionales','veteranos'];
    const positions = ['arquero', 'cierre', 'ala', 'pivot'];
    const firstNames = ['Juan', 'Carlos', 'Martín', 'Lucas', 'Diego', 'Pablo', 'Andrés', 'Facundo', 'Santiago', 'Tomás'];
    const lastNames = ['Pérez', 'González', 'Rodríguez', 'Fernández', 'López', 'Martínez', 'García', 'Gómez', 'Flores', 'Roca'];
    
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const category = categories[Math.floor(Math.random() * categories.length)] as Category;
    const position = positions[Math.floor(Math.random() * positions.length)] as Position;
    
    // Stats según posición
    let pace = 40 + Math.random() * 45;
    let dribbling = 40 + Math.random() * 45;
    let passing = 40 + Math.random() * 45;
    let defending = 40 + Math.random() * 45;
    let finishing = 40 + Math.random() * 45;
    let physical = 40 + Math.random() * 45;
    
    // Especialización por posición
    switch(position) {
      case 'arquero':
        defending = Math.max(defending, 70 + Math.random() * 20);
        pace = Math.min(pace, 65);
        finishing = Math.min(finishing, 55);
        break;
      case 'cierre':
        defending = Math.max(defending, 65 + Math.random() * 25);
        physical = Math.max(physical, 60 + Math.random() * 20);
        break;
      case 'ala':
        pace = Math.max(pace, 65 + Math.random() * 25);
        dribbling = Math.max(dribbling, 60 + Math.random() * 25);
        finishing = Math.max(finishing, 60 + Math.random() * 20);
        break;
      case 'pivot':
        physical = Math.max(physical, 65 + Math.random() * 25);
        finishing = Math.max(finishing, 65 + Math.random() * 20);
        passing = Math.max(passing, 55 + Math.random() * 20);
        break;
    }
    
    setFormData({
      name: `${firstName} ${lastName}`,
      position,
      category,
      pace: Math.floor(pace),
      dribbling: Math.floor(dribbling),
      passing: Math.floor(passing),
      defending: Math.floor(defending),
      finishing: Math.floor(finishing),
      physical: Math.floor(physical),
    });
  };
  
  const generateBulkPlayers = async () => {
    const count = prompt('¿Cuántos jugadores querés generar? (máx 50)', '10');
    if (!count) return;
    
    const num = parseInt(count);
    if (isNaN(num) || num > 50) {
      alert('Por favor ingresá un número entre 1 y 50');
      return;
    }
    
    const categories = ['1era', '3ra', '4ta', '5ta', '6ta', '7ma', '8va', 'femenino', 'Promocionales' , 'veteranos'];
    const positions = ['arquero', 'cierre', 'ala', 'pivot'];
    const firstNames = ['Juan', 'Carlos', 'Martín', 'Lucas', 'Diego', 'Pablo', 'Andrés', 'Facundo', 'Santiago', 'Tomás', 'Nicolás', 'Franco', 'Agustín', 'Joaquín', 'Lautaro'];
    const lastNames = ['Pérez', 'González', 'Rodríguez', 'Fernández', 'López', 'Martínez', 'García', 'Gómez', 'Flores', 'Roca', 'Álvarez', 'Romero', 'Sosa', 'Vázquez', 'Acosta'];
    
    let successCount = 0;
    
    for (let i = 0; i < num; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const category = categories[Math.floor(Math.random() * categories.length)] as Category;
      const position = positions[Math.floor(Math.random() * positions.length)] as Position;
      
      let pace = 40 + Math.random() * 45;
      let dribbling = 40 + Math.random() * 45;
      let passing = 40 + Math.random() * 45;
      let defending = 40 + Math.random() * 45;
      let finishing = 40 + Math.random() * 45;
      let physical = 40 + Math.random() * 45;
      
      switch(position) {
        case 'arquero':
          defending = Math.max(defending, 70 + Math.random() * 20);
          break;
        case 'cierre':
          defending = Math.max(defending, 65 + Math.random() * 25);
          physical = Math.max(physical, 60 + Math.random() * 20);
          break;
        case 'ala':
          pace = Math.max(pace, 65 + Math.random() * 25);
          dribbling = Math.max(dribbling, 60 + Math.random() * 25);
          break;
        case 'pivot':
          physical = Math.max(physical, 65 + Math.random() * 25);
          finishing = Math.max(finishing, 65 + Math.random() * 20);
          break;
      }
      
      const overall = Math.floor((pace + dribbling + passing + defending + finishing + physical) / 6);
      
      const { error } = await supabase
        .from('players')
        .insert([{
          name: `${firstName} ${lastName}`,
          position,
          category,
          overall_rating: overall,
          pace: Math.floor(pace),
          dribbling: Math.floor(dribbling),
          passing: Math.floor(passing),
          defending: Math.floor(defending),
          finishing: Math.floor(finishing),
          physical: Math.floor(physical),
          can_be_replaced: true,
          is_replaced: false,
        }]);
      
      if (!error) successCount++;
    }
    
    alert(`✅ ¡${successCount} jugadores agregados al álbum!`);
    loadData();
  };
  
  // ==================== FILTRADO ====================
  // ==================== FILTRADO ====================
const filteredOfficial = sortPlayers(
  officialPlayers.filter(p => {
    if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
    if (searchTerm && !p.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  }),
  sortBy,
  sortOrder
);

const filteredReal = sortPlayers(
  realPlayers.filter(p => {
    if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
    if (searchTerm && !p.username.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  }),
  sortBy,
  sortOrder
);
  
  // ==================== RENDER ====================
  if (loading) {
    return (
      <div className="admin-loading">
        <div className="spinner" />
        <p>Cargando álbum...</p>
      </div>
    );
  }
  
  return (
    <div className="admin-album-panel">
      <div className="admin-header">
        <h1>🎴 Panel de Administración del Álbum</h1>
        <p>Gestioná los 150 jugadores de Futsal Flores y los socios reales</p>
      </div>
      
      {/* Estadísticas rápidas */}
      <div className="admin-stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-info">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Jugadores Oficiales</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <span className="stat-value">{realPlayers.length}</span>
            <span className="stat-label">Socios Registrados</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🔄</div>
          <div className="stat-info">
            <span className="stat-value">{stats.completed}</span>
            <span className="stat-label">NPCs Reemplazados</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✨</div>
          <div className="stat-info">
            <span className="stat-value">{stats.total + realPlayers.length}</span>
            <span className="stat-label">Cartas Totales</span>
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="admin-tabs">
        <button 
          className={`tab ${activeTab === 'official' ? 'active' : ''}`}
          onClick={() => setActiveTab('official')}
        >
          🏆 Álbum Oficial (Futsal Flores)
        </button>
        <button 
          className={`tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 Socios Reales
        </button>
      </div>
      
      {/* Barra de herramientas */}
      <div className="admin-toolbar">
        <div className="search-box">
          <input
            type="text"
            placeholder="🔍 Buscar jugador..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          value={selectedCategory} 
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="category-filter"
        >
          <option value="all">📋 Todas las categorías</option>
          {CATEGORIES.map(cat => (
            <option key={cat.id} value={cat.id}>
              {cat.icon} {cat.name} ({cat.maxCards})
            </option>
          ))}
        </select>
        {/* NUEVO: Selector de ordenamiento */}
  <select 
    value={sortBy} 
    onChange={(e) => setSortBy(e.target.value as any)}
    className="sort-filter"
  >
    <option value="name">📝 Ordenar por: Nombre</option>
    <option value="position">🎯 Ordenar por: Posición</option>
    <option value="category">🏆 Ordenar por: Categoría</option>
    <option value="ovr">⭐ Ordenar por: Overall</option>
  </select>
  
  {/* NUEVO: Botón para cambiar orden ascendente/descendente */}
  <button 
    className="sort-order-btn"
    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
    title={sortOrder === 'asc' ? 'Ascendente' : 'Descendente'}
  >
    {sortOrder === 'asc' ? '⬆️' : '⬇️'}
  </button>
        {activeTab === 'official' && (
          <>
            <button className="btn-primary" onClick={() => setShowAddForm(true)}>
              ➕ Agregar Jugador
            </button>
            <button className="btn-clean" onClick={cleanOrphanedPlayers}>
  🧹 Sincronizar Datos
</button>
            <button className="btn-secondary" onClick={generateBulkPlayers}>
              🎲 Generar Masivo
            </button>
          </>
        )}
      </div>
      
      {/* ==================== TABLA DE JUGADORES OFICIALES ==================== */}
      {activeTab === 'official' && (
        <div className="players-table-container">
          <table className="players-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Jugador</th>
                <th>Posición</th>
                <th>Categoría</th>
                <th>OVR</th>
                <th>Stats</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredOfficial.map((player, idx) => {
                const posInfo = POSITION_ICONS[player.position as Position];                const categoryInfo = CATEGORIES.find(c => c.id === player.category);
                return (
                  <tr key={player.id} className={player.is_replaced ? 'replaced' : ''}>
                    <td>{idx + 1}</td>
                    <td className="player-name">
                      <span className="player-icon">{posInfo?.icon}</span>
                      {player.name}
                    </td>
                    <td>
                      <span className="position-badge" style={{ background: posInfo?.color }}>
                        {posInfo?.name}
                      </span>
                    </td>
                    <td>
                      <span className="category-badge">
                        {categoryInfo?.icon} {player.category}
                      </span>
                    </td>
                    <td>
                      <span className={`ovr-badge ovr-${player.overall_rating >= 80 ? 'high' : player.overall_rating >= 60 ? 'mid' : 'low'}`}>
                        {player.overall_rating}
                      </span>
                    </td>
                    <td className="stats-preview">
                      <span title="Ritmo">⚡{player.pace}</span>
                      <span title="Regate">✨{player.dribbling}</span>
                      <span title="Pase">🎯{player.passing}</span>
                      <span title="Defensa">🛡️{player.defending}</span>
                      <span title="Tiro">⚽{player.finishing}</span>
                      <span title="Físico">💪{player.physical}</span>
                    </td>
                    <td>
                      {player.is_replaced ? (
                        <span className="status-replaced">✓ Reemplazado</span>
                      ) : (
                        <span className="status-available">📦 Disponible</span>
                      )}
                    </td>
                    <td className="actions">
                      <button 
                        className="action-edit"
                        onClick={() => {
                          setEditingPlayer(player);
                          setFormData({
                            name: player.name,
                            position: player.position,
                            category: player.category,
                            pace: player.pace,
                            dribbling: player.dribbling,
                            passing: player.passing,
                            defending: player.defending,
                            finishing: player.finishing,
                            physical: player.physical,
                          });
                        }}
                      >
                        ✏️
                      </button>
                      {!player.is_replaced && (
                        <button 
                          className="action-replace"
                          onClick={() => markAsReplaced(player)}
                        >
                          🔄
                        </button>
                      )}
                      <button 
                         className="action-delete"
  onClick={(e) => {
    e.stopPropagation(); // Importante para evitar propagación
    deletePlayer(player);
  }}
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredOfficial.length === 0 && (
            <div className="empty-state">
              <p>📭 No hay jugadores en esta categoría</p>
              <button onClick={() => setShowAddForm(true)}>➕ Agregar el primero</button>
            </div>
          )}
        </div>
      )}
      
      {/* ==================== TABLA DE SOCIOS REALES ==================== */}
      {activeTab === 'users' && (
        <div className="players-table-container">
          <table className="players-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Usuario</th>
                <th>Posición</th>
                <th>Categoría</th>
                <th>OVR</th>
                <th>Stats</th>
                <th>Récord</th>
                <th>Registro</th>
              </tr>
            </thead>
            <tbody>
              {filteredReal.map((player, idx) => {
                const posInfo = POSITION_ICONS[player.position as Position];                const ovr = Math.floor(
                  (player.pace + player.dribbling + player.passing + 
                   player.defending + player.finishing + player.physical) / 6
                );
                const winRate = player.total_battles > 0 
                  ? Math.round((player.total_wins / player.total_battles) * 100) 
                  : 0;
                return (
                  <tr key={player.id}>
                    <td>{idx + 1}</td>
                    <td className="player-name">
                      <span className="real-badge-small">🔴</span>
                      {player.username}
                    </td>
                    <td>
                      <span className="position-badge" style={{ background: posInfo?.color }}>
                        {posInfo?.name}
                      </span>
                    </td>
                    <td>
                      <span className="category-badge">
                        {player.category}
                      </span>
                    </td>
                    <td>
                      <span className={`ovr-badge ovr-${ovr >= 80 ? 'high' : ovr >= 60 ? 'mid' : 'low'}`}>
                        {ovr}
                      </span>
                    </td>
                    <td className="stats-preview">
                      <span>⚡{player.pace}</span>
                      <span>✨{player.dribbling}</span>
                      <span>🎯{player.passing}</span>
                      <span>🛡️{player.defending}</span>
                      <span>⚽{player.finishing}</span>
                      <span>💪{player.physical}</span>
                    </td>
                    <td className="record">
                      <span className="wins">🏆 {player.total_wins}</span>
                      <span className="winrate">({winRate}%)</span>
                    </td>
                    <td className="date">
                      {new Date(player.registered_at).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredReal.length === 0 && (
            <div className="empty-state">
              <p>👥 Aún no hay socios registrados</p>
              <p>Los usuarios que se registren aparecerán automáticamente aquí</p>
            </div>
          )}
        </div>
      )}
      
      {/* ==================== MODAL DE AGREGAR/EDITAR ==================== */}
      {(showAddForm || editingPlayer) && (
        <div className="modal-overlay" onClick={() => {
          setShowAddForm(false);
          setEditingPlayer(null);
        }}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>{editingPlayer ? '✏️ Editar Jugador' : '➕ Agregar Nuevo Jugador'}</h2>
            
            <div className="form-group">
              <label>Nombre completo</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Ej: Juan Pérez"
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Posición</label>
                <select 
                  value={formData.position} 
                  onChange={(e) => setFormData({...formData, position: e.target.value as Position})}
                >
                  {POSITIONS.map(pos => (
                    <option key={pos} value={pos}>
                      {POSITION_ICONS[pos]?.icon} {POSITION_ICONS[pos]?.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>Categoría</label>
                <select 
                  value={formData.category} 
                  onChange={(e) => setFormData({...formData, category: e.target.value as Category})}
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="stats-editor">
              <h3>Estadísticas (0-99)</h3>
              <div className="stats-grid">
                <div className="stat-input">
                  <label>⚡ Ritmo</label>
                  <input
                    type="range"
                    min="30"
                    max="99"
                    value={formData.pace}
                    onChange={(e) => setFormData({...formData, pace: parseInt(e.target.value)})}
                  />
                  <span>{formData.pace}</span>
                </div>
                <div className="stat-input">
                  <label>✨ Regate</label>
                  <input
                    type="range"
                    min="30"
                    max="99"
                    value={formData.dribbling}
                    onChange={(e) => setFormData({...formData, dribbling: parseInt(e.target.value)})}
                  />
                  <span>{formData.dribbling}</span>
                </div>
                <div className="stat-input">
                  <label>🎯 Pase</label>
                  <input
                    type="range"
                    min="30"
                    max="99"
                    value={formData.passing}
                    onChange={(e) => setFormData({...formData, passing: parseInt(e.target.value)})}
                  />
                  <span>{formData.passing}</span>
                </div>
                <div className="stat-input">
                  <label>🛡️ Defensa</label>
                  <input
                    type="range"
                    min="30"
                    max="99"
                    value={formData.defending}
                    onChange={(e) => setFormData({...formData, defending: parseInt(e.target.value)})}
                  />
                  <span>{formData.defending}</span>
                </div>
                <div className="stat-input">
                  <label>⚽ Tiro</label>
                  <input
                    type="range"
                    min="30"
                    max="99"
                    value={formData.finishing}
                    onChange={(e) => setFormData({...formData, finishing: parseInt(e.target.value)})}
                  />
                  <span>{formData.finishing}</span>
                </div>
                <div className="stat-input">
                  <label>💪 Físico</label>
                  <input
                    type="range"
                    min="30"
                    max="99"
                    value={formData.physical}
                    onChange={(e) => setFormData({...formData, physical: parseInt(e.target.value)})}
                  />
                  <span>{formData.physical}</span>
                </div>
              </div>
            </div>
            
            <div className="modal-actions">
              <button className="btn-random" onClick={generateRandomPlayer}>
                🎲 Aleatorio
              </button>
              <button className="btn-cancel" onClick={() => {
                setShowAddForm(false);
                setEditingPlayer(null);
              }}>
                Cancelar
              </button>
              <button className="btn-save" onClick={editingPlayer ? updatePlayer : addPlayer}>
                {editingPlayer ? '💾 Guardar Cambios' : '✨ Agregar al Álbum'}
              </button>
            </div>
            
            {!editingPlayer && (
              <div className="preview-card">
                <h4>Vista previa de la carta:</h4>
                <div className="preview-stats">
                  <strong>OVR: {calculateOVR(formData)}</strong>
                  <div className="stat-bars">
                    <div className="stat-bar"><span>⚡</span><div style={{ width: `${formData.pace}%`, background: '#4CAF50' }} /></div>
                    <div className="stat-bar"><span>✨</span><div style={{ width: `${formData.dribbling}%`, background: '#2196F3' }} /></div>
                    <div className="stat-bar"><span>🎯</span><div style={{ width: `${formData.passing}%`, background: '#FF9800' }} /></div>
                    <div className="stat-bar"><span>🛡️</span><div style={{ width: `${formData.defending}%`, background: '#9C27B0' }} /></div>
                    <div className="stat-bar"><span>⚽</span><div style={{ width: `${formData.finishing}%`, background: '#E91E63' }} /></div>
                    <div className="stat-bar"><span>💪</span><div style={{ width: `${formData.physical}%`, background: '#00BCD4' }} /></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      <style>{`
        .admin-album-panel {
          max-width: 1400px;
          margin: 0 auto;
          padding: 24px;
            padding-bottom: 100px; /* 👈 ESPACIO PARA LA BARRA INFERIOR */

          background: #0a0a0f;
          min-height: 100vh;
          color: white;
        }
        
        .admin-header h1 {
          font-size: 28px;
          margin-bottom: 8px;
          background: linear-gradient(135deg, #00ff88, #00c853);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        
        .admin-header p {
          color: rgba(255,255,255,0.6);
          margin-bottom: 24px;
        }
        
        .admin-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }
        
        .stat-card {
          background: linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02));
          border-radius: 16px;
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          border: 1px solid rgba(255,255,255,0.1);
        }
        
        .stat-icon {
          font-size: 32px;
        }
        
        .stat-info {
          display: flex;
          flex-direction: column;
        }
        
        .stat-value {
          font-size: 28px;
          font-weight: bold;
          color: #00ff88;
        }
        
        .stat-label {
          font-size: 12px;
          color: rgba(255,255,255,0.6);
        }
        
        .admin-tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 24px;
          border-bottom: 1px solid rgba(255,255,255,0.1);
          padding-bottom: 8px;
        }
        
        .tab {
          background: none;
          border: none;
          padding: 10px 20px;
          color: rgba(255,255,255,0.6);
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          border-radius: 8px;
          transition: all 0.2s;
        }
        
        .tab.active {
          background: rgba(0,255,136,0.15);
          color: #00ff88;
        }
        
        .admin-toolbar {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }
        
        .search-box input {
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.2);
          padding: 10px 16px;
          border-radius: 8px;
          color: white;
          width: 250px;
        }
        
        .category-filter {
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.2);
          padding: 10px 16px;
          border-radius: 8px;
          color: white;
        }
        
        .btn-primary, .btn-secondary {
          padding: 10px 20px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s;
        }
        
        .btn-primary {
          background: #00ff88;
          color: #0a0a0f;
        }
        
        .btn-primary:hover {
          background: #00e676;
          transform: translateY(-2px);
        }
        
        .btn-secondary {
          background: rgba(255,255,255,0.1);
          color: white;
        }
        
        .players-table-container {
          background: rgba(255,255,255,0.03);
          border-radius: 16px;
          overflow-x: auto;
        }
        
        .players-table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .players-table th {
          text-align: left;
          padding: 16px;
          color: rgba(255,255,255,0.6);
          font-size: 12px;
          font-weight: 600;
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        
        .players-table td {
          padding: 12px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        
        .players-table tr:hover {
          background: rgba(255,255,255,0.05);
        }
        
        .players-table tr.replaced {
          opacity: 0.6;
          background: rgba(100,100,100,0.1);
        }
        
        .player-name {
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .position-badge {
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 10px;
          font-weight: bold;
          color: white;
        }
        
        .category-badge {
          padding: 4px 8px;
          border-radius: 6px;
          background: rgba(255,255,255,0.1);
          font-size: 11px;
        }
        
        .ovr-badge {
          padding: 4px 8px;
          border-radius: 6px;
          font-weight: bold;
          font-size: 14px;
        }
        
        .ovr-high { background: #9C27B0; color: white; }
        .ovr-mid { background: #2196F3; color: white; }
        .ovr-low { background: #4CAF50; color: white; }
        
        .stats-preview {
          display: flex;
          gap: 6px;
          font-size: 11px;
          color: rgba(255,255,255,0.7);
        }
        
        .status-replaced {
          color: #4CAF50;
          font-size: 11px;
        }
        
        .status-available {
          color: #FF9800;
          font-size: 11px;
        }
        
        .actions {
          display: flex;
          gap: 8px;
        }
        
        .actions button {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 16px;
          padding: 4px 8px;
          border-radius: 4px;
          transition: all 0.2s;
        }
        
        .action-edit:hover { background: rgba(33,150,243,0.3); }
        .action-replace:hover { background: rgba(255,152,0,0.3); }
        .action-delete:hover { background: rgba(244,67,54,0.3); }
        
        .real-badge-small {
          font-size: 10px;
        }
        /* Estilo especial para veteranos en la tabla */
.players-table tr[data-category="veteranos"] .category-badge {
  background: linear-gradient(135deg, #FF6B35, #8B3A00);
  color: white;
  text-shadow: 0 0 4px rgba(0,0,0,0.5);
}

/* Icono de veterano en la lista */
.veteran-icon {
  filter: drop-shadow(0 0 4px #FF6B35);
}
        .record {
          display: flex;
          flex-direction: column;
          font-size: 11px;
        }
        
        .wins { color: #FFD700; }
        .winrate { color: rgba(255,255,255,0.5); }
        
        .date {
          font-size: 11px;
          color: rgba(255,255,255,0.5);
        }
        
        .empty-state {
          text-align: center;
          padding: 60px;
          color: rgba(255,255,255,0.5);
        }
        
        .empty-state button {
          margin-top: 16px;
          background: #00ff88;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          cursor: pointer;
        }
        
        /* Modal */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.95);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .modal-content {
          background: linear-gradient(135deg, #1a1a2e, #0a0a0f);
          border-radius: 24px;
          padding: 32px;
          max-width: 600px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
          border: 1px solid rgba(0,255,136,0.3);
        }
        
        .form-group {
          margin-bottom: 16px;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-size: 12px;
          font-weight: 600;
          color: rgba(255,255,255,0.7);
        }
        
        .form-group input, .form-group select {
          width: 100%;
          padding: 10px;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 8px;
          color: white;
        }
        
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        
        .stats-editor {
          margin: 24px 0;
        }
        
        .stats-editor h3 {
          margin-bottom: 16px;
          font-size: 16px;
        }
        
        .stats-grid {
          display: grid;
          gap: 12px;
        }
        
        .stat-input {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .stat-input label {
          width: 60px;
          margin: 0;
        }
        
        .stat-input input {
          flex: 1;
        }
        
        .stat-input span {
          width: 35px;
          text-align: center;
          font-weight: bold;
          color: #00ff88;
        }
        
        .modal-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          margin-top: 24px;
        }
        
        .btn-random {
          background: #9C27B0;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          cursor: pointer;
        }
        
        .btn-cancel {
          background: rgba(255,255,255,0.1);
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          cursor: pointer;
        }
        
        .btn-save {
          background: #00ff88;
          color: #0a0a0f;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: bold;
        }
        
        .preview-card {
          margin-top: 24px;
          padding: 16px;
          background: rgba(0,255,136,0.05);
          border-radius: 12px;
        }
        
        .preview-card h4 {
          margin-bottom: 12px;
          font-size: 12px;
          color: rgba(255,255,255,0.6);
        }
        
        .stat-bars {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-top: 12px;
        }
        
        .stat-bar {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
        }
        
        .stat-bar > div {
          height: 6px;
          border-radius: 3px;
          transition: width 0.3s;
        }
        
        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(255,255,255,0.1);
          border-top-color: #00ff88;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 16px;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .admin-loading {
          text-align: center;
          padding: 100px;
        }
        
        @media (max-width: 768px) {
          .admin-stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          
          .stats-preview {
            display: none;
          }
        }
          .sort-filter {
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.2);
  padding: 10px 16px;
  border-radius: 8px;
  color: white;
  cursor: pointer;
}

.sort-order-btn {
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.2);
  padding: 10px 16px;
  border-radius: 8px;
  color: white;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s;
}

.sort-order-btn:hover {
  background: rgba(255,255,255,0.2);
  transform: scale(1.05);
}
  .btn-clean {
  background: rgba(255, 152, 0, 0.3);
  border: 1px solid #ff9800;
  padding: 10px 20px;
  border-radius: 8px;
  color: #ff9800;
  cursor: pointer;
}
      `}</style>
    </div>
  );
}