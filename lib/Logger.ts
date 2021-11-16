export default class Logger {
  debug = false;
  constructor(debugMode = false) {
    this.debug = debugMode;
  }

  log(...args: any[]) {
    if (this.debug) {
      console.log("###", new Date(), ...args);
    }
  }

  error(...args: any[]) {
    if (this.debug) {
      console.error("###", new Date(), ...args);
    }
  }
}
