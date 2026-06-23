import "../src/config/env.js";
import { connectDatabase } from "../src/config/db.js";
import { env } from "../src/config/env.js";
import { Admin } from "../src/models/admin.model.js";

if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) {
  console.error("ADMIN_EMAIL and ADMIN_PASSWORD are required to create an admin user.");
  process.exit(1);
}

await connectDatabase();

const email = env.ADMIN_EMAIL.toLowerCase();
const existingAdmin = await Admin.findOne({ email }).select("+passwordHash");
const passwordHash = await Admin.hashPassword(env.ADMIN_PASSWORD);

if (existingAdmin) {
  existingAdmin.name = env.ADMIN_NAME || existingAdmin.name;
  existingAdmin.passwordHash = passwordHash;
  existingAdmin.role = "admin";
  existingAdmin.isActive = true;
  await existingAdmin.save();
  console.info("Updated admin user.");
} else {
  await Admin.create({
    name: env.ADMIN_NAME || "Dictionary Admin",
    email,
    passwordHash,
    role: "admin",
    isActive: true
  });
  console.info("Created admin user.");
}

process.exit(0);

