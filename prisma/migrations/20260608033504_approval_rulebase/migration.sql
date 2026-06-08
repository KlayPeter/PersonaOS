-- AlterTable
ALTER TABLE `WorkflowRun` MODIFY `workflowType` ENUM('analyze_material', 'apply_proposal', 'generate_artifact', 'playground_run', 'feedback_to_proposal') NOT NULL;

-- CreateTable
CREATE TABLE `Changelog` (
    `id` VARCHAR(191) NOT NULL,
    `workspaceId` VARCHAR(191) NOT NULL,
    `changeType` ENUM('rule_added', 'rule_modified', 'rule_deleted', 'rule_archived', 'artifact_generated', 'proposal_rejected') NOT NULL,
    `summary` VARCHAR(191) NOT NULL,
    `detail` TEXT NOT NULL,
    `relatedProposalId` VARCHAR(191) NULL,
    `relatedRuleId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Changelog_workspaceId_createdAt_idx`(`workspaceId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Changelog` ADD CONSTRAINT `Changelog_workspaceId_fkey` FOREIGN KEY (`workspaceId`) REFERENCES `Workspace`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Changelog` ADD CONSTRAINT `Changelog_relatedProposalId_fkey` FOREIGN KEY (`relatedProposalId`) REFERENCES `RuleProposal`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Changelog` ADD CONSTRAINT `Changelog_relatedRuleId_fkey` FOREIGN KEY (`relatedRuleId`) REFERENCES `Rule`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
