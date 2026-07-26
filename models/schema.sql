CREATE DATABASE IF NOT EXISTS ezhil_nisha_chat;
USE ezhil_nisha_chat;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    avatar VARCHAR(255) DEFAULT NULL,
    about TEXT,
    is_online BOOLEAN DEFAULT FALSE,
    last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    message TEXT,
    message_type ENUM('text', 'image', 'video') DEFAULT 'text',
    media_url VARCHAR(255) DEFAULT NULL,
    reply_to INT DEFAULT NULL,
    is_seen BOOLEAN DEFAULT FALSE,
    deleted_sender BOOLEAN DEFAULT FALSE,
    deleted_receiver BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (receiver_id) REFERENCES users(id),
    FOREIGN KEY (reply_to) REFERENCES messages(id) ON DELETE SET NULL
);
