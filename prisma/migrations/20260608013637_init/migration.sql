-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Workspace` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `identity` VARCHAR(191) NULL,
    `primaryScenarios` JSON NULL,
    `rememberNotes` TEXT NULL,
    `dislikedBehaviors` JSON NULL,
    `outputPreferences` JSON NULL,
    `exportGoals` JSON NULL,
    `profileSummary` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Workspace_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Material` (
    `id` VARCHAR(191) NOT NULL,
    `workspaceId` VARCHAR(191) NOT NULL,
    `type` ENUM('article', 'code_rule', 'prompt', 'feedback', 'failed_output', 'note', 'project_description') NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `summary` TEXT NULL,
    `content` LONGTEXT NOT NULL,
    `tags` JSON NULL,
    `status` ENUM('unprocessed', 'analyzed', 'used', 'archived') NOT NULL DEFAULT 'unprocessed',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Material_workspaceId_status_createdAt_idx`(`workspaceId`, `status`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Insight` (
    `id` VARCHAR(191) NOT NULL,
    `workspaceId` VARCHAR(191) NOT NULL,
    `materialId` VARCHAR(191) NOT NULL,
    `type` ENUM('preference', 'principle', 'boundary', 'style', 'workflow', 'anti_pattern') NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `evidence` TEXT NOT NULL,
    `confidence` DOUBLE NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Insight_workspaceId_materialId_createdAt_idx`(`workspaceId`, `materialId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RuleProposal` (
    `id` VARCHAR(191) NOT NULL,
    `workspaceId` VARCHAR(191) NOT NULL,
    `materialId` VARCHAR(191) NULL,
    `insightId` VARCHAR(191) NULL,
    `title` VARCHAR(191) NOT NULL,
    `category` ENUM('personal', 'ai_collaboration', 'coding', 'writing', 'knowledge', 'product') NOT NULL,
    `action` ENUM('add', 'modify', 'delete') NOT NULL,
    `proposedContent` TEXT NOT NULL,
    `reason` TEXT NOT NULL,
    `evidence` TEXT NOT NULL,
    `affectedArtifacts` JSON NULL,
    `confidence` DOUBLE NULL,
    `status` ENUM('pending', 'accepted', 'rejected', 'edited') NOT NULL DEFAULT 'pending',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `RuleProposal_workspaceId_status_createdAt_idx`(`workspaceId`, `status`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Rule` (
    `id` VARCHAR(191) NOT NULL,
    `workspaceId` VARCHAR(191) NOT NULL,
    `category` ENUM('personal', 'ai_collaboration', 'coding', 'writing', 'knowledge', 'product') NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `sourceProposalId` VARCHAR(191) NULL,
    `sourceMaterialId` VARCHAR(191) NULL,
    `status` ENUM('active', 'archived') NOT NULL DEFAULT 'active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Rule_workspaceId_category_status_updatedAt_idx`(`workspaceId`, `category`, `status`, `updatedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WorkflowRun` (
    `id` VARCHAR(191) NOT NULL,
    `workspaceId` VARCHAR(191) NOT NULL,
    `workflowType` ENUM('analyze_material', 'generate_artifact', 'playground_run', 'feedback_to_proposal') NOT NULL,
    `status` ENUM('pending', 'running', 'waiting_for_human', 'completed', 'failed', 'cancelled') NOT NULL DEFAULT 'pending',
    `triggerSource` ENUM('user_action', 'system_retry') NOT NULL,
    `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `finishedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `WorkflowRun_workspaceId_workflowType_startedAt_idx`(`workspaceId`, `workflowType`, `startedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StepRun` (
    `id` VARCHAR(191) NOT NULL,
    `workflowRunId` VARCHAR(191) NOT NULL,
    `stepName` VARCHAR(191) NOT NULL,
    `status` ENUM('pending', 'running', 'completed', 'failed', 'skipped') NOT NULL DEFAULT 'pending',
    `inputSnapshot` LONGTEXT NOT NULL,
    `outputSnapshot` LONGTEXT NULL,
    `errorMessage` TEXT NULL,
    `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `finishedAt` DATETIME(3) NULL,

    INDEX `StepRun_workflowRunId_startedAt_idx`(`workflowRunId`, `startedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LLMRun` (
    `id` VARCHAR(191) NOT NULL,
    `stepRunId` VARCHAR(191) NOT NULL,
    `model` VARCHAR(191) NOT NULL,
    `promptName` VARCHAR(191) NOT NULL,
    `promptVersion` VARCHAR(191) NOT NULL,
    `inputTokens` INTEGER NULL,
    `outputTokens` INTEGER NULL,
    `rawRequest` LONGTEXT NOT NULL,
    `rawResponse` LONGTEXT NULL,
    `parsedOutput` LONGTEXT NULL,
    `status` ENUM('success', 'parse_failed', 'model_failed') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `LLMRun_stepRunId_createdAt_idx`(`stepRunId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Workspace` ADD CONSTRAINT `Workspace_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Material` ADD CONSTRAINT `Material_workspaceId_fkey` FOREIGN KEY (`workspaceId`) REFERENCES `Workspace`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Insight` ADD CONSTRAINT `Insight_workspaceId_fkey` FOREIGN KEY (`workspaceId`) REFERENCES `Workspace`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Insight` ADD CONSTRAINT `Insight_materialId_fkey` FOREIGN KEY (`materialId`) REFERENCES `Material`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RuleProposal` ADD CONSTRAINT `RuleProposal_workspaceId_fkey` FOREIGN KEY (`workspaceId`) REFERENCES `Workspace`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RuleProposal` ADD CONSTRAINT `RuleProposal_materialId_fkey` FOREIGN KEY (`materialId`) REFERENCES `Material`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RuleProposal` ADD CONSTRAINT `RuleProposal_insightId_fkey` FOREIGN KEY (`insightId`) REFERENCES `Insight`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Rule` ADD CONSTRAINT `Rule_workspaceId_fkey` FOREIGN KEY (`workspaceId`) REFERENCES `Workspace`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Rule` ADD CONSTRAINT `Rule_sourceProposalId_fkey` FOREIGN KEY (`sourceProposalId`) REFERENCES `RuleProposal`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Rule` ADD CONSTRAINT `Rule_sourceMaterialId_fkey` FOREIGN KEY (`sourceMaterialId`) REFERENCES `Material`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WorkflowRun` ADD CONSTRAINT `WorkflowRun_workspaceId_fkey` FOREIGN KEY (`workspaceId`) REFERENCES `Workspace`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StepRun` ADD CONSTRAINT `StepRun_workflowRunId_fkey` FOREIGN KEY (`workflowRunId`) REFERENCES `WorkflowRun`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LLMRun` ADD CONSTRAINT `LLMRun_stepRunId_fkey` FOREIGN KEY (`stepRunId`) REFERENCES `StepRun`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
