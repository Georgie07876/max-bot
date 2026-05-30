/*
  Warnings:

  - You are about to drop the `MenuItem` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "MenuItem";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "MenuPage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "text" TEXT NOT NULL,
    "parent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "MenuButton" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "menuId" TEXT NOT NULL,
    CONSTRAINT "MenuButton_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "MenuPage" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
