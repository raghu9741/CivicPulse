import test from "node:test";
import assert from "node:assert/strict";
import User from "../src/models/User.js";
import Complaint, { CATEGORIES, PRIORITIES, STATUSES } from "../src/models/Complaint.js";

test("new users default to Citizen and password hashes are excluded from queries", () => {
  const user = new User({ name: "Example Citizen", email: "citizen@example.com", passwordHash: "hashed-value" });
  assert.equal(user.role, "Citizen");
  assert.equal(User.schema.path("passwordHash").options.select, false);
});

test("complaints default to Submitted and Normal priority", () => {
  const complaint = new Complaint({
    title: "Streetlight not working",
    description: "The streetlight has not worked for several days.",
    category: "Electricity",
    location: "Main Street",
    citizenId: "507f1f77bcf86cd799439011"
  });
  assert.equal(complaint.status, "Submitted");
  assert.equal(complaint.priority, "Normal");
  assert.ok(complaint.validateSync() === undefined);
});

test("workflow values match the documented API constants", () => {
  assert.deepEqual(CATEGORIES, ["Water", "Electricity", "Roads", "Waste Management", "Sanitation", "Public Safety", "Other"]);
  assert.deepEqual(PRIORITIES, ["Normal", "High", "Critical"]);
  assert.deepEqual(STATUSES, ["Submitted", "Assigned", "In Progress", "Resolved", "Rejected"]);
});

test("complaint schema rejects values outside the workflow", () => {
  const complaint = new Complaint({
    title: "Broken public streetlight",
    description: "The streetlight has not worked for several days.",
    category: "Made up category",
    priority: "Urgent",
    status: "Automatically Classified",
    location: "Main Street",
    citizenId: "507f1f77bcf86cd799439011"
  });
  const error = complaint.validateSync();
  assert.ok(error);
  assert.ok(error.errors.category);
  assert.ok(error.errors.priority);
  assert.ok(error.errors.status);
});
