import "dotenv/config";
import app from "./app.js";
import { connectDatabase, describeMongoFailure } from "./config/db.js";

const port = Number(process.env.PORT) || 5000;
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET must be configured with at least 32 characters");
}

app.listen(port, () => console.log(`CivicPulse API listening on port ${port}`));

async function connectWithRetry() {
  let retryDelay = 5000;
  while (true) {
    try {
      await connectDatabase();
      return;
    } catch (error) {
      console.error(describeMongoFailure(error));
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
      retryDelay = Math.min(retryDelay * 2, 30000);
    }
  }
}

connectWithRetry();
