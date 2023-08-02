-- CreateTable
CREATE TABLE "Preferences" (
    "id" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isTwoFactorAuthenticationEnabled" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SensitiveData" (
    "id" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "twoFactorAuthenticationSecret" TEXT,
    "iv" TEXT,

    CONSTRAINT "SensitiveData_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Preferences" ADD CONSTRAINT "Preferences_id_fkey" FOREIGN KEY ("id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SensitiveData" ADD CONSTRAINT "SensitiveData_id_fkey" FOREIGN KEY ("id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
