// scripts/hashPassword.js

const bcrypt = require("bcryptjs");

// Get password from command line argument
const password = process.argv[2];

if (!password) {
  console.error("Please provide a password as an argument");
  process.exit(1);
}

// Hash the password
const hashedPassword = bcrypt.hashSync(password, 10);

console.log("Your hashed password:");
console.log(hashedPassword);
console.log("\nAdd this to your .env.local file as:");
console.log(`ADMIN_PASSWORD_HASH=${hashedPassword}`);
