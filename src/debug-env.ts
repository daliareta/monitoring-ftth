import "dotenv/config";
console.log("DATABASE_URL:", process.env.DATABASE_URL ? "Defined" : "Not Defined");
console.log("CWD:", process.cwd());
