-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "intra42Id" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_intra42Id_key" ON "User"("intra42Id");
