/**
 * Test mode (SANDBOX_MODE=true in Netlify): emails go to Admin → Test Outbox
 * instead of being sent, a banner marks the site as testing, and the admin can
 * load sample data and delete everything when testing is done.
 */
export function isSandbox() {
  return process.env.SANDBOX_MODE === "true";
}
