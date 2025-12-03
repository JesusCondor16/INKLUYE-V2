-- DropForeignKey
ALTER TABLE `competencia` DROP FOREIGN KEY `Competencia_cursoId_fkey`;

-- DropIndex
DROP INDEX `Competencia_cursoId_fkey` ON `competencia`;

-- AlterTable
ALTER TABLE `competencia` MODIFY `cursoId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `Competencia` ADD CONSTRAINT `Competencia_cursoId_fkey` FOREIGN KEY (`cursoId`) REFERENCES `Course`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
