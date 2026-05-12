-- CreateTable
CREATE TABLE "profiles" (
    "id" TEXT NOT NULL,
    "clerk_user_id" TEXT NOT NULL,
    "kingshot_player_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "character_sheet" JSONB NOT NULL,
    "cycle_anchor" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "profiles_kingshot_player_id_key" ON "profiles"("kingshot_player_id");

-- CreateIndex
CREATE INDEX "profiles_clerk_user_id_idx" ON "profiles"("clerk_user_id");
