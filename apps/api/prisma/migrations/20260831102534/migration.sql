/*
  Warnings:

  - You are about to drop the `ProjectContextFile` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "ProjectContextFile";

-- CreateTable
CREATE TABLE "GlobalContextFile" (
    "id" SERIAL NOT NULL,
    "file" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GlobalContextFile_pkey" PRIMARY KEY ("id")
);
