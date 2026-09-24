
--1 Creation de la table utilisateurs
CREATE TABLE IF NOT EXISTS users (
    id_user SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL --Stockage Bcrypt
);

--2 creation de la table passwords
CREATE TABLE IF NOT EXISTS passwords (
    id_password SERIAL PRIMARY KEY,
    site_name VARCHAR(100) NOT NULL,
    username VARCHAR(100),
    password_value TEXT NOT NULL, --Stockage AES-256
    user_id INTEGER REFERENCES users(id_user) ON DELETE CASCADE
);

-- 3. Insertion de l'utilisateur de test (Email: admin@safepass.com | MDP: admin123)
INSERT INTO users (email, password_hash) 
VALUES ('admin@safepass.com', '$2b$10$px994f796S3S7mYpB6L5mO66P2vB.8OuyR6.W66S66S66S66S66S6')
ON CONFLICT (email) DO NOTHING;

--4 Index pour accelerer les recherches par utilisateurs
CREATE INDEX idx_user_id ON passwords(user_id);