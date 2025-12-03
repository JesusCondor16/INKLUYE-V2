/*
  Warnings:

  - You are about to alter the column `descripcion` on the `competencia` table. The data in that column could be lost. The data in that column will be cast from `VarChar(500)` to `VarChar(191)`.
  - Made the column `cursoId` on table `competencia` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `competencia` DROP FOREIGN KEY `Competencia_cursoId_fkey`;

-- DropIndex
DROP INDEX `Competencia_cursoId_fkey` ON `competencia`;

-- AlterTable
ALTER TABLE `competencia` MODIFY `codigo` VARCHAR(191) NOT NULL,
    MODIFY `descripcion` VARCHAR(191) NOT NULL,
    MODIFY `tipo` VARCHAR(191) NOT NULL,
    MODIFY `nivel` VARCHAR(191) NOT NULL,
    MODIFY `cursoId` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `Competencia` ADD CONSTRAINT `Competencia_cursoId_fkey` FOREIGN KEY (`cursoId`) REFERENCES `Course`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
