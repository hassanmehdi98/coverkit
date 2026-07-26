/**
 * Phase 0 acceptance: put/get/delete an object via lib/storage against MinIO.
 *
 * Usage: npx tsx --env-file=.env scripts/test-storage.ts
 */
import {
  deleteObject,
  getObjectBuffer,
  getPublicUrl,
  putObject,
} from "../src/lib/storage";

async function main() {
  const key = `phase0-test/${Date.now()}.txt`;
  const body = `coverkit-storage-ok-${Date.now()}`;

  console.log("Putting object:", key);
  const publicUrl = await putObject({
    key,
    body,
    contentType: "text/plain",
  });
  console.log("Public URL:", publicUrl);

  const expectedUrl = getPublicUrl(key);
  if (publicUrl !== expectedUrl) {
    throw new Error(`URL mismatch: got ${publicUrl}, expected ${expectedUrl}`);
  }

  console.log("Getting object via S3 SDK...");
  const fetched = await getObjectBuffer(key);
  const text = fetched.toString("utf8");
  if (text !== body) {
    throw new Error(`Body mismatch: got "${text}", expected "${body}"`);
  }
  console.log("Body OK:", text);

  console.log("Fetching via public URL...");
  const response = await fetch(publicUrl);
  if (!response.ok) {
    throw new Error(`Public GET failed: ${response.status} ${response.statusText}`);
  }
  const publicBody = await response.text();
  if (publicBody !== body) {
    throw new Error(
      `Public body mismatch: got "${publicBody}", expected "${body}"`,
    );
  }
  console.log("Public GET OK");

  console.log("Deleting object...");
  await deleteObject(key);
  console.log("Deleted.");

  console.log("\nStorage acceptance test passed.");
}

main().catch((err) => {
  console.error("\nStorage acceptance test FAILED:");
  console.error(err);
  process.exit(1);
});
