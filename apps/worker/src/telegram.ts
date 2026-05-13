export type TelegramAuthUser = {
  id: number;
  username?: string;
  first_name?: string;
};

const telegramAuthMaxAgeSeconds = 24 * 60 * 60;

function hex(bytes: ArrayBuffer) {
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function bytes(value: string) {
  const encoded = new TextEncoder().encode(value);
  return encoded.buffer.slice(encoded.byteOffset, encoded.byteOffset + encoded.byteLength) as ArrayBuffer;
}

async function hmac(key: CryptoKey | ArrayBuffer, data: string | ArrayBuffer) {
  const cryptoKey =
    key instanceof CryptoKey
      ? key
      : await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const payload = typeof data === "string" ? bytes(data) : data;
  return crypto.subtle.sign("HMAC", cryptoKey, payload);
}

export async function verifyTelegramInitData(initData: string, botToken: string) {
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) throw new Error("Telegram hash is missing");

  params.delete("hash");
  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secret = await hmac(bytes("WebAppData"), botToken);
  const calculated = hex(await hmac(secret, dataCheckString));
  if (calculated !== hash) throw new Error("Telegram signature is invalid");
  assertFreshAuthDate(params.get("auth_date"));

  const userJson = params.get("user");
  if (!userJson) throw new Error("Telegram user is missing");
  return JSON.parse(userJson) as TelegramAuthUser;
}

function assertFreshAuthDate(value: string | null) {
  const authDate = Number(value);
  const now = Math.floor(Date.now() / 1000);
  if (!Number.isFinite(authDate) || now - authDate > telegramAuthMaxAgeSeconds || authDate - now > 60) {
    throw new Error("Telegram auth data is expired");
  }
}
