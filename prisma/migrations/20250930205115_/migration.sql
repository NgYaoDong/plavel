/*
  Warnings:

  - Made the column `description` on table `Trip` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."Trip" ALTER COLUMN "description" SET NOT NULL;
