import { CatalogBackLink } from "@/components/catalog-back-link";
import { notFound } from "next/navigation";
import { CatalogRepository } from "@/server/repositories/catalog";
import { StartTask } from "@/components/start-task";
import { formatLabels, taskPartLabel, topicLabels } from "@/domain/task";
import { pageProfile } from "@/server/identity";
export default async function TaskPage({
  params,
}: {
  params: Promise<{ skill: string; id: string }>;
}) {
  await pageProfile();
  const { skill, id } = await params;
  const task = await new CatalogRepository().task(id);
  if (task.skill !== skill) notFound();
  return (
    <div className="page">
      <div className="breadcrumb">
        <CatalogBackLink skill={task.skill}>Tests / {skill}</CatalogBackLink>
        <span>/</span>
        <span>{taskPartLabel(task)}</span>
      </div>
      <div className="page-title">
        <h1>{task.title}</h1>
      </div>
      <div className="row">
        <span className="tag blue">{formatLabels[task.format]}</span>
        <span className="tag">{topicLabels[task.topic] ?? task.topic}</span>
        <span className="tag">{Math.ceil(task.durationSeconds / 60)} min</span>
      </div>
      <div className="panel section" style={{ maxWidth: 850 }}>
        <p className="task-prompt">{task.prompt}</p>
        <p className="instructions">{task.instructions}</p>
        {task.cuePoints.length > 0 && (
          <ul>
            {task.cuePoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        )}
        <hr className="rule" />
        <div className="spread">
          <p className="small muted" style={{ margin: 0 }}>
            {task.skill === "reading"
              ? `${task.readingQuestions.length} questions · checked against the answer key`
              : task.skill === "writing"
                ? `At least ${task.minimumWords} words · feedback after submission`
                : "Spoken answers · have your microphone ready"}
          </p>
          <StartTask task={task} />
        </div>
      </div>
    </div>
  );
}
