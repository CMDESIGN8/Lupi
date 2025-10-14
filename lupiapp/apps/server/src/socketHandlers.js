// handlers modulares para Socket.IO
const supabase = require('./supabaseClient');


module.exports = function (io) {
io.on('connection', (socket) => {
console.log('socket connected', socket.id);


socket.on('join_room', async ({ room, user }) => {
socket.join(room);
io.to(room).emit('room_message', { system: true, text: `${user?.username || 'A user'} joined` });
});


socket.on('player_move', async (payload) => {
// broadcast movement to room
socket.to(payload.room).emit('player_moved', payload);
// optionally persist into supabase.room_entities or player_progress
});


socket.on('chat', async ({ room, message, user }) => {
// persist to room_messages
try {
await supabase.from('room_messages').insert([{ user_id: user?.id, content: message, room_id: room, username: user?.username }]);
} catch (err) {
console.error('supabase insert room_messages error', err.message || err);
}
io.to(room).emit('chat', { user, message, created_at: new Date().toISOString() });
});


socket.on('disconnect', () => {
console.log('socket disconnected', socket.id);
});
});
};