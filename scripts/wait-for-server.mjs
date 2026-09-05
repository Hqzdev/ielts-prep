const url = new URL(
  "/login",
  process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000",
);
const deadline = Date.now() + 60000;
while (Date.now() < deadline) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(2000),
  }).catch(() => null);
  if (response?.ok) process.exit(0);
  await new Promise((resolve) => setTimeout(resolve, 500));
}
throw new Error("The local application did not become ready within 60 seconds");
