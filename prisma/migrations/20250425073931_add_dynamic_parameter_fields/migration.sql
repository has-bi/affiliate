-- AlterTable
ALTER TABLE "template_parameters" ADD COLUMN     "isDynamic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "source" TEXT;
