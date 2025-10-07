-- AlterTable
ALTER TABLE "public"."Location" ADD COLUMN     "category" TEXT,
ADD COLUMN     "cost" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "public"."Trip" ADD COLUMN     "budget" DOUBLE PRECISION;
