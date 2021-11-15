import Server, { Socket } from "net";
import { onConnectedClientHandling } from "./core/onConnectedClientHandling";
import Session from "./core/Session";
import { DEFAULT_OPTIONS } from "./lib/constants";
import Logger from "./lib/Logger";

export default class ProxyServer extends (Server.createServer as any) {
  private bridgedConnections: Record<string, Session>;

  constructor(options: any) {
    const {
      upstream,
      tcpOutgoingAddress,
      verbose,
      injectData,
      injectResponse,
      auth,
      intercept,
      keys,
      filter,
    } = { ...DEFAULT_OPTIONS, ...options } as any; //merging with default options
    const logger = new Logger(verbose);
    let bridgedConnections = {};

    super(function (clientSocket: Socket) {
      onConnectedClientHandling(
        clientSocket,
        bridgedConnections,
        {
          upstream,
          tcpOutgoingAddress,
          injectData,
          injectResponse,
          auth,
          intercept,
          keys,
          filter,
        },
        logger
      );
    });
    this.bridgedConnections = bridgedConnections;
  }

  getBridgedConnections() {
    return this.bridgedConnections;
  }
}

export { Session };
