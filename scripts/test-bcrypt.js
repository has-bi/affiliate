// scripts/test-bcrypt.js
const bcrypt = require("bcryptjs");

// The password
const password = "***REMOVED***";

// The hash you generated
const hash = "$2b$10$RerEOYjwPAaZsc8gu7iAU.tZBax0P0aMgm6wLJs.bCaSdY86i.4xe";

// Test the comparison
bcrypt.compare(password, hash, (err, result) => {
  if (err) {
    console.error("Error comparing:", err);
  } else {
    console.log("Comparison result:", result);
  }
});

// Also generate a fresh hash to test
const newHash = bcrypt.hashSync(password, 10);
console.log("Fresh hash:", newHash);

// Test the fresh hash too
bcrypt.compare(password, newHash, (err, result) => {
  if (err) {
    console.error("Error comparing with fresh hash:", err);
  } else {
    console.log("Fresh hash comparison result:", result);
  }
});
