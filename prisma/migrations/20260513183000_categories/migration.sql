CREATE TYPE "CategoryType" AS ENUM ('income', 'expense', 'transfer', 'debt');

CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "CategoryType" NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#5b8cff',
    "icon" TEXT NOT NULL DEFAULT 'tag',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Income" ADD COLUMN "categoryId" TEXT;
ALTER TABLE "Payment" ADD COLUMN "categoryId" TEXT;
ALTER TABLE "OperationSeries" ADD COLUMN "categoryId" TEXT;
ALTER TABLE "PlannedOperation" ADD COLUMN "categoryId" TEXT;
ALTER TABLE "Operation" ADD COLUMN "categoryId" TEXT;

CREATE UNIQUE INDEX "Category_userId_name_type_key" ON "Category"("userId", "name", "type");
CREATE INDEX "Category_userId_type_idx" ON "Category"("userId", "type");
CREATE INDEX "Income_categoryId_idx" ON "Income"("categoryId");
CREATE INDEX "Payment_categoryId_idx" ON "Payment"("categoryId");
CREATE INDEX "OperationSeries_categoryId_idx" ON "OperationSeries"("categoryId");
CREATE INDEX "PlannedOperation_categoryId_idx" ON "PlannedOperation"("categoryId");
CREATE INDEX "Operation_categoryId_idx" ON "Operation"("categoryId");

ALTER TABLE "Category" ADD CONSTRAINT "Category_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Income" ADD CONSTRAINT "Income_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OperationSeries" ADD CONSTRAINT "OperationSeries_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PlannedOperation" ADD CONSTRAINT "PlannedOperation_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Operation" ADD CONSTRAINT "Operation_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
