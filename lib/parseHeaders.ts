import { STRINGS } from "./constants";
const { CLRF, SEPARATOR } = STRINGS;

export function parseHeaders(data: Buffer) {
  //TODO make secure
  const dataString = data.toString();
  const [headers, body] = dataString.split(CLRF + CLRF + CLRF);
  const headerRows = headers.split(CLRF);
  const headerObject: Record<string, string> = {};
  for (let i = 0; i < headerRows.length; i++) {
    const headerRow = headerRows[i];
    if (i === 0) {
      //first row contain method, path and type
      // const [method, path, version] = headerRow.split(BLANK);
      // headerObject.method = method;
      // headerObject.path = path;
      // headerObject.version = version;
    } else {
      const [attribute, value] = headerRow.split(SEPARATOR);
      if (attribute && value) {
        const lowerAttribute = attribute.trim().toLowerCase();
        headerObject[lowerAttribute] = value.trim();
      }
    }
  }
  return headerObject;
}
