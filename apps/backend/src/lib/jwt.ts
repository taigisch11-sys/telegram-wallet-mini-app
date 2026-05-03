import { SignJWT, jwtVerify } from "jose";
import { env } from "../env";

const secret = () => new TextEncoder().encode(env.JWT_SECRET);

export async function signJwt(payload: { userId: string; telegramId: string }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret());
}

export async function verifyJwt(token: string) {
  const { payload } = await jwtVerify(token, secret());
  return payload as { userId: string; telegramId: string };
}
