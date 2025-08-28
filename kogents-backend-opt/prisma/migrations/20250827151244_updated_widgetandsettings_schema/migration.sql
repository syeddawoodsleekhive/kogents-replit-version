-- AlterTable
ALTER TABLE "WidgetSecurity" ALTER COLUMN "allowedDomains" SET DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "blockedCountries" SET DEFAULT ARRAY[]::TEXT[];
