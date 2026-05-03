CREATE TYPE "OperationKind" AS ENUM ('income', 'expense', 'transfer', 'debt_repayment', 'adjustment', 'unallocated');

CREATE TYPE "PlannedOperationStatus" AS ENUM ('planned', 'overdue', 'done', 'skipped', 'cancelled');

CREATE TABLE "OperationSeries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "OperationKind" NOT NULL,
    "defaultAmount" DECIMAL(14,2) NOT NULL,
    "finalAmount" DECIMAL(14,2),
    "startDate" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL,
    "sourceAccountId" TEXT,
    "targetAccountId" TEXT,
    "targetDebtId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OperationSeries_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PlannedOperation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" "OperationKind" NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "plannedDate" TIMESTAMP(3) NOT NULL,
    "expectedDate" TIMESTAMP(3),
    "actualDate" TIMESTAMP(3),
    "status" "PlannedOperationStatus" NOT NULL,
    "note" TEXT,
    "sourceAccountId" TEXT,
    "targetAccountId" TEXT,
    "targetDebtId" TEXT,
    "seriesId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PlannedOperation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Operation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" "OperationKind" NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "operationDate" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "plannedOperationId" TEXT,
    "seriesId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Operation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OperationEntry" (
    "id" TEXT NOT NULL,
    "operationId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OperationEntry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OperationSeries_userId_createdAt_idx" ON "OperationSeries"("userId", "createdAt");
CREATE INDEX "PlannedOperation_userId_plannedDate_idx" ON "PlannedOperation"("userId", "plannedDate");
CREATE INDEX "PlannedOperation_seriesId_idx" ON "PlannedOperation"("seriesId");
CREATE INDEX "Operation_userId_operationDate_idx" ON "Operation"("userId", "operationDate");
CREATE INDEX "Operation_plannedOperationId_idx" ON "Operation"("plannedOperationId");
CREATE INDEX "OperationEntry_operationId_idx" ON "OperationEntry"("operationId");
CREATE INDEX "OperationEntry_targetType_targetId_idx" ON "OperationEntry"("targetType", "targetId");

ALTER TABLE "OperationSeries" ADD CONSTRAINT "OperationSeries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PlannedOperation" ADD CONSTRAINT "PlannedOperation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PlannedOperation" ADD CONSTRAINT "PlannedOperation_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "OperationSeries"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Operation" ADD CONSTRAINT "Operation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OperationEntry" ADD CONSTRAINT "OperationEntry_operationId_fkey" FOREIGN KEY ("operationId") REFERENCES "Operation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
