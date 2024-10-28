export type Token = {
  kind: 'begin-array';
} | {
  kind: 'end-array';
} | {
  kind: 'begin-object';
} | {
  kind: 'end-object';
} | {
  kind: 'name-separator';
} | {
  kind: 'value-separator';
} | {
  kind: 'null-literal';
} | {
  kind: 'boolean-literal';
  value: boolean;
} | {
  kind: 'string-literal';
  value: string;
} | {
  kind: 'number-literal';
  value: number;
};
