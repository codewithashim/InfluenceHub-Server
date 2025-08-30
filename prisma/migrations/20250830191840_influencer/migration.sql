-- CreateEnum
CREATE TYPE "public"."Platform" AS ENUM ('instagram', 'tiktok', 'youtube', 'x');

-- CreateTable
CREATE TABLE "public"."Influencer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "platform" "public"."Platform" NOT NULL,
    "username" TEXT NOT NULL,
    "followers" INTEGER NOT NULL DEFAULT 0,
    "engagementRate" DECIMAL(5,2) NOT NULL,
    "country" TEXT,
    "categories" TEXT[],
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Influencer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Influencer_followers_idx" ON "public"."Influencer"("followers");

-- CreateIndex
CREATE INDEX "Influencer_engagementRate_idx" ON "public"."Influencer"("engagementRate");

-- CreateIndex
CREATE INDEX "Influencer_platform_idx" ON "public"."Influencer"("platform");

-- CreateIndex
CREATE INDEX "Influencer_country_idx" ON "public"."Influencer"("country");

-- CreateIndex
CREATE UNIQUE INDEX "Influencer_platform_username_key" ON "public"."Influencer"("platform", "username");
