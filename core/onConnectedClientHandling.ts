import Logger from "lib/Logger";
import net, { Socket } from "net";
import {
    ERROR_CODES,
    EVENTS,
    HTTPS,
    HTTP_BODIES,
    HTTP_METHODS,
    HTTP_RESPONSES,
    STRINGS
} from "../lib/constants";
import isFunction from "../lib/isFunction";
import { parseHeaders } from "../lib/parseHeaders";
import rebuildHeaders from "../lib/rebuildHeaders";
import usingUpstreamToProxy from "../lib/usingUpstreamToProxy";
import { getConnectionOptions } from "./getConnectionOptions";
import Session from "./Session";

const { CLOSE, DATA, ERROR, EXIT, END } = EVENTS;
const { ETIMEDOUT, ENOTFOUND, EPIPE, EPROTO } = ERROR_CODES;
const { CONNECT } = HTTP_METHODS;
const { AUTH_REQUIRED, OK, NOT_OK, TIMED_OUT, NOT_FOUND } = HTTP_RESPONSES;
const { BLANK, CLRF, EMPTY, SEPARATOR, PROXY_AUTH, PROXY_AUTH_BASIC } = STRINGS;
const DOUBLE_CLRF = CLRF + CLRF;

type NetError = Error & { code: string };

/**
 *
 * @param clientSocket
 * @param bridgedConnections
 * @param options
 * @param logger
 */
