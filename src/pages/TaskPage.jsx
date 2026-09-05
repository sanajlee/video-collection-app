import { useState } from "react";
import { pilotTasks } from "../tasks/pilotTasks";
import RecordPage from "./RecordPage";

export default function TaskPage({
  participantId,
  onComplete,
  onBack,
}) {
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

    onComplete?.();
  }

  return (
    <RecordPage
      key={item.id}
      participantId={participantId}
      task={task}
      item={item}
      taskIndex={taskIndex}
      itemIndex={itemIndex}
      totalTasks={pilotTasks.length}
      onComplete={handleItemComplete}
      onBack={onBack}
    />
  );
}