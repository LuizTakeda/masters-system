-- CreateTable
CREATE TABLE "ProjectContextFile" (
    "id" TEXT NOT NULL,
    "project" TEXT NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "file" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectContextFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProjectContextFile_project_key" ON "ProjectContextFile"("project");

-- CreateIndex
CREATE INDEX "ProjectContextFile_project_idx" ON "ProjectContextFile"("project");
