/*
  Warnings:

  - You are about to drop the `Trip` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Trip" DROP CONSTRAINT "Trip_userId_fkey";

-- DropTable
DROP TABLE "public"."Trip";
