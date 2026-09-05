export function notifyLearningActivity() {
  if (typeof window !== "undefined")
    window.dispatchEvent(new Event("veylo:learning-activity"));
}
