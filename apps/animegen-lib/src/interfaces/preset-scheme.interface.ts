export interface PresetScheme {
  getterFn: string;
  fieldsScheme: {
    name: string;
    label: string;
    type: string;
    value?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    options?: any;
  }[];
}
