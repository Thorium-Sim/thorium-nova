export default function uniqid(prefix = "", suffix = "") {
  return (
    (prefix ? prefix : "") +
    Now.time().toString(36) +
    Math.trunc(Math.random() * Math.pow(2, 8))
      .toString(36)
      .padStart(2, "0") +
    (suffix ? suffix : "")
  );
}

class Now {
  static last: number = 0;
  static time() {
    let time = Date.now();
    let last = Now.last || time;
    return (Now.last = time > last ? time : last + 1);
  }
}