export async function onConnectedClientHandling(
  clientSocket: Socket,
  bridgedConnections: Record<string, Session>,
  options: any,
  logger: Logger
) {
  const {
    upstream,
    tcpOutgoingAddress,
    injectData,
    injectResponse,
    auth,
    intercept,
    keys,
    filter,
  } = options;

  const remotePort = clientSocket.remotePort;
  const remoteAddress = clientSocket.remoteAddress;
  const remoteID = remoteAddress + SEPARATOR + remotePort;

  // logger.log('Received request from', remoteID);

  function onClose(err: NetError) {
    const thisTunnel = bridgedConnections[remoteID];
    if (err && err instanceof Error) {
      //TODO handle more the errorCodes
      switch (err.code) {
        case ETIMEDOUT:
          thisTunnel.clientResponseWrite(TIMED_OUT + DOUBLE_CLRF);
          break;
        case ENOTFOUND:
          thisTunnel.clientResponseWrite(
            NOT_FOUND + DOUBLE_CLRF + HTTP_BODIES.NOT_FOUND
          );
          break;
        case EPIPE:
          logger.error(remoteID, err);
          break;
        // case EPROTO:
        //     // thisTunnel.clientResponseWrite(NOT_OK + DOUBLE_CLRF + HTTP_BODIES.NOT_FOUND);
        //     break;
        default:
          //log all unhandled errors
          logger.error(remoteID, err);
          thisTunnel.clientResponseWrite(NOT_OK + DOUBLE_CLRF);
      }
    }
    if (thisTunnel) {
      thisTunnel.destroy();
      delete bridgedConnections[remoteID];
    }
  }

  function onDataFromUpstream(dataFromUpStream: Buffer) {
    const thisTunnel = bridgedConnections[remoteID];
    const responseData = isFunction(injectResponse)
      ? injectResponse(dataFromUpStream, thisTunnel)
      : dataFromUpStream;

    thisTunnel.clientResponseWrite(responseData);
    //updateSockets if needed after first response
    updateSockets();
  }

  function onDirectConnectionOpen(srcData: Buffer) {
    const thisTunnel = bridgedConnections[remoteID];
    const requestData = isFunction(injectData)
      ? injectData(srcData, thisTunnel)
      : srcData;

    thisTunnel.clientRequestWrite(requestData);
  }

  function updateSockets() {
    const thisTunnel = bridgedConnections[remoteID];
    if (intercept && thisTunnel && thisTunnel.isHttps && !thisTunnel._updated) {
      const keysObject = isFunction(keys) ? keys(thisTunnel) : false;

      const keyToUse =
        keysObject &&
        typeof keysObject === "object" &&
        Object.keys(keysObject).length === 2
          ? keysObject
          : undefined;

      (thisTunnel as any)._updateSockets(
        { onDataFromClient, onDataFromUpstream, onClose },
        keyToUse
      );
    }
  }

  function prepareTunnel(
    data: Buffer,
    firstHeaderRow: string,
    isConnectMethod = false
  ) {
    const thisTunnel = bridgedConnections[remoteID];
    const upstreamHost = firstHeaderRow.split(BLANK)[1];
    const initOpt = getConnectionOptions(false as any, upstreamHost);

    thisTunnel.setTunnelOpt(initOpt); //settings opt before callback

    const proxyToUse = usingUpstreamToProxy(upstream, {
      data,
      bridgedConnection: thisTunnel,
    });
    //initializing socket and forwarding received request
    const connectionOpt = getConnectionOptions(proxyToUse, upstreamHost);
    if (!connectionOpt) {
      throw new Error("Connection opt was undefined");
    }
    thisTunnel.isHttps = !!(
      isConnectMethod ||
      (connectionOpt.upstream && connectionOpt.upstream.protocol === HTTPS)
    );

    thisTunnel.setTunnelOpt(connectionOpt); // updating tunnel opt

    if (isFunction(tcpOutgoingAddress)) {
      //THIS ONLY work if server-listener is not 0.0.0.0 but specific iFace/IP
      connectionOpt.localAddress = tcpOutgoingAddress(data, thisTunnel);
    }

    function onTunnelHTTPConnectionOpen(connectionError: NetError) {
      if (connectionError) {
        return onClose(connectionError);
      }

      if (connectionOpt!.credentials) {
        const headers = parseHeaders(data);
        const basedCredentials = Buffer.from(
          connectionOpt!.credentials
        ).toString("base64"); //converting to base64
        headers[PROXY_AUTH.toLowerCase()] =
          PROXY_AUTH_BASIC + BLANK + basedCredentials;
        const newData = rebuildHeaders(headers, data);
        thisTunnel.clientRequestWrite(newData);
      } else {
        onDirectConnectionOpen(data);
      }
    }

    async function onTunnelHTTPSConnectionOpen(connectionError: NetError) {
      if (connectionError) {
        return onClose(connectionError);
      }
      if (connectionOpt!.upstreamed) {
        if (connectionOpt!.credentials) {
          const headers = parseHeaders(data);
          const basedCredentials = Buffer.from(
            connectionOpt!.credentials
          ).toString("base64"); //converting to base64
          headers[PROXY_AUTH.toLowerCase()] =
            PROXY_AUTH_BASIC + BLANK + basedCredentials;
          const newData = rebuildHeaders(headers, data);
          thisTunnel.clientRequestWrite(newData);
        } else {
          onDirectConnectionOpen(data);
        }
      } else {
        // response as normal http-proxy
        thisTunnel.clientResponseWrite(OK + CLRF + CLRF);
        updateSockets();
      }
    }

    const callbackOnConnect = isConnectMethod
      ? onTunnelHTTPSConnectionOpen
      : onTunnelHTTPConnectionOpen;

    if (connectionOpt) {
      logger.log(remoteID, "=>", thisTunnel.getTunnelStats());

      const responseSocket = net.createConnection(
        connectionOpt as any,
        callbackOnConnect as any
      );

      thisTunnel.setRequestSocket(
        responseSocket
          .on(DATA, onDataFromUpstream)
          .on(CLOSE, onClose)
          .on(ERROR, onClose)
      );
    }
    return connectionOpt;
  }

  function handleProxyTunnel(split: any, data: any) {
    const firstHeaderRow = split[0];
    const thisTunnel = bridgedConnections[remoteID];

    if (~firstHeaderRow.indexOf(CONNECT)) {
      //managing HTTP-Tunnel(upstream) & HTTPs
      prepareTunnel(data, firstHeaderRow, true);
    } else if (firstHeaderRow.indexOf(CONNECT) === -1 && !thisTunnel._dst) {
      // managing http
      prepareTunnel(data, firstHeaderRow);
    } else if (thisTunnel && thisTunnel._dst) {
      filter?.(data, thisTunnel, (message: string) =>
        closeGitConnection(message)
      );
      return onDirectConnectionOpen(data);
    }
  }

  function closeGitConnection(errorMessage: string) {
    const thisTunnel = bridgedConnections[remoteID];

    // ERROR PCT LINE -- MOVE THIS TO HELPER
    const len = 6 + errorMessage.length;

    const prefix = len.toString(16);
    const packetMessage = `00${prefix}\x02${errorMessage}\n0000`;
    thisTunnel.clientResponseWrite("HTTP/1.0 200 OK\r\n\r\n" + packetMessage);
    thisTunnel.destroy();
  }

  async function onDataFromClient(data: Buffer) {
    const dataString = data.toString();
    const thisTunnel = bridgedConnections[remoteID];

    try {
      if (dataString && dataString.length > 0) {
        const headers = parseHeaders(data);
        const split = dataString.split(CLRF); //TODO make secure, split can be limited

        if (isFunction(auth) && !thisTunnel.isAuthenticated()) {
          const proxyAuth = headers[PROXY_AUTH.toLowerCase()];
          if (proxyAuth) {
            const credentials = proxyAuth.replace(PROXY_AUTH_BASIC, EMPTY);

            const parsedCredentials = Buffer.from(
              credentials,
              "base64"
            ).toString(); //converting from base64
            const [username, password] = parsedCredentials.split(SEPARATOR); //TODO split can be limited
            let isLogged = auth(username, password, thisTunnel);

            if (isLogged instanceof Promise) {
              //if async operation...
              isLogged = await isLogged; //...need to resolve promise
            }

            if (isLogged) {
              thisTunnel.setUserAuthentication(username);
              return handleProxyTunnel(split, data);
            } else {
              //return auth-error and close all
              thisTunnel.clientResponseWrite(
                AUTH_REQUIRED + DOUBLE_CLRF + HTTP_BODIES.AUTH_REQUIRED
              );
              return onClose(new Error("This is bad") as any);
            }
          } else {
            return thisTunnel.clientResponseWrite(AUTH_REQUIRED + DOUBLE_CLRF);
          }
        } else {
          return handleProxyTunnel(split, data);
        }
      }
    } catch (err) {
      return onClose(err as NetError);
    }
  }

  bridgedConnections[remoteID] = new Session(remoteID); //initializing bridged-connection
  bridgedConnections[remoteID].setResponseSocket(
    clientSocket
      .on(DATA, onDataFromClient)
      //.on(END, onEnd)
      .on(ERROR, onClose)
      .on(CLOSE, onClose)
      .on(EXIT, onClose)
  );
}
