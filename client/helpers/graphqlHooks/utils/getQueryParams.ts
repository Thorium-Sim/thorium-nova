import {DocumentNode, separateOperations, print} from "graphql";

export default function getQueryParams(document: DocumentNode) {
  const query = print(document);
  const operationName = Object.keys(separateOperations(document))[0];
  return {query, operationName};
}
