import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { config } from "./config";
import { AppError } from "@/domain/errors";

export async function sessionClient() {
  if (!config.databaseReady)
    throw new AppError(
      "SETUP_REQUIRED",
      "Application storage has not been configured yet",
      503,
    );
  const jar = await cookies();
  return createServerClient(config.supabaseUrl, config.supabasePublishableKey, {
    cookies: {
      getAll: () => jar.getAll(),
      setAll: (values) => {
        try {
          values.forEach(({ name, value, options }) =>
            jar.set(name, value, options),
          );
        } catch {
          return;
        }
      },
    },
  });
}

export function adminClient() {
  if (!config.databaseReady)
    throw new AppError(
      "SETUP_REQUIRED",
      "Application storage has not been configured yet",
      503,
    );
  return createClient(config.supabaseUrl, config.supabaseSecretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
