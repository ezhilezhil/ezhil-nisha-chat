const db = require('../config/db');

const setupSocket = (io) => {
    // Keep track of connected users
    const connectedUsers = new Map(); // userId -> socketId

    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.id}`);

        socket.on('setup', async (userData) => {
            if (!userData || !userData.id) return;
            socket.join(userData.id.toString());
            connectedUsers.set(userData.id, socket.id);
            
            // Mark user as online
            await db.execute('UPDATE users SET is_online = true WHERE id = ?', [userData.id]);
            io.emit('user_status', { userId: userData.id, isOnline: true });
        });

        socket.on('typing', (data) => {
            socket.to(data.receiverId.toString()).emit('typing', data);
        });

        socket.on('stop_typing', (data) => {
            socket.to(data.receiverId.toString()).emit('stop_typing', data);
        });

        socket.on('new_message', async (data) => {
            try {
                // Save to database
                const { senderId, receiverId, message, messageType, mediaUrl, replyTo } = data;
                const [result] = await db.execute(`
                    INSERT INTO messages (sender_id, receiver_id, message, message_type, media_url, reply_to) 
                    VALUES (?, ?, ?, ?, ?, ?)
                `, [senderId, receiverId, message || null, messageType || 'text', mediaUrl || null, replyTo || null]);
                
                const newMessageId = result.insertId;
                
                const [fetchedMessages] = await db.execute(`
                    SELECT m.*, u.name as sender_name, u.avatar as sender_avatar 
                    FROM messages m
                    JOIN users u ON m.sender_id = u.id
                    WHERE m.id = ?
                `, [newMessageId]);
                
                const newMessage = fetchedMessages[0];

                // Send back to sender and receiver
                io.to(senderId.toString()).emit('message_received', newMessage);
                io.to(receiverId.toString()).emit('message_received', newMessage);
            } catch (error) {
                console.error('Error saving message via socket', error);
            }
        });

        socket.on('mark_seen', async (data) => {
            const { messageIds, receiverId } = data; // messages that receiverId just saw
            if (!messageIds || messageIds.length === 0) return;
            
            const placeholders = messageIds.map(() => '?').join(',');
            await db.execute(`UPDATE messages SET is_seen = true WHERE id IN (${placeholders})`, messageIds);
            
            socket.broadcast.emit('messages_seen', { messageIds });
        });

        // WebRTC Signaling
        socket.on('call_user', (data) => {
            if (!data || !data.receiverId) return;
            socket.to(data.receiverId.toString()).emit('incoming_call', {
                signal: data.signal,
                callerId: data.callerId,
                callType: data.callType
            });
        });

        socket.on('answer_call', (data) => {
            if (!data || !data.callerId) return;
            socket.to(data.callerId.toString()).emit('call_answered', {
                signal: data.signal
            });
        });

        socket.on('end_call', (data) => {
            if (data.receiverId) {
                socket.to(data.receiverId.toString()).emit('call_ended');
            }
        });

        socket.on('ice_candidate', (data) => {
            if (!data || !data.receiverId) return;
            socket.to(data.receiverId.toString()).emit('ice_candidate', {
                candidate: data.candidate
            });
        });

        socket.on('disconnect', async () => {
            console.log(`User disconnected: ${socket.id}`);
            let disconnectedUserId = null;
            for (let [userId, sId] of connectedUsers.entries()) {
                if (sId === socket.id) {
                    disconnectedUserId = userId;
                    connectedUsers.delete(userId);
                    break;
                }
            }
            
            if (disconnectedUserId) {
                await db.execute('UPDATE users SET is_online = false, last_seen = NOW() WHERE id = ?', [disconnectedUserId]);
                io.emit('user_status', { userId: disconnectedUserId, isOnline: false, lastSeen: new Date() });
            }
        });
    });
};

module.exports = setupSocket;
