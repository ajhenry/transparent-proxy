import { Socket } from "net";
import tls from "tls";
import { DEFAULT_KEYS, EVENTS } from "../lib/constants";

const { CLOSE, DATA, ERROR } = EVENTS;

/**
 *
 * @param {net.Socket} socket
 * @param data
 */
function socketWrite(socket: Socket, data: Buffer | string) {
  if (socket && !socket.destroyed && data) {
    socket.write(data);
  }
}

/**
 *
 * @param {net.Socket} socket
 */
function socketDestroy(socket: Socket) {
  if (socket && !socket.destroyed) {
    socket.destroy();
  }
}

interface Session {
  _id: any;
  _src: any;
  _dst: any;
  _tunnel: any;
  _updated: any;
  user: any;
  authenticated: any;
  isHttps: boolean;
}

class Session  {
  /**
   *
   * @param id
   */
  constructor(id: string) {
    //super();

    this._id = id;
    this._src = null;
    this._dst = null;
    this._tunnel = {};
    this.user = null;
    this.authenticated = false;
    this.isHttps = false;
  }

  /**
   *
   * @param {buffer|string} data - The data to send.
   * @returns {Session}
   */
  public clientRequestWrite(data: Buffer) {
    socketWrite(this._dst, data);
    return this;
  }

  /**
   *
   * @param {buffer|string} data - The data to send.
   * @returns {Session}
   */
  public clientResponseWrite(data: Buffer | string) {
    socketWrite(this._src, data);
    return this;
  }

  /**
   * Destroy existing sockets for this Session-Instance
   * @returns {Session}
   */
  public destroy() {
    if (this._dst) {
      socketDestroy(this._dst);
    }
    if (this._src) {
      socketDestroy(this._src);
    }
    return this;
  }

  /**
   * Is Session authenticated by user
   * @returns {boolean}
   */
  public isAuthenticated() {
    return this.authenticated;
  }

  /**
   * Set the socket that will receive response
   * @param {net.Socket} socket
   * @returns {Session}
   */
  public setResponseSocket(socket: Socket) {
    this._src = socket;
    return this;
  }

  /**
   * Set the socket that will receive request
   * @param {net.Socket} socket
   * @returns {Session}
   */
  public setRequestSocket(socket: Socket) {
    this._dst = socket;
    return this;
  }

  /**
   * Get own id
   * @returns {string}
   */
  public getId() {
    return this._id;
  }

  /**
   *
   * @param {string} username
   * @returns {Session}
   */
  public setUserAuthentication(username: string | undefined) {
    if (username) {
      this.authenticated = true;
      this.user = username;
    }
    return this;
  }

  /**
   *
   * @param options
   * @returns {Session}
   */
  public setTunnelOpt(options: any) {
    if (options) {
      const { host, port, upstream } = options;
      this._tunnel.ADDRESS = host;
      this._tunnel.PORT = port;
      if (!!upstream) {
        this._tunnel.UPSTREAM = upstream;
      }
    }
    return this;
  }

  /**
   *
   * @param callbacksObject
   * @param KEYS
   * @returns {Session}
   * @private
   */
  public _updateSockets(callbacksObject: any, KEYS = DEFAULT_KEYS) {
    const { onDataFromClient, onDataFromUpstream, onClose } = callbacksObject;
    KEYS = KEYS || DEFAULT_KEYS;

    if (!this._updated) {
      this.setResponseSocket(
        new tls.TLSSocket(this._src, {
          rejectUnauthorized: false,
          requestCert: false,
          isServer: true,
          key: KEYS.key,
          cert: KEYS.cert,
        })
          .on(DATA, onDataFromClient)
          .on(CLOSE, onClose)
          .on(ERROR, onClose)
      );

      this.setRequestSocket(
        new tls.TLSSocket(this._dst, {
          rejectUnauthorized: false,
          requestCert: false,
          isServer: false,
        })
          .on(DATA, onDataFromUpstream)
          .on(CLOSE, onClose)
          .on(ERROR, onClose)
      );
      this._updated = true;
    }
    return this;
  }

  /**
   * Get Stats for this tunnel
   * @returns {object} - {ADDRESS:'String', PORT:Number, UPSTREAM:{ADDRESS,PORT}}
   */
  public getTunnelStats() {
    return this._tunnel;
  }
}

export default Session;
