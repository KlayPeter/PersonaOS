-- CreateTable
CREATE TABLE `PlaygroundRun` (
    `id` VARCHAR(191) NOT NULL,
    `workspaceId` VARCHAR(191) NOT NULL,
    `sourceArtifactId` VARCHAR(191) NULL,
    `artifactType` ENUM('agents_md', 'writing_style', 'personal_system') NOT NULL,
    `inputTask` TEXT NOT NULL,
    `output` LONGTEXT NOT NULL,
    `feedback` ENUM('good', 'not_like_me', 'too_vague', 'too_short', 'too_long', 'too_scattered', 'too_template', 'logic_weak', 'examples_missing', 'custom') NULL,
    `feedbackText` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PlaygroundRun_workspaceId_artifactType_createdAt_idx`(`workspaceId`, `artifactType`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `PlaygroundRun` ADD CONSTRAINT `PlaygroundRun_workspaceId_fkey` FOREIGN KEY (`workspaceId`) REFERENCES `Workspace`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PlaygroundRun` ADD CONSTRAINT `PlaygroundRun_sourceArtifactId_fkey` FOREIGN KEY (`sourceArtifactId`) REFERENCES `Artifact`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
