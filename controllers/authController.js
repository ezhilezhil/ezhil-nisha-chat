const jwt = require('jsonwebtoken');
const db = require('../config/db');

const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // In a real app we'd use bcrypt, but since it's just two predefined users
        // we can either hash them or just do simple comparison if you prefer,
        // but the requirements state bcrypt. I'll implement bcrypt checking.
        const bcrypt = require('bcrypt');

        const [users] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);

        if (users.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username },
            process.env.JWT_SECRET || 'fallback_secret_key',
            { expiresIn: '7d' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                username: user.username,
                avatar: user.avatar,
                about: user.about
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getProfile = async (req, res) => {
    try {
        const [users] = await db.execute('SELECT id, name, username, avatar, about, is_online, last_seen FROM users WHERE id = ?', [req.user.id]);
        if (users.length === 0) return res.status(404).json({ message: 'User not found' });
        res.json(users[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const updateProfile = async (req, res) => {
    try {
        const { name, about, avatar } = req.body;
        
        // Fetch current to avoid overwriting with null
        const [current] = await db.execute('SELECT name, about, avatar FROM users WHERE id = ?', [req.user.id]);
        if (current.length === 0) return res.status(404).json({ message: 'User not found' });
        
        const newName = name !== undefined ? name : current[0].name;
        const newAbout = about !== undefined ? about : current[0].about;
        const newAvatar = avatar !== undefined ? avatar : current[0].avatar;
        
        await db.execute('UPDATE users SET name = ?, about = ?, avatar = ? WHERE id = ?', [newName, newAbout, newAvatar, req.user.id]);
        res.json({ message: 'Profile updated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getOtherProfile = async (req, res) => {
    try {
        const [users] = await db.execute('SELECT id, name, username, avatar, about, is_online, last_seen FROM users WHERE id = ?', [req.params.id]);
        if (users.length === 0) return res.status(404).json({ message: 'User not found' });
        res.json(users[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { login, getProfile, updateProfile, getOtherProfile };
