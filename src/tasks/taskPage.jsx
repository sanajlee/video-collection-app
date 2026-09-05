import { useState } from "react";

import { pilotTasks } from "../tasks/pilotTasks";
import RecordPage from "./RecordPage";

function TaskPage({ participantId, onComplete }) {
  const [taskIndex, setTaskIndex] = useState(0);
  const [itemIndex, setItemIndex] = useState(0);

  const task = pilotTasks[taskIndex];
  const item = task.items[itemIndex];

  function handleItemComplete() {
    const isLastItem =
      itemIndex === task.items.length - 1;

    const isLastTask =
      taskIndex === pilotTasks.length - 1;

    if (!isLastItem) {
      setItemIndex((prev) => prev + 1);
      return;
    }

    if (!isLastTask) {
      setTaskIndex((prev) => prev + 1);
      setItemIndex(0);
      return;
    }

    onComplete();
  }

  return (
    <RecordPage
      participantId={participantId}
      task={task}
      item={item}
      taskIndex={taskIndex}
      itemIndex={itemIndex}
      totalTasks={pilotTasks.length}
      onComplete={handleItemComplete}
      onBack={() => {
        // 필요하면 뒤로가기 로직
      }}
    />
  );
}

export default TaskPage;