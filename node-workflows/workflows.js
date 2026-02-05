import { proxyActivities } from "@temporalio/workflow";

const { processTask } = proxyActivities({
  startToCloseTimeout: "30 seconds",
});

export async function taskWorkflow(taskId) {
  return await processTask(taskId);
}
