import { Suspense } from "react";
import { EnrollmentQuiz } from "@/components/enrollment-quiz";

export default function QuizPage() {
  return (
    <Suspense>
      <EnrollmentQuiz />
    </Suspense>
  );
}
