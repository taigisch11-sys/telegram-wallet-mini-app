export type TelegramUser = {
  id: string;
  username?: string;
  firstName?: string;
  lastName?: string;
};

export async function verifyTelegramInitData(initData: string, botToken?: string, maxAgeSeconds = 86400): Promise<TelegramUser> {
  if (!botToken) throw new Error("Telegram bot token is not configured");

  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  const userRaw = params.get("user");
  const authDate = params.get("auth_date");
  if (!hash || !userRaw || !authDate) throw new Error("Invalid Telegram init data");

  const authTime = Number(authDate);
  if (!Number.isFinite(authTime) || Math.floor(Date.now() / 1000) - authTime > maxAgeSeconds) {
    throw new Error("Telegram init data is expired");
  }

  params.delete("hash");
  const dataCheckString = [...params.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
  const secretKey = await hmacSha256(encodeUtf8("WebAppData"), encodeUtf8(botToken));
  const expectedHash = toHex(await hmacSha256(secretKey, encodeUtf8(dataCheckString)));
  if (!timingSafeEqual(expectedHash, hash)) throw new Error("Telegram init data signature mismatch");

  const parsedUser = JSON.parse(userRaw) as {
    id: number | string;
    username?: string;
    first_name?: string;
    last_name?: string;
  };

  return {
    id: String(parsedUser.id),
    username: parsedUser.username,
    firstName: parsedUser.first_name,
    lastName: parsedUser.last_name
  };
}

export async function callTelegramApi<T>(
  botToken: string | undefined,
  method: string,
  payload: Record<string, unknown>
): Promise<T | null> {
  if (!botToken) return null;
  const response = await fetch(`https://api.telegram.org/bot${botToken}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error(`Telegram API ${method} failed: ${response.status}`);
  return (await response.json()) as T;
}

function encodeUtf8(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}

async function hmacSha256(key: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey("raw", toArrayBuffer(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, toArrayBuffer(data));
  return new Uint8Array(signature);
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

function toHex(bytes: Uint8Array): string {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function timingSafeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return mismatch === 0;
}
