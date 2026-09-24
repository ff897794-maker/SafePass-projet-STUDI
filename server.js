require("dotenv").config(); //charge les variables d'environnement du fichier .env
const express = require("express");
const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const path = require("path");
const { error } = require("console");
const { encrypt, decrypt } = require("./utils/crypto");

const app = express();

//Middleware pour analyser le JSON envoyé par le front (script.js)
app.use(express.json());

// Sert les fichiers statiques (index.html, style.css, script.js)
app.use(express.static(path.join(__dirname, "public")));

// Configuration de la connexion PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// --- ROUTES AUTHENTIFICATION -- //

/**
 * Inscription d'un nouvel utilisateur
 */

app.post("/api/auth/register", async (req, res) => {
  const { email, password } = req.body;

  try {
    //1. On hache le mot de passe (Salage + Hachage 10 tours)
    const passwordHash = await bcrypt.hash(password, 10);
    //2. Insertion utilisateur dans la table users
    await pool.query(
      "INSERT INTO users (email, password_hash) VALUES ($1, $2)",
      [email, passwordHash],
    );
    res.status(201).json({ message: "Utilisateur créé avec succès !" });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Erreur lors de l'inscription(Email peut-être déjà utilisée)",
    });
  }
});

/**
 * Connexion login
 * Si les identifiants de l'utilisateur sont bons, on génère une jeton JWT
 */

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Chercher l'utilisateur dans la bdd
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Utilisateur non trouvé" });
    }
    const user = result.rows[0];

    //2. Comparer le mot de passe saisi avec le HASH stocké
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      return res.status(401).json({ error: "Mot de passe incorrect" });
    }

    //3. Génération du JWT (token), expiration 2 heures
    const token = jwt.sign(
      { userId: user.id_user, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "2H" },
    );

    res.json({ message: "Connecté", token });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

//--------------- MIDDLEWARE DE PROTECTION ----------------//
/**
 * Fonction vérification si l'utilisateur est bien connecté via jwt
 */

const authenticateToken = (req, res, next) => {
  const authHeader = req.header["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Format: Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: "Accés refusé" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Token invalide" });
    }
    req.user = user; // On stocke les infos de l'utilisateur dans la requête
    next();
  });
};

// -------- ROUTES GESTIONS DES MOT DE PASSE(Placeholder)-------------- //
app.get("/api/passwords", authenticateToken, async (req, res) => {
  // Récuperation uniquement des mots de passe de l'utilisateur connecté
  try {
    const result = await pull.query(
      "SELECT * FROM passwords WHERE user_id = $1",
      [req.user.user_id],
    );
    // on déchiffre chaque MDP un par un
    const decryptedRows = result.rows.map((row) => ({
      ...row,
      password_value: decrypt(row.password_value),
    }));
    res.json(decryptedRows);
  } catch (error) {
    return res.status(403).json({ error: "Erreur lors de la récupération" });
  }
});

// Ajouter un MDP chiffré
app.post("/api/passwords", authenticateToken, async (req, res) => {
  const { site_name, username, password_value } = req.body;
  const encrypted = encrypted(password_value);
  await pool.query(
    "INSERT INTO passwords (site_name, username, password_value, user_id) VALUES ($1, $2, $3, $4)",
    [site_name, username, encrypted, req.user.userId],
  );
  res.json({ message: "Enregistré !" });
});

// SUpprimer un accès
app.delete("/api/passwords/:id", authenticateToken, async (req, res) => {
  await pool.query(
    "DELETE FROM passwords WHERE id_password = $1 AND user_id = $2",
    [req.params.id, req.user.userId],
  );
  res.json({ message: "Supprimé !" });
});

// Supprimer un utilisateur
app.delete("/api/auth/me", authenticateToken, async (req, res) => {
  await pool.query("DELETE FROM users WHERE id_user = $1", [req.user.userId]);
  res.json({ message: "Compte supprimé !" });
});

// Lancement du serveur

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Safepass v1 running on PORT:${PORT} `);
});
