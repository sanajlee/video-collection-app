import { useMemo, useState } from "react";

import HomePage from "./pages/HomePage";
import TaskPage from "./pages/TaskPage";
import CompletePage from "./pages/CompletePage";

function App() {
  const participantId = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("participant");
  }, []);

  const [screen, setScreen] = useState("home");

  // participant parameter가 없으면 실험을 시작하지 않게 함
  if (!participantId) {
    return (
      <main style={{ padding: "2rem" }}>
        <h1>잘못된 접근입니다.</h1>
        <p>참가자 코드가 포함된 실험 링크로 접속해주세요.</p>
      </main>
    );
  }

  if (screen === "home") {
    return (
      <HomePage
        participantId={participantId}
        onStart={() => setScreen("task")}
      />
    );
  }

  if (screen === "task") {
    return (
      <TaskPage
        participantId={participantId}
        onComplete={() => setScreen("complete")}
      />
    );
  }

  if (screen === "complete") {
    return (
      <CompletePage participantId={participantId} />
    );
  }

  return null;
}

export default App;