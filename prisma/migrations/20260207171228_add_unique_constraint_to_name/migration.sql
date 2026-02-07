/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `medications` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "medications_name_key" ON "medications"("name");
