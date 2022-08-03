import concurrently from "concurrently";

concurrently(
  [
    {
      command: "npm run dev --workspace server",
      name: "server",
      prefixColor: "blue.bold",
    },
    {
      command: "npm run dev --workspace client",
      name: "client",
      prefixColor: "magenta.bold",
    },
  ],
  {
    killOthers: "failure",
  }
);
