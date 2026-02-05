// Activity that simulates task processing
export async function processTask(taskId) {
  console.log(`Processing task: ${taskId}`);

  // Simulate some work
  await new Promise((resolve) => setTimeout(resolve, 2000));

  console.log(`Completed task: ${taskId}`);
  return { taskId, status: "completed", completedAt: new Date().toISOString() };
}
