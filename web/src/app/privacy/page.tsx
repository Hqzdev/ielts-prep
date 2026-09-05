import { LegalPage } from "@/components/legal-page";

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy">
      <h2>Your account and learning data</h2>
      <p>
        Veylo stores your account profile, study preferences, test
        attempts, answers, feedback, personal vocabulary and conversation
        transcripts to provide your learning history.
      </p>
      <h2>Voice practice</h2>
      <p>
        Vey AI conversation audio is processed in memory for transcription and
        is not stored. Transcripts and Vey replies are saved in your account.
        Audio is sent to the configured AI provider to recognise speech.
      </p>
      <p>
        Speaking test recordings are stored for assessment and are scheduled for
        deletion after 30 days. Arcade microphone input is processed on your
        device and is not uploaded.
      </p>
      <h2>Account controls</h2>
      <p>
        You can edit your profile and permanently delete your account from
        Profile. Deletion removes your profile, history, personal vocabulary,
        conversations and stored recordings.
      </p>
      <h2>Browser storage</h2>
      <p>
        The app uses session cookies for sign-in and local storage for
        registration answers, interface preferences and practice recovery.
      </p>
    </LegalPage>
  );
}
