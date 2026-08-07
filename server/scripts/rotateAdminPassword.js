import "../src/config/env.js";
import { connectDatabase } from "../src/config/db.js";
import { Admin } from "../src/models/admin.model.js";
import { env } from "../src/config/env.js";

const newPassword = process.env.ADMIN_NEW_PASSWORD;

if (!env.ADMIN_EMAIL || !newPassword) {
  console.error("ADMIN_EMAIL and ADMIN_NEW_PASSWORD are required to rotate the admin password.");
  process.exit(1);
}

if (newPassword.length < 12) {
  console.error("ADMIN_NEW_PASSWORD must be at least 12 characters.");
  process.exit(1);
}

await connectDatabase();

const admin = await Admin.findOne({
  email: env.ADMIN_EMAIL.toLowerCase(),
  role: "admin",
  isActive: true
}).select("+passwordHash +tokenVersion +passwordChangedAt");

if (!admin) {
  console.error("Active admin account was not found.");
  process.exit(1);
}

admin.passwordHash = await Admin.hashPassword(newPassword);
admin.tokenVersion += 1;
admin.passwordChangedAt = new Date();
await admin.save();

console.info("Admin password rotated successfully. Existing admin sessions were invalidated.");
process.exit(0);
