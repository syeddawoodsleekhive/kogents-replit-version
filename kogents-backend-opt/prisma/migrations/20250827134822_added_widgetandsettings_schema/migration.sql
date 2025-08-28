/*
  Warnings:

  - You are about to drop the column `businessHours` on the `Widget` table. All the data in the column will be lost.
  - You are about to drop the column `domain` on the `Widget` table. All the data in the column will be lost.
  - You are about to drop the column `isPublished` on the `Widget` table. All the data in the column will be lost.
  - You are about to drop the column `position` on the `Widget` table. All the data in the column will be lost.
  - You are about to drop the column `settings` on the `Widget` table. All the data in the column will be lost.
  - You are about to drop the column `theme` on the `Widget` table. All the data in the column will be lost.
  - You are about to drop the column `widgetId` on the `Widget` table. All the data in the column will be lost.
  - You are about to drop the `WidgetAnalytics` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[settingsId]` on the table `Widget` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[workspaceId,id]` on the table `Widget` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `settingsId` to the `Widget` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "WidgetPosition" AS ENUM ('TOP_LEFT', 'TOP_RIGHT', 'BOTTOM_LEFT', 'BOTTOM_RIGHT');

-- CreateEnum
CREATE TYPE "WidgetSize" AS ENUM ('SMALL', 'MEDIUM', 'LARGE');

-- CreateEnum
CREATE TYPE "WidgetSoundType" AS ENUM ('MESSAGE', 'NOTIFICATION', 'ALERT');

-- DropForeignKey
ALTER TABLE "WidgetAnalytics" DROP CONSTRAINT "WidgetAnalytics_widgetId_fkey";

-- DropForeignKey
ALTER TABLE "WidgetAnalytics" DROP CONSTRAINT "WidgetAnalytics_workspaceId_fkey";

-- DropIndex
DROP INDEX "Widget_domain_idx";

-- DropIndex
DROP INDEX "Widget_widgetId_idx";

-- DropIndex
DROP INDEX "Widget_widgetId_key";

-- AlterTable
ALTER TABLE "Widget" DROP COLUMN "businessHours",
DROP COLUMN "domain",
DROP COLUMN "isPublished",
DROP COLUMN "position",
DROP COLUMN "settings",
DROP COLUMN "theme",
DROP COLUMN "widgetId",
ADD COLUMN     "settingsId" TEXT NOT NULL;

-- DropTable
DROP TABLE "WidgetAnalytics";

-- CreateTable
CREATE TABLE "WidgetSettings" (
    "id" TEXT NOT NULL,
    "appearanceId" TEXT NOT NULL,
    "soundId" TEXT NOT NULL,
    "behaviorId" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "formsId" TEXT NOT NULL,
    "securityId" TEXT NOT NULL,

    CONSTRAINT "WidgetSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WidgetAppearance" (
    "id" TEXT NOT NULL,
    "chatBadge" BOOLEAN NOT NULL DEFAULT false,
    "widgetColorId" TEXT NOT NULL,
    "fontSize" INTEGER NOT NULL,
    "fontFamily" TEXT NOT NULL,
    "position" "WidgetPosition" NOT NULL,
    "borderRadius" INTEGER NOT NULL,
    "size" "WidgetSize" NOT NULL,
    "customSizeWidth" INTEGER,
    "customSizeHeight" INTEGER,
    "showAvatar" BOOLEAN NOT NULL,
    "showCompanyLogo" BOOLEAN NOT NULL,
    "companyLogoUrl" TEXT,

    CONSTRAINT "WidgetAppearance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WidgetColors" (
    "id" TEXT NOT NULL,
    "primary" TEXT NOT NULL,
    "secondary" TEXT NOT NULL,
    "background" TEXT NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "WidgetColors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WidgetSound" (
    "id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL,
    "volume" INTEGER NOT NULL,
    "type" "WidgetSoundType" NOT NULL,
    "hapticFeedback" BOOLEAN NOT NULL,

    CONSTRAINT "WidgetSound_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WidgetBehavior" (
    "id" TEXT NOT NULL,
    "autoOpen" BOOLEAN NOT NULL,
    "autoOpenDelay" INTEGER,
    "offlineMode" BOOLEAN NOT NULL,
    "offlineMessage" TEXT,
    "reduceAnimations" BOOLEAN NOT NULL,
    "autoClose" BOOLEAN NOT NULL,
    "autoCloseDelay" INTEGER,

    CONSTRAINT "WidgetBehavior_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WidgetContent" (
    "id" TEXT NOT NULL,
    "welcomeMessage" TEXT,
    "inputPlaceholder" TEXT,
    "thankyouMessage" TEXT,

    CONSTRAINT "WidgetContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WidgetForms" (
    "id" TEXT NOT NULL,
    "preChatFormId" TEXT NOT NULL,
    "offlineChatFormId" TEXT NOT NULL,
    "postChatFormId" TEXT NOT NULL,
    "userInfoFormId" TEXT NOT NULL,
    "badgeChatFormId" TEXT NOT NULL,

    CONSTRAINT "WidgetForms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PreChatForm" (
    "id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL,
    "required" BOOLEAN NOT NULL,
    "preChatGreeting" TEXT,
    "requireIdentity" BOOLEAN NOT NULL,
    "requirePhone" BOOLEAN NOT NULL,
    "requireQuestion" BOOLEAN NOT NULL,

    CONSTRAINT "PreChatForm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfflineChatForm" (
    "id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL,
    "offlineChatGreeting" TEXT,
    "requirePhone" BOOLEAN NOT NULL,

    CONSTRAINT "OfflineChatForm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostChatForm" (
    "id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL,
    "required" BOOLEAN NOT NULL,
    "postChatGreeting" TEXT,
    "requireRating" BOOLEAN NOT NULL,
    "requireFeedback" BOOLEAN NOT NULL,

    CONSTRAINT "PostChatForm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserInfoForm" (
    "id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL,
    "required" BOOLEAN NOT NULL,

    CONSTRAINT "UserInfoForm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserInfoFields" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "placeholder" TEXT,
    "required" BOOLEAN NOT NULL,
    "options" JSONB,
    "userInfoFormId" TEXT
);

-- CreateTable
CREATE TABLE "BadgeChatForm" (
    "id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL,

    CONSTRAINT "BadgeChatForm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WidgetSecurity" (
    "id" TEXT NOT NULL,
    "domainRestriction" BOOLEAN NOT NULL,
    "allowedDomains" TEXT[],
    "countryRestriction" BOOLEAN NOT NULL,
    "blockedCountries" TEXT[],

    CONSTRAINT "WidgetSecurity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserInfoFields_id_key" ON "UserInfoFields"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Widget_settingsId_key" ON "Widget"("settingsId");

-- CreateIndex
CREATE INDEX "Widget_id_idx" ON "Widget"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Widget_workspaceId_id_key" ON "Widget"("workspaceId", "id");

-- AddForeignKey
ALTER TABLE "Widget" ADD CONSTRAINT "Widget_settingsId_fkey" FOREIGN KEY ("settingsId") REFERENCES "WidgetSettings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WidgetSettings" ADD CONSTRAINT "WidgetSettings_appearanceId_fkey" FOREIGN KEY ("appearanceId") REFERENCES "WidgetAppearance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WidgetSettings" ADD CONSTRAINT "WidgetSettings_soundId_fkey" FOREIGN KEY ("soundId") REFERENCES "WidgetSound"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WidgetSettings" ADD CONSTRAINT "WidgetSettings_behaviorId_fkey" FOREIGN KEY ("behaviorId") REFERENCES "WidgetBehavior"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WidgetSettings" ADD CONSTRAINT "WidgetSettings_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "WidgetContent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WidgetSettings" ADD CONSTRAINT "WidgetSettings_formsId_fkey" FOREIGN KEY ("formsId") REFERENCES "WidgetForms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WidgetSettings" ADD CONSTRAINT "WidgetSettings_securityId_fkey" FOREIGN KEY ("securityId") REFERENCES "WidgetSecurity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WidgetAppearance" ADD CONSTRAINT "WidgetAppearance_widgetColorId_fkey" FOREIGN KEY ("widgetColorId") REFERENCES "WidgetColors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WidgetForms" ADD CONSTRAINT "WidgetForms_preChatFormId_fkey" FOREIGN KEY ("preChatFormId") REFERENCES "PreChatForm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WidgetForms" ADD CONSTRAINT "WidgetForms_offlineChatFormId_fkey" FOREIGN KEY ("offlineChatFormId") REFERENCES "OfflineChatForm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WidgetForms" ADD CONSTRAINT "WidgetForms_postChatFormId_fkey" FOREIGN KEY ("postChatFormId") REFERENCES "PostChatForm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WidgetForms" ADD CONSTRAINT "WidgetForms_userInfoFormId_fkey" FOREIGN KEY ("userInfoFormId") REFERENCES "UserInfoForm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WidgetForms" ADD CONSTRAINT "WidgetForms_badgeChatFormId_fkey" FOREIGN KEY ("badgeChatFormId") REFERENCES "BadgeChatForm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserInfoFields" ADD CONSTRAINT "UserInfoFields_userInfoFormId_fkey" FOREIGN KEY ("userInfoFormId") REFERENCES "UserInfoForm"("id") ON DELETE CASCADE ON UPDATE CASCADE;
