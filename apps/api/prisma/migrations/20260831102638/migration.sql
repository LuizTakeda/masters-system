/*
  Warnings:

  - You are about to drop the `GlobalContextFile` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "GlobalContextFile";

-- CreateTable
CREATE TABLE "FiwareContextFile" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "file" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FiwareContextFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FiwareContextFile_name_key" ON "FiwareContextFile"("name");
