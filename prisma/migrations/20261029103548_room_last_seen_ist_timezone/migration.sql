-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_RoomMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "presence" TEXT NOT NULL DEFAULT 'active',
    "lastSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RoomMember_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RoomMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_RoomMember" ("id", "joinedAt", "presence", "role", "roomId", "userId") SELECT "id", "joinedAt", "presence", "role", "roomId", "userId" FROM "RoomMember";
DROP TABLE "RoomMember";
ALTER TABLE "new_RoomMember" RENAME TO "RoomMember";
CREATE UNIQUE INDEX "RoomMember_roomId_userId_key" ON "RoomMember"("roomId", "userId");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "username" TEXT,
    "avatarUrl" TEXT,
    "dailyGoalMin" INTEGER NOT NULL DEFAULT 120,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    "role" TEXT NOT NULL DEFAULT 'student',
    "plan" TEXT NOT NULL DEFAULT 'free',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_User" ("avatarUrl", "createdAt", "dailyGoalMin", "displayName", "email", "id", "plan", "role", "timezone", "username") SELECT "avatarUrl", "createdAt", "dailyGoalMin", "displayName", "email", "id", "plan", "role", "timezone", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
-- Timezone was never user-editable, so every 'UTC' is the old default, not a
-- choice. The audience is Indian; move them to IST.
UPDATE "User" SET "timezone" = 'Asia/Kolkata' WHERE "timezone" = 'UTC';
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
