-- CreateTable
CREATE TABLE "MessageDm" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "message" TEXT NOT NULL,

    CONSTRAINT "MessageDm_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "MessageDm" ADD CONSTRAINT "MessageDm_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageDm" ADD CONSTRAINT "MessageDm_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
