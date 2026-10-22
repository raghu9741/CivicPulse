import mongoose from "mongoose";

export function validateMongoUri(uri) {
  if (typeof uri !== "string" || !uri.trim()) {
    throw new Error("MONGODB_URI is missing. Set it in backend/.env.");
  }

  const value = uri.trim();
  if (/placeholder|your[-_ ]|<[^>]+>/i.test(value)) {
    throw new Error("MONGODB_URI still contains example placeholder text. Replace it with your Atlas or local MongoDB URI.");
  }
  if (/\s/.test(value)) {
    throw new Error("MONGODB_URI contains whitespace. Remove it and check the connection string.");
  }
  if (!/^mongodb(?:\+srv)?:\/\//.test(value)) {
    throw new Error("MONGODB_URI must start with mongodb:// or mongodb+srv://.");
  }

  const authority = value.replace(/^mongodb(?:\+srv)?:\/\//, "").split(/[/?#]/, 1)[0];
  if (!authority || authority.startsWith("@") || authority.endsWith("@")) {
    throw new Error("MONGODB_URI is missing a valid MongoDB host.");
  }

  const atIndex = authority.lastIndexOf("@");
  if (atIndex !== -1) {
    const credentials = authority.slice(0, atIndex);
    const separator = credentials.indexOf(":");
    if (separator < 1 || separator === credentials.length - 1) {
      throw new Error("MONGODB_URI credentials are incomplete. Check the database username and password.");
    }
    const username = credentials.slice(0, separator);
    const password = credentials.slice(separator + 1);
    if (/[/:?#\[\]@]/.test(username) || /[/:?#\[\]@]/.test(password)) {
      throw new Error("MONGODB_URI username or password contains a reserved character. URL-encode the credentials.");
    }
    try {
      decodeURIComponent(username);
      decodeURIComponent(password);
    } catch {
      throw new Error("MONGODB_URI credentials contain invalid percent-encoding.");
    }
  }

  const host = authority.slice(atIndex + 1);
  if (!host || host.includes("@")) {
    throw new Error("MONGODB_URI contains an invalid MongoDB host.");
  }
  if (value.startsWith("mongodb+srv://") && host.includes(":")) {
    throw new Error("Atlas SRV URIs must not include a port number.");
  }

  return value;
}

export function describeMongoFailure(error) {
  if (error.message?.startsWith("MONGODB_URI")) return error.message;

  const errorCode = error.code ?? error.cause?.code;
  const errorName = error.name ?? "";
  if (errorCode === 18 || errorName === "AuthenticationError" || /authentication failed/i.test(error.message ?? "")) {
    return "MongoDB authentication failed. Check the Atlas Database Access username, password, and database-user permissions.";
  }
  if (["ENOTFOUND", "EAI_AGAIN", "ECONNREFUSED", "ETIMEDOUT"].includes(errorCode) ||
      /querySrv|server selection timed out|could not connect to any servers/i.test(error.message ?? "")) {
    return "MongoDB host could not be reached. Check the Atlas cluster state, Network Access IP allowlist, DNS, and outbound network access.";
  }
  if (/tls|certificate|ssl/i.test(errorName) || /tls|certificate|ssl/i.test(error.message ?? "")) {
    return "MongoDB TLS negotiation failed. Check system time, TLS inspection software, and the connection string.";
  }
  return "MongoDB connection failed. Check the connection string, cluster availability, Atlas Network Access, and database-user credentials.";
}

export async function connectDatabase() {
  const uri = validateMongoUri(process.env.MONGODB_URI);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  console.log("Connected to MongoDB");
}
