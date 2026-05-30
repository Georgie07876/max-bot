-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ContentBlock" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "text" TEXT NOT NULL,
    "description" TEXT,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "MenuItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "parentId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MenuItem_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "MenuItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Admin_username_key" ON "Admin"("username");
