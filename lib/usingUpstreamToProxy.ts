import { isFunction } from "./isFunction";

export function usingUpstreamToProxy(
  upstream: any,
  { data, bridgedConnection }: any
) {
  if (isFunction(upstream)) {
    const returnValue = upstream(data, bridgedConnection);
    if (returnValue !== "localhost") {
      return returnValue;
    }
  }
  return false;
};
