export const DEFAULT_OPTIONS = {
  upstream: false,
  tcpOutgoingAddress: false,
  verbose: false,
  injectData: false,
  injectResponse: false,
  auth: false,
  intercept: false,
  keys: false,
};
export const EVENTS = {
  CLOSE: "close",
  DATA: "data",
  ERROR: "error",
  EXIT: "exit",
  END: "end",
};
export const ERROR_CODES = {
  ETIMEDOUT: "ETIMEDOUT",
  ENOTFOUND: "ENOTFOUND",
  EPIPE: "EPIPE",
  EPROTO: "EPROTO",
};
export const HTTP = "http";
export const HTTPS = "https";
export const HTTP_PORT = 80;
export const HTTPS_PORT = 443;
export const HTTP_BODIES = {
  AUTH_REQUIRED: "Proxy Authorization Required!",
  NOT_FOUND: "Not Found!",
};
export const HTTP_RESPONSES = {
  OK: "HTTP/1.0 200 OK",
  NOT_FOUND: "HTTP/1.0 404 Not Found",
  NOT_OK: "HTTP/1.0 400 Bad Request",
  AUTH_REQUIRED:
    "HTTP/1.0 407 Proxy Authorization Required" +
    '\r\nProxy-Authenticate: Basic realm=""',
  TIMED_OUT: "HTTP/1.0 408 Request Timeout",
};
export const HTTP_METHODS = {
  CONNECT: "CONNECT",
  GET: "GET",
};
export const STRINGS = {
  AT: "@",
  BLANK: " ",
  CLRF: "\r\n",
  EMPTY: "",
  SEPARATOR: ":",
  PROXY_AUTH: "Proxy-Authorization",
  PROXY_AUTH_BASIC: "Basic",
};
export const SLASH = "/";
export const SLASH_REGEXP = /\//gim;
export const SLASH_REGEXP_ONCE = /\//g;
export const DEFAULT_KEYS = {
  key:
    "-----BEGIN PRIVATE KEY-----\n" +
    "MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgFy3kvv0iHTVaeqcv\n" +
    "DIzScropX09AFbieQAy8Dyh8kCihRANCAAQ+UBhyBUy/izj5jozMz+aLpzj7/lPS\n" +
    "jAQbWM+8aSDYmu7Ermo6+qz9PatGixPE1c3cq0E9BSqOEVYMXiVcizeQ\n" +
    "-----END PRIVATE KEY-----",
  cert:
    "-----BEGIN CERTIFICATE-----\n" +
    "MIIBlTCCATygAwIBAgIUcUDMIG9bw3nWnUS5vwGPIgX3zIcwCgYIKoZIzj0EAwIw\n" +
    "FDESMBAGA1UEAwwJbG9jYWxob3N0MB4XDTIwMDEyMjIzMjIwN1oXDTIxMDEyMTIz\n" +
    "MjIwN1owFDESMBAGA1UEAwwJbG9jYWxob3N0MFkwEwYHKoZIzj0CAQYIKoZIzj0D\n" +
    "AQcDQgAEPlAYcgVMv4s4+Y6MzM/mi6c4+/5T0owEG1jPvGkg2JruxK5qOvqs/T2r\n" +
    "RosTxNXN3KtBPQUqjhFWDF4lXIs3kKNsMGowaAYDVR0RBGEwX4IJbG9jYWxob3N0\n" +
    "ggsqLmxvY2FsaG9zdIIVbG9jYWxob3N0LmxvY2FsZG9tYWluhwR/AAABhwQAAAAA\n" +
    "hxAAAAAAAAAAAAAAAAAAAAABhxAAAAAAAAAAAAAAAAAAAAAAMAoGCCqGSM49BAMC\n" +
    "A0cAMEQCIH/3IPGNTbCQnr1F1x0r28BtwkhMZPLRSlm7p0uXDv9pAiBi4JQKEwlY\n" +
    "6sWzsJyD3vMMAyP9UZm0WJhtcOb6F0wRpg==\n" +
    "-----END CERTIFICATE-----",
};
