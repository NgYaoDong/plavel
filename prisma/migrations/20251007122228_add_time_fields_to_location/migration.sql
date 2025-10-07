-- AlterTable
ALTER TABLE "public"."Location" ADD COLUMN     "duration" INTEGER,
ADD COLUMN     "endTime" TIMESTAMP(3),
ADD COLUMN     "startTime" TIMESTAMP(3);
