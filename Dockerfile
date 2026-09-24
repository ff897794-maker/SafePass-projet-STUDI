# 1. Utilisation d'une image Alpine pour réduire la surface d'attaque
FROM node:22-alpine

# 2. Définition de l'environnement de production
ENV NODE_ENV=production

# 3. Création d'un répertoire de travail
WORKDIR /app

# 4. Installation des dépendances en premier (optimisation du cache Docker)
# On ne copie que les fichiers de gestion de paquets d'abord
COPY package*.json ./

# 5. Installation propre (uniquement les dépendances de prod, sans les outils de dev)
# On ajoute 'frozen-lockfile' ou on utilise 'npm ci' pour garantir l'intégrité
RUN npm ci --only=production

# 6. Copie du reste du code source
COPY . .

# 7. SÉCURITÉ : Ne jamais exécuter l'application en tant que 'root'
# L'image Node possède par défaut un utilisateur 'node' moins privilégié
USER node

# 8. Exposition du port
EXPOSE 3000

# 9. Lancement de l'application
CMD ["node", "server.js"]