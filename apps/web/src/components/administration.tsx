"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AdministrationService } from "@veylo/backend/application/services/administration";
import { api, apiData } from "@/client/api";
import { errorMessage } from "@veylo/backend/domain/errors";
import { Button, ErrorNotice } from "./ui";
export function Administration({
  data,
}: {
  data: Awaited<ReturnType<AdministrationService["overview"]>>;
}) {
  const [email, setEmail] = useState("");
  const [link, setLink] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState("");
  const router = useRouter();
  async function invite(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = await apiData(
        api.POST("/admin/invitations", { body: { email } }),
      );
      setLink(result.url);
      router.refresh();
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  async function publish(id: string, published: boolean) {
    try {
      await apiData(api.POST("/admin/publish", { body: { id, published } }));
      router.refresh();
    } catch (error) {
      setError(errorMessage(error));
    }
  }
  async function upload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      if (file.size > 3000000)
        throw new Error("The file must be smaller than 3 MB");
      const entries = JSON.parse(await file.text());
      const result = await apiData(
        api.POST("/admin/import", {
          body: {
            entries: Array.isArray(entries) ? entries : entries.entries,
          },
        }),
      );
      setReport(
        `Created: ${result.created}, updated: ${result.updated}, unchanged: ${result.unchanged}`,
      );
      router.refresh();
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="page admin-page">
      <div className="breadcrumb">Beta management</div>
      <div className="page-title">
        <h1>Administrator</h1>
        <span>{data.userCount} members</span>
      </div>
      <ErrorNotice message={error} />
      <div className="grid-two">
        <section className="panel">
          <h2>Invite a member</h2>
          <p className="small muted">
            The link is tied to an email address, expires in 7 days and can be
            used once.
          </p>
          <form className="row" onSubmit={invite}>
            <input
              aria-label="Member email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="student@example.com"
              style={{ flex: 1 }}
            />
            <Button type="submit" busy={busy}>
              Create link
            </Button>
          </form>
          {link && (
            <label className="field" style={{ marginTop: 20 }}>
              Personal invitation link
              <input
                readOnly
                value={link}
                onFocus={(event) => event.target.select()}
              />
            </label>
          )}
        </section>
        <section className="panel">
          <h2>Import tasks</h2>
          <p className="small muted">
            Upload JSON in ContentEntry[] format. Answer keys and evidence are
            validated before publication. Changes create a new version.
          </p>
          <input
            type="file"
            accept="application/json,.json"
            onChange={upload}
            disabled={busy}
            aria-label="Import JSON"
          />
          {report && (
            <p className="small link" style={{ marginTop: 12 }}>
              {report}
            </p>
          )}
        </section>
      </div>
      <section className="section">
        <h2>Invitations</h2>
        <div
          className="table-scroll"
          tabIndex={0}
          role="region"
          aria-label="Management data"
        >
          <table className="subtle-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Expires</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.invitations.map((invite) => (
                <tr key={invite.id}>
                  <td>{invite.email}</td>
                  <td>
                    {new Date(invite.expires_at).toLocaleDateString("en-GB")}
                  </td>
                  <td>
                    {invite.accepted_at ? "Accepted" : "Awaiting sign-in"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="section">
        <h2>Assessments</h2>
        <p className="small muted">
          Processing status only. Answer content is not shown.
        </p>
        {!data.jobs.length ? (
          <p className="small muted">No assessments yet.</p>
        ) : (
          <div
            className="table-scroll"
            tabIndex={0}
            role="region"
            aria-label="Management data"
          >
            <table className="subtle-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>State</th>
                  <th>Processing attempts</th>
                </tr>
              </thead>
              <tbody>
                {data.jobs.map((job) => (
                  <tr key={job.id}>
                    <td>{job.id.slice(0, 8)}</td>
                    <td>{job.state}</td>
                    <td>{job.tries}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <details className="section">
        <summary>Published content · {data.tasks.length} tasks</summary>
        <div
          className="table-scroll"
          tabIndex={0}
          role="region"
          aria-label="Management data"
        >
          <table className="subtle-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Skill</th>
                <th>Version</th>
                <th>Access</th>
              </tr>
            </thead>
            <tbody>
              {data.tasks.map((task) => (
                <tr key={task.id}>
                  <td>{task.id}</td>
                  <td>{task.skill}</td>
                  <td>{task.current_version}</td>
                  <td>
                    <Button
                      variant="secondary"
                      className="compact"
                      onClick={() => publish(task.id, !task.published)}
                    >
                      {task.published ? "Hide" : "Publish"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
