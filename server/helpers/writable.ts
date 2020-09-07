export type Writable<T> = T & {
  writeFile: (force?: boolean) => Promise<void>;
  removeFile: (force?: boolean) => Promise<void>;
};
