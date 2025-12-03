/*
  Warnings:

  - You are about to alter the column `tipo` on the `competencia` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(50)`.
  - You are about to alter the column `nivel` on the `competencia` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(50)`.
  - A unique constraint covering the columns `[codigo]` on the table `Competencia` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `competencia` MODIFY `tipo` VARCHAR(50) NOT NULL,
    MODIFY `nivel` VARCHAR(50) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Competencia_codigo_key` ON `Competencia`(`codigo`);
