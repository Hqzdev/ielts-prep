import { ProductBrand } from "@/components/product-brand";
export default function SetupPage() {
  return (
    <main className="auth-page">
      <ProductBrand className="brand" />
      <h1>Your workspace is being prepared</h1>
      <p className="muted">
        The database and authentication need to be connected before you can sign
        in.
      </p>
      <div className="notice">
        Administrator: configure Supabase in <code>apps/web/.env.local</code>,
        apply the migrations and import the task bank. See the web
        application&apos;s README for detailed commands.
      </div>
    </main>
  );
}
