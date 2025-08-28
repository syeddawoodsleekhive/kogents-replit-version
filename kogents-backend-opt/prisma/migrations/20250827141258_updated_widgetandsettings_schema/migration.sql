/*
  Warnings:

  - Made the column `offlineChatGreeting` on table `OfflineChatForm` required. This step will fail if there are existing NULL values in that column.
  - Made the column `postChatGreeting` on table `PostChatForm` required. This step will fail if there are existing NULL values in that column.
  - Made the column `preChatGreeting` on table `PreChatForm` required. This step will fail if there are existing NULL values in that column.
  - Made the column `placeholder` on table `UserInfoFields` required. This step will fail if there are existing NULL values in that column.
  - Made the column `autoOpenDelay` on table `WidgetBehavior` required. This step will fail if there are existing NULL values in that column.
  - Made the column `welcomeMessage` on table `WidgetContent` required. This step will fail if there are existing NULL values in that column.
  - Made the column `inputPlaceholder` on table `WidgetContent` required. This step will fail if there are existing NULL values in that column.
  - Made the column `thankyouMessage` on table `WidgetContent` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "BadgeChatForm" ALTER COLUMN "enabled" SET DEFAULT true;

-- AlterTable
ALTER TABLE "OfflineChatForm" ALTER COLUMN "enabled" SET DEFAULT true,
ALTER COLUMN "offlineChatGreeting" SET NOT NULL,
ALTER COLUMN "offlineChatGreeting" SET DEFAULT 'Sorry we aren''t online at the moment. Leave a message and we will get back to you',
ALTER COLUMN "requirePhone" SET DEFAULT true;

-- AlterTable
ALTER TABLE "PostChatForm" ALTER COLUMN "enabled" SET DEFAULT true,
ALTER COLUMN "required" SET DEFAULT false,
ALTER COLUMN "postChatGreeting" SET NOT NULL,
ALTER COLUMN "postChatGreeting" SET DEFAULT 'Thank you for your feedback!',
ALTER COLUMN "requireRating" SET DEFAULT false,
ALTER COLUMN "requireFeedback" SET DEFAULT false;

-- AlterTable
ALTER TABLE "PreChatForm" ALTER COLUMN "enabled" SET DEFAULT true,
ALTER COLUMN "required" SET DEFAULT false,
ALTER COLUMN "preChatGreeting" SET NOT NULL,
ALTER COLUMN "preChatGreeting" SET DEFAULT 'Welcome! How can we help you?',
ALTER COLUMN "requireIdentity" SET DEFAULT true,
ALTER COLUMN "requirePhone" SET DEFAULT false,
ALTER COLUMN "requireQuestion" SET DEFAULT false;

-- AlterTable
ALTER TABLE "UserInfoFields" ALTER COLUMN "placeholder" SET NOT NULL;

-- AlterTable
ALTER TABLE "UserInfoForm" ALTER COLUMN "enabled" SET DEFAULT true,
ALTER COLUMN "required" SET DEFAULT false;

-- AlterTable
ALTER TABLE "WidgetAppearance" ALTER COLUMN "fontSize" SET DEFAULT 14,
ALTER COLUMN "fontFamily" SET DEFAULT 'Inter',
ALTER COLUMN "position" SET DEFAULT 'BOTTOM_RIGHT',
ALTER COLUMN "borderRadius" SET DEFAULT 12,
ALTER COLUMN "size" SET DEFAULT 'MEDIUM',
ALTER COLUMN "showAvatar" SET DEFAULT true,
ALTER COLUMN "showCompanyLogo" SET DEFAULT true;

-- AlterTable
ALTER TABLE "WidgetBehavior" ALTER COLUMN "autoOpen" SET DEFAULT true,
ALTER COLUMN "autoOpenDelay" SET NOT NULL,
ALTER COLUMN "autoOpenDelay" SET DEFAULT 3,
ALTER COLUMN "offlineMode" SET DEFAULT false,
ALTER COLUMN "reduceAnimations" SET DEFAULT false,
ALTER COLUMN "autoClose" SET DEFAULT false;

-- AlterTable
ALTER TABLE "WidgetColors" ALTER COLUMN "primary" SET DEFAULT '#3b82f6',
ALTER COLUMN "secondary" SET DEFAULT '#f3f4f6',
ALTER COLUMN "background" SET DEFAULT '#f9fafb',
ALTER COLUMN "text" SET DEFAULT '#1f2937';

-- AlterTable
ALTER TABLE "WidgetContent" ALTER COLUMN "welcomeMessage" SET NOT NULL,
ALTER COLUMN "welcomeMessage" SET DEFAULT 'Welcome! How can we help you?',
ALTER COLUMN "inputPlaceholder" SET NOT NULL,
ALTER COLUMN "inputPlaceholder" SET DEFAULT 'Type your message...',
ALTER COLUMN "thankyouMessage" SET NOT NULL,
ALTER COLUMN "thankyouMessage" SET DEFAULT 'Thank you for contacting us!';

-- AlterTable
ALTER TABLE "WidgetSecurity" ALTER COLUMN "domainRestriction" SET DEFAULT false,
ALTER COLUMN "countryRestriction" SET DEFAULT false;

-- AlterTable
ALTER TABLE "WidgetSound" ALTER COLUMN "enabled" SET DEFAULT true,
ALTER COLUMN "volume" SET DEFAULT 50,
ALTER COLUMN "type" SET DEFAULT 'MESSAGE',
ALTER COLUMN "hapticFeedback" SET DEFAULT true;
