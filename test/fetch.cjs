const fetch = require("node-fetch");

window.fetch = fetch;

class Worker {
  constructor(stringUrl) {
    this.url = stringUrl;
    this.onmessage = () => {};
  }

  postMessage(msg) {
    this.onmessage(msg);
  }
  terminate() {}
}

window.Worker = Worker;
window.URL.createObjectURL = jest.fn(() => "details");
