import React, { useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

function App() {
  const [socket, setSocket] = useState(null)
  const [players, setPlayers] = useState([])
  const [messages, setMessages] = useState([])
  const [gameStats, setGameStats] = useState(null)

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io('https://lupiback.onrender.com')
    setSocket(newSocket)

    // Fetch initial game stats
    fetchGameStats()

    // Socket event listeners
    newSocket.on('player-moved', (data) => {
      setPlayers(prev => prev.map(p => 
        p.userId === data.userId ? { ...p, ...data } : p
      ))
    })

    newSocket.on('new-message', (message) => {
      setMessages(prev => [...prev, message])
    })

    newSocket.on('user-joined', (data) => {
      console.log('User joined:', data)
    })

    return () => newSocket.disconnect()
  }, [])

  const fetchGameStats = async () => {
    try {
      const response = await fetch('https://lupiback.onrender.com/api/game-stats')
      const stats = await response.json()
      setGameStats(stats)
    } catch (error) {
      console.error('Error fetching game stats:', error)
    }
  }

  const handleJoinRoom = () => {
    if (socket) {
      socket.emit('join-room', {
        userId: 'demo-user',
        roomId: 'main_lobby'
      })
    }
  }

  const handleSendMessage = () => {
    if (socket) {
      socket.emit('send-message', {
        userId: 'demo-user',
        content: 'Hello from LupiApp!',
        username: 'DemoUser',
        roomId: 'main_lobby'
      })
    }
  }

  return (
    <div className="app">
      <header>
        <h1>🎮 LupiApp</h1>
        <p>Plataforma de Gaming Deportivo</p>
      </header>

      <main>
        <section className="game-stats">
          <h2>Estadísticas del Juego</h2>
          {gameStats && (
            <div className="stats-grid">
              <div className="stat">
                <h3>Jugadores Totales</h3>
                <p>{gameStats.total_players}</p>
              </div>
              <div className="stat">
                <h3>Goles Totales</h3>
                <p>{gameStats.total_goals}</p>
              </div>
              <div className="stat">
                <h3>Record de Puntos</h3>
                <p>{gameStats.record_score}</p>
              </div>
            </div>
          )}
        </section>

        <section className="controls">
          <button onClick={handleJoinRoom}>Unirse a Sala</button>
          <button onClick={handleSendMessage}>Enviar Mensaje</button>
        </section>

        <section className="chat">
          <h2>Chat en Tiempo Real</h2>
          <div className="messages">
            {messages.map((msg, index) => (
              <div key={index} className="message">
                <strong>{msg.username}:</strong> {msg.content}
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}

export default App