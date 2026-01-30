-- CreateTable: menu_access
CREATE TABLE IF NOT EXISTS "menu_access" (
    "menu_access_id" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "route" TEXT,
    "icon" TEXT,
    "ordering" INTEGER NOT NULL DEFAULT 0,
    "parent_id" UUID,
    "description" TEXT,

    CONSTRAINT "menu_access_pkey" PRIMARY KEY ("menu_access_id")
);

-- CreateTable: permissions
CREATE TABLE IF NOT EXISTS "permissions" (
    "permission_id" UUID NOT NULL,
    "menu_access_id" UUID,
    "action_code" TEXT NOT NULL,
    "action_name" TEXT NOT NULL,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("permission_id")
);

-- CreateTable: role_permissions
CREATE TABLE IF NOT EXISTS "role_permissions" (
    "role_permission_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_permission_id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "permissions_action_code_key" ON "permissions"("action_code");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "role_permissions_role_id_permission_id_key" ON "role_permissions"("role_id", "permission_id");

-- AddForeignKey
ALTER TABLE "menu_access" ADD CONSTRAINT "menu_access_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "menu_access"("menu_access_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_menu_access_id_fkey" FOREIGN KEY ("menu_access_id") REFERENCES "menu_access"("menu_access_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("role_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("permission_id") ON DELETE CASCADE ON UPDATE CASCADE;
