import uuid from "uniqid";

interface PubsubTopics {
  navigation_recenter: null;
  navigation_zoom: number;
  navigation_change_system: string | null;
}
type Topics = {
  [p in keyof PubsubTopics]?: {
    [key: string]: (args: PubsubTopics[p]) => void;
  };
};
const topics: Topics = {};

export function subscribe<T extends keyof PubsubTopics>(
  topic: T,
  fn: (args: PubsubTopics[typeof topic]) => void
) {
  if (!topics[topic]) topics[topic] = {};
  const id = uuid();
  const topicObj = topics[topic];
  if (topicObj) {
    topicObj[id] = fn as any;
  }
  return () => {
    if (topicObj) {
      delete topicObj[id];
    }
  };
}

export function publish<T extends keyof PubsubTopics>(
  topic: T,
  args?: PubsubTopics[typeof topic]
) {
  const topicObj = topics[topic] as object;
  if (!topicObj) return;
  Object.values(topicObj).forEach(fn => {
    fn?.(args as any);
  });
}
