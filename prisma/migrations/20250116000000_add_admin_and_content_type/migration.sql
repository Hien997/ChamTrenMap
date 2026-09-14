-- Add Role enum
CREATE TYPE "Role" AS ENUM ('ANONYMOUS', 'ADMIN');

-- Add ContentType enum
CREATE TYPE "ContentType" AS ENUM ('TEXT', 'HTML');

-- Add User columns
ALTER TABLE "User" ADD COLUMN "role" "Role" NOT NULL DEFAULT 'ANONYMOUS';
ALTER TABLE "User" ADD COLUMN "email" TEXT;
ALTER TABLE "User" ADD COLUMN "passwordHash" TEXT;

-- Add unique constraint on User.email
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- Add GuideSection.contentType
ALTER TABLE "GuideSection" ADD COLUMN "contentType" "ContentType" NOT NULL DEFAULT 'TEXT';
