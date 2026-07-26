const db = require('../config/db');

const getMessages = async (req, res) => {
    try {
        const { limit = 50, offset = 0 } = req.query;
        const [messages] = await db.execute(`
            SELECT m.*, u.name as sender_name, u.avatar as sender_avatar 
            FROM messages m
            JOIN users u ON m.sender_id = u.id
            WHERE (m.sender_id = ? OR m.receiver_id = ?) 
              AND ((m.sender_id = ? AND m.deleted_sender = false) OR (m.receiver_id = ? AND m.deleted_receiver = false))
            ORDER BY m.created_at DESC
            LIMIT ? OFFSET ?
        `, [req.user.id, req.user.id, req.user.id, req.user.id, Number(limit), Number(offset)]);
        
        res.json(messages.reverse());
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const searchMessages = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) return res.json([]);
        const [messages] = await db.execute(`
            SELECT * FROM messages 
            WHERE message LIKE ? 
            ORDER BY created_at DESC 
            LIMIT 20
        `, [`%${q}%`]);
        res.json(messages);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const deleteMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const { deleteForEveryone } = req.body;
        if (deleteForEveryone) {
            await db.execute('DELETE FROM messages WHERE id = ? AND sender_id = ?', [id, req.user.id]);
        } else {
            await db.execute('UPDATE messages SET deleted_sender = true WHERE id = ? AND sender_id = ?', [id, req.user.id]);
            await db.execute('UPDATE messages SET deleted_receiver = true WHERE id = ? AND receiver_id = ?', [id, req.user.id]);
        }
        res.json({ message: 'Message deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const clearChat = async (req, res) => {
    try {
        const { otherUserId } = req.params;
        const myId = req.user.id;

        // Mark messages I sent to otherUserId as deleted_sender = true
        await db.execute('UPDATE messages SET deleted_sender = true WHERE sender_id = ? AND receiver_id = ?', [myId, otherUserId]);
        
        // Mark messages otherUserId sent to me as deleted_receiver = true
        await db.execute('UPDATE messages SET deleted_receiver = true WHERE sender_id = ? AND receiver_id = ?', [otherUserId, myId]);

        res.json({ message: 'Chat cleared successfully' });
    } catch (error) {
        console.error('Error clearing chat:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { getMessages, searchMessages, deleteMessage, clearChat };
