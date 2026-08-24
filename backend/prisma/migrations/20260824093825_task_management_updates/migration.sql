-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "actualHours" DOUBLE PRECISION,
ADD COLUMN     "estimatedHours" DOUBLE PRECISION;

-- CreateIndex
CREATE INDEX "Task_projectId_status_idx" ON "Task"("projectId", "status");

-- CreateIndex
CREATE INDEX "Task_assigneeId_status_idx" ON "Task"("assigneeId", "status");
