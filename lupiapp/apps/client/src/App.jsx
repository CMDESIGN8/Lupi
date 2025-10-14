import React, { useEffect, useState } from 'react';
import { socket } from './socketClient';
import { supabase } from './supabaseClient';


export default function App() {
const [messages, setMessages] = useState([]);
const [text, setText] = useState('');


useEffect(() => {
socket.connect();
socket.on('connect', () => console.log('connected', socket.id));
socket.on('chat', (m) => setMessages((s) => [...s, m]));
return () => socket.disconnect();
}, []);


const send = () => {
socket.emit('chat', { room: 'main_lobby', message: text, user: { id: 'anon', username: 'Anon' } });
setText('');
};


return (
<div style={{ padding: 20 }}>
<h1>LupiApp (dev)</h1>
<div style={{ height: 300, overflow: 'auto', border: '1px solid #ddd', padding: 8 }}>
{messages.map((m,i) => <div key={i}><b>{m.user?.username || 'system'}:</b> {m.message}</div>)}
</div>
<div style={{ marginTop: 8 }}>
<input value={text} onChange={(e)=>setText(e.target.value)} />
<button onClick={send}>Send</button>
</div>
</div>
);
}