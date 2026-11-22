-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'ORGANIZER', 'CUSTOMER');

-- CreateTable
CREATE TABLE "events" (
    "id" SERIAL NOT NULL,
    "event_name" VARCHAR(100) NOT NULL,
    "event_date" TIMESTAMP(6),

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "userName" TEXT,
    "email" TEXT NOT NULL,
    "phoneNumber" BIGINT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role"[] DEFAULT ARRAY['CUSTOMER']::"Role"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
