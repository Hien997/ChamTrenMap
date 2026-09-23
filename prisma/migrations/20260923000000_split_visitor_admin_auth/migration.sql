-- ADR-0001: split visitor identity from admin auth.
-- 1) Visitor identity: sessionToken (shared cookie) becomes the optional visitor key.
ALTER TABLE "User" RENAME COLUMN "sessionToken" TO "visitorKey";
ALTER TABLE "User" ALTER COLUMN "visitorKey" DROP NOT NULL;
ALTER INDEX "User_sessionToken_key" RENAME TO "User_visitorKey_key";

-- 2) Admin session: rotating token stored SHA-256-hashed with an absolute expiry.
ALTER TABLE "User" ADD COLUMN "adminSessionTokenHash" TEXT;
ALTER TABLE "User" ADD COLUMN "adminSessionExpiresAt" TIMESTAMP(3);
CREATE UNIQUE INDEX "User_adminSessionTokenHash_key" ON "User"("adminSessionTokenHash");
