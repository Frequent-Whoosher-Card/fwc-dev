/**
 * Seed menu "Metode Pembayaran" dan permission payment_method.view / payment_method.manage,
 * lalu assign ke role SUPERADMIN.
 * Jalankan dari folder backend: bun run scripts/seed-payment-method-menu.ts
 */
import { config } from "dotenv";
config();

import db from "../src/config/db";

const MENU_LABEL = "Metode Pembayaran";
const MENU_ROUTE = "/dashboard/superadmin/payment-methods";
const MENU_ICON = "wallet";
const ORDERING = 90;

async function main() {
  // 1. Buat atau ambil menu access
  let menu = await db.menuAccess.findFirst({
    where: { route: MENU_ROUTE },
  });

  if (!menu) {
    menu = await db.menuAccess.create({
      data: {
        label: MENU_LABEL,
        route: MENU_ROUTE,
        icon: MENU_ICON,
        ordering: ORDERING,
      },
    });
    console.log("Menu 'Metode Pembayaran' dibuat.");
  } else {
    console.log("Menu 'Metode Pembayaran' sudah ada.");
  }

  // 2. Buat atau ambil permission payment_method.view & payment_method.manage
  const viewPerm = await db.permission.upsert({
    where: { actionCode: "payment_method.view" },
    create: {
      menuAccessId: menu.id,
      actionCode: "payment_method.view",
      actionName: "View Metode Pembayaran",
    },
    update: { menuAccessId: menu.id },
  });

  const managePerm = await db.permission.upsert({
    where: { actionCode: "payment_method.manage" },
    create: {
      menuAccessId: menu.id,
      actionCode: "payment_method.manage",
      actionName: "Manage Metode Pembayaran",
    },
    update: { menuAccessId: menu.id },
  });

  console.log("Permission payment_method.view dan payment_method.manage siap.");

  // 3. Assign ke role SUPERADMIN
  const superadmin = await db.role.findFirst({
    where: { roleCode: "SUPERADMIN" },
  });

  if (!superadmin) {
    console.warn("Role SUPERADMIN tidak ditemukan. Skip assign permission.");
    return;
  }

  await db.rolePermission.upsert({
    where: {
      roleId_permissionId: {
        roleId: superadmin.id,
        permissionId: viewPerm.id,
      },
    },
    create: { roleId: superadmin.id, permissionId: viewPerm.id },
    update: {},
  });

  await db.rolePermission.upsert({
    where: {
      roleId_permissionId: {
        roleId: superadmin.id,
        permissionId: managePerm.id,
      },
    },
    create: { roleId: superadmin.id, permissionId: managePerm.id },
    update: {},
  });

  console.log("Permission sudah di-assign ke role SUPERADMIN.");
  console.log("Selesai. Login ulang atau refresh agar menu 'Metode Pembayaran' muncul di sidebar.");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
