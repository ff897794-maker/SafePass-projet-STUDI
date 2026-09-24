const crypto = require("crypto");
const { buffer } = require("stream/consumers");
const ENCRYPTION_KEY = buffer.from(process.env.ENCRYPTION_KEY, "hex");
const ALGORITHM = "aes-256-gcm";

function encrypt(text) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, "UTF-8", "hex");
  encrypted += cipher.final("hex");
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted}`;
}

function decrypt(text) {
  const [iv, tag, encrypted] = text.split(":");
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    ENCRYPTION_KEY,
    buffer.from(iv, "hex"),
  );
  decipher.setAuthTag(buffer.from(tag, "hex"));
  let decrypted = decipher.update(encrypted, "hex", "UTF-8");
  decrypted += decipher.final("UTF-8");
  return decrypted;
}

module.exports = {
  encrypt,
  decrypt,
};
