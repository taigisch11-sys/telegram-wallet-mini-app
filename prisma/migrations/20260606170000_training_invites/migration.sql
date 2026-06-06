CREATE TABLE IF NOT EXISTS "TrainingInvite" (
  id TEXT PRIMARY KEY,
  "coachId" TEXT NOT NULL REFERENCES "TrainingUser"(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "acceptedAt" TIMESTAMPTZ,
  "acceptedByUserId" TEXT REFERENCES "TrainingUser"(id) ON DELETE SET NULL,
  CONSTRAINT "TrainingInvite_status_check" CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  CONSTRAINT "TrainingInvite_expiry_check" CHECK ("expiresAt" > "createdAt"),
  CONSTRAINT "TrainingInvite_acceptance_check" CHECK (
    (status = 'accepted' AND "acceptedAt" IS NOT NULL AND "acceptedByUserId" IS NOT NULL)
    OR (status <> 'accepted' AND "acceptedAt" IS NULL AND "acceptedByUserId" IS NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS "TrainingInvite_code_key" ON "TrainingInvite"(code);
CREATE INDEX IF NOT EXISTS "TrainingInvite_coachId_createdAt_idx" ON "TrainingInvite"("coachId", "createdAt");
CREATE INDEX IF NOT EXISTS "TrainingInvite_status_expiresAt_idx" ON "TrainingInvite"(status, "expiresAt");
CREATE INDEX IF NOT EXISTS "TrainingInvite_acceptedByUserId_idx" ON "TrainingInvite"("acceptedByUserId");
