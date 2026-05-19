CREATE TABLE IF NOT EXISTS "TrainingUser" (
  id TEXT PRIMARY KEY,
  "telegramId" TEXT NOT NULL UNIQUE,
  username TEXT,
  "firstName" TEXT,
  role TEXT NOT NULL DEFAULT 'student',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "TrainingUser_role_idx" ON "TrainingUser"(role);

CREATE TABLE IF NOT EXISTS "TrainingCoachStudent" (
  id TEXT PRIMARY KEY,
  "coachId" TEXT NOT NULL REFERENCES "TrainingUser"(id) ON DELETE CASCADE,
  "studentId" TEXT NOT NULL REFERENCES "TrainingUser"(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active',
  goal TEXT NOT NULL DEFAULT 'Персональное ведение',
  risk TEXT NOT NULL DEFAULT 'green',
  compliance INTEGER NOT NULL DEFAULT 100,
  "joinedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "TrainingCoachStudent_coachId_studentId_key" UNIQUE ("coachId", "studentId")
);

CREATE INDEX IF NOT EXISTS "TrainingCoachStudent_studentId_idx" ON "TrainingCoachStudent"("studentId");

CREATE TABLE IF NOT EXISTS "TrainingPlan" (
  id TEXT PRIMARY KEY,
  "coachId" TEXT NOT NULL REFERENCES "TrainingUser"(id) ON DELETE CASCADE,
  "studentId" TEXT REFERENCES "TrainingUser"(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  goal TEXT NOT NULL,
  "startDate" TIMESTAMPTZ NOT NULL,
  weeks INTEGER NOT NULL DEFAULT 4,
  status TEXT NOT NULL DEFAULT 'active',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "TrainingPlan_coachId_createdAt_idx" ON "TrainingPlan"("coachId", "createdAt");
CREATE INDEX IF NOT EXISTS "TrainingPlan_studentId_startDate_idx" ON "TrainingPlan"("studentId", "startDate");

CREATE TABLE IF NOT EXISTS "TrainingSession" (
  id TEXT PRIMARY KEY,
  "planId" TEXT REFERENCES "TrainingPlan"(id) ON DELETE CASCADE,
  "coachId" TEXT NOT NULL REFERENCES "TrainingUser"(id) ON DELETE CASCADE,
  "studentId" TEXT REFERENCES "TrainingUser"(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  "scheduledDate" TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'planned',
  focus TEXT NOT NULL DEFAULT 'Сила',
  "durationMin" INTEGER NOT NULL DEFAULT 45,
  intensity INTEGER NOT NULL DEFAULT 6,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "TrainingSession_coachId_scheduledDate_idx" ON "TrainingSession"("coachId", "scheduledDate");
CREATE INDEX IF NOT EXISTS "TrainingSession_studentId_scheduledDate_idx" ON "TrainingSession"("studentId", "scheduledDate");

CREATE TABLE IF NOT EXISTS "TrainingExercise" (
  id TEXT PRIMARY KEY,
  "sessionId" TEXT NOT NULL REFERENCES "TrainingSession"(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sets INTEGER NOT NULL,
  reps TEXT NOT NULL,
  weight TEXT NOT NULL,
  "restSec" INTEGER NOT NULL DEFAULT 90,
  notes TEXT NOT NULL DEFAULT '',
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "actualSets" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "TrainingExercise_sessionId_sortOrder_idx" ON "TrainingExercise"("sessionId", "sortOrder");

CREATE TABLE IF NOT EXISTS "TrainingWorkoutLog" (
  id TEXT PRIMARY KEY,
  "sessionId" TEXT NOT NULL REFERENCES "TrainingSession"(id) ON DELETE CASCADE,
  "studentId" TEXT NOT NULL,
  "exerciseId" TEXT REFERENCES "TrainingExercise"(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'done',
  "actualSets" INTEGER NOT NULL DEFAULT 0,
  feedback TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "TrainingWorkoutLog_sessionId_createdAt_idx" ON "TrainingWorkoutLog"("sessionId", "createdAt");
CREATE INDEX IF NOT EXISTS "TrainingWorkoutLog_studentId_createdAt_idx" ON "TrainingWorkoutLog"("studentId", "createdAt");

CREATE TABLE IF NOT EXISTS "TrainingChatMessage" (
  id TEXT PRIMARY KEY,
  "coachId" TEXT NOT NULL REFERENCES "TrainingUser"(id) ON DELETE CASCADE,
  "studentId" TEXT NOT NULL REFERENCES "TrainingUser"(id) ON DELETE CASCADE,
  "senderId" TEXT NOT NULL REFERENCES "TrainingUser"(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  context TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "readAt" TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS "TrainingChatMessage_coachId_createdAt_idx" ON "TrainingChatMessage"("coachId", "createdAt");
CREATE INDEX IF NOT EXISTS "TrainingChatMessage_studentId_createdAt_idx" ON "TrainingChatMessage"("studentId", "createdAt");

CREATE TABLE IF NOT EXISTS "TrainingBalanceTransaction" (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "TrainingUser"(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  amount NUMERIC(14, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'success',
  note TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "TrainingBalanceTransaction_userId_createdAt_idx" ON "TrainingBalanceTransaction"("userId", "createdAt");

CREATE TABLE IF NOT EXISTS "TrainingTelegramUpdate" (
  id TEXT PRIMARY KEY,
  "updateId" BIGINT NOT NULL UNIQUE,
  "processedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
