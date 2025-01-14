import {
  HTTP,
  HTTPS,
  HTTPS_PORT,
  HTTP_PORT,
  SLASH,
  SLASH_REGEXP,
  STRINGS
} from "../lib/constants";
import { isValid } from "../lib/isValidASCII";

/**
 *
 * @param ipStringWithPort
 * @returns {{host: string, port: number, protocol: string, credentials: string}}
 */
function getAddressAndPortFromString(ipStringWithPort: string) {
  let [credentials, targetHost] = ipStringWithPort.split(STRINGS.AT);

  if (!targetHost) {
    targetHost = credentials;
    credentials = "";
  }

  let [protocol, host, port] = targetHost.split(STRINGS.SEPARATOR);
  if (protocol.indexOf(HTTP) === -1) {
    port = host;
    host = protocol;
    protocol = port && parseInt(port) === HTTPS_PORT ? HTTPS : HTTP;
  }

  host = host ? host : protocol.replace(SLASH_REGEXP, STRINGS.EMPTY);

  if (host.indexOf(SLASH + SLASH) === 0) {
    host = host.split(SLASH)[2];
  } else {
    host = host.split(SLASH)[0];
  }

  port = String(
    port || (protocol && ~protocol.indexOf(HTTPS) ? HTTPS_PORT : HTTP_PORT)
  );

  return JSON.parse(
    JSON.stringify({
      host: host,
      port: parseInt(port),
      protocol: protocol,
      credentials: credentials || undefined,
    })
  );
}

/**
 * Build options for native nodejs tcp-connection.
 * @param proxyToUse
 * @param upstreamHost
 * @returns {boolean|{host: string, port: number, protocol: string, credentials: string, upstreamed:boolean}}
 */
export function getConnectionOptions(
  proxyToUse: string,
  upstreamHost: string
):
  | {
      host: string;
      port: number;
      protocol: string;
      credentials: string;
      upstreamed: boolean;
      upstream: {
        host: string;
        port: number;
        protocol: string;
        credentials: string;
      };
      localAddress: string;
    }
  | undefined {
  if (isValid(upstreamHost)) {
    const upstreamed = !!proxyToUse;
    const upstreamToUse = upstreamed ? proxyToUse : upstreamHost;
    const config = getAddressAndPortFromString(upstreamToUse);
    const objectToReturn = { ...config, ...{ upstreamed: upstreamed } };
    if (objectToReturn.upstreamed) {
      objectToReturn.upstream = getAddressAndPortFromString(upstreamHost);
    }
    if (!(objectToReturn.port >= 0 && objectToReturn.port < 65536)) {
      return undefined;
    }
    return objectToReturn;
  } else {
    return undefined;
  }
}
