import { STRINGS } from "./constants";
const { BLANK, CLRF, SEPARATOR } = STRINGS;
const DOUBLE_CLRF = CLRF + CLRF;

export function rebuildHeaders(
  headersObject: Record<string, string>,
  dataBuffer: Buffer
) {
  const dataString = dataBuffer.toString();
  const [headers, body] = dataString.split(DOUBLE_CLRF + CLRF, 2);
  const firstRow = headers.split(CLRF, 1)[0];

  let newData = firstRow + CLRF;

  for (const key of Object.keys(headersObject)) {
    const value = headersObject[key];
    newData += key + SEPARATOR + BLANK + value + CLRF;
  }

  newData += DOUBLE_CLRF + (body || "");

  return Buffer.from(newData);
}
