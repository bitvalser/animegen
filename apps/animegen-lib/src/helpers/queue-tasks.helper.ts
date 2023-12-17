const NOT_RESOLVED = Symbol.for('NOT_RESOLVED');
const IN_WORK = Symbol.for('IN_WORK');

export const queueTasks = <T = never>(
  tasks: (() => Promise<T>)[],
  concurrency: number,
  onTaskReady?: (index: number) => void,
  onTaskError?: (index: number, error: Error) => void,
): Promise<T[]> => {
  const results = Array.from({ length: tasks.length }).fill(NOT_RESOLVED) as T[];

  return new Promise<T[]>((resolve) => {
    const startNext = () => {
      const nextTaskIndex = results.findIndex((item) => item === (NOT_RESOLVED as never as T));
      if (nextTaskIndex >= 0) {
        results[nextTaskIndex] = IN_WORK as never as T;
        runTask(nextTaskIndex);
      } else if (results.every((item) => !([NOT_RESOLVED, IN_WORK] as never as T[]).includes(item))) {
        resolve(results);
      }
    };
    const runTask = (index: number) => {
      tasks[index]()
        .then((result) => {
          results[index] = result;
          onTaskReady?.(index);
          startNext();
        })
        .catch((error) => {
          results[index] = null as T;
          onTaskError?.(index, error);
          startNext();
        });
    };

    Array.from({ length: concurrency }).forEach(() => {
      startNext();
    });
  });
};
