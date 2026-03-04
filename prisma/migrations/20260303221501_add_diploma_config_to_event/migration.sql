-- AlterTable
ALTER TABLE "events" ADD COLUMN     "diplomaLocation" TEXT DEFAULT 'Darmstadt',
ADD COLUMN     "diplomaSigner1Name" TEXT,
ADD COLUMN     "diplomaSigner1Role" TEXT,
ADD COLUMN     "diplomaSigner1SignatureUrl" TEXT,
ADD COLUMN     "diplomaSigner2Name" TEXT,
ADD COLUMN     "diplomaSigner2Role" TEXT,
ADD COLUMN     "diplomaSigner2SignatureUrl" TEXT;
