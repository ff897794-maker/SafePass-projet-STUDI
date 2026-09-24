// Element DOM
const btnGenerate = document.getElementById("btnGenerate");
const btnSave = document.getElementById("btnSave");
const passInput = document.getElementById("generatedPassword");

// GESTION DE L'AUTHENTIFICATION
let USER_TOKEN = localStorage.getItem("safepass_token") || null;

document.addEventListener("DOMContentLoaded", () => {
  if (USER_TOKEN) {
    showApp();
    displayVault();
  } else {
    showAuth();
  }
  setupEventListeners();
});

async function login(email, password) {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await response.json();
  if (response.ok) {
    userToken = data.token;
    localStorage.setItem("safepass_token", data.token);
    alert("Connexion réussie !");
    displayVault();
  } else {
    alert(data.error);
  }
}

// Fonction génération mdp securisé
function generateSecurePassword(Length = 16) {
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
  let returnVal = "";

  // Utilisation de l'API Crypto pour une sécurité maximale au frontend
  const values = new Uint32Array();
  window.crypto.getRandomValues(values);

  for (let i = 0; i < Length; i++) {
    returnVal += charset[values[i] % charset.length];
  }
  //Mise à jour de l'indicateur de force
  updateStrengthIndicator(returnVal);
  return returnVal;
}

function setupEventListeners() {
  btnGenerate.addEventListener("click", () => {
    passInput.value = generateSecurePassword();
  });

  btnSave.addEventListener("click", async () => {
    const data = {
      site_name: document.getElementById("siteName").value,
      username: document.getElementById("userName").value,
      password_value: document.getElementById("generatePassword").value,
    };

    if (!data.site_name || !data.password_value || !data.username)
      return alert("Veuillez remplir les champs!");

    await fetch("/api/passwords", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify(data),
    });
    // STOCKAGE LOCAL (temporaire)
    // let vault = JSON.parse(localStorage.getItem("vault") || "[]");
    // vault.push(data);
    // localStorage.setItem("vault", JSON.stringify(vault));

    displayVault();
  });
}

function updateStrengthIndicator(pwd) {
  const strength =
    pwd.length > 12 && /[!@#$%^&*]/.test(pwd) ? "strong" : "Weak";
  passInput.style.border =
    strength === "strong" ? "3px solid #2eb82e" : "3px solid #ff4d4d";
}

async function displayVault() {
  const list = document.getElementById("credentialsList");
  list.innerHTML = "<p> Chargement du coffre....</p>";
  try {
    const response = await fetch("/api/passwords", {
      headers: {
        Authorization: `Bearer ${USER_TOKEN}`,
      },
    });
    const passwords = await response.json();
    list.innerHTML = "";

    if (passwords.length === 0) {
      list.innerHTML = "<p>Votre coffre est vide</p>";
      return;
    }
    passwords.array.forEach((password) => {
      const item = document.createElement("div");
      item.className = "storage-card";
      item.style.marginBottom = "10px";
      item.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div>
              <strong>${p.site_name}</strong><br>
              <small>${p.username}</small>
          </div>
          <div>
            <button onclick="copyToClipboard('${p.password_value}')" title="Copier">📋</button>
            <button onclick="deleteEntry(${p.id_password})" style="background:#ff4444; color:white;" title="Supprimer">🗑️</button>
          </div>
        </div>
        <input type="password" value="${p.password_value}" readonly 
        style="margin-top:10px; background:#eee;" onclick="this.type='text'" onblur="this.type='password'">
      `;
      list.appendChild(item);
    });
  } catch (error) {
    list.innerHTML = "<p style='color:red;'>Erreur lors du chargement.</p>";
  }
}
