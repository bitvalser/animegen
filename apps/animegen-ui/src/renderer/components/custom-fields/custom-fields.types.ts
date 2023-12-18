import { Control } from 'react-hook-form';

export interface CustomFieldsProps {
  control: Control<any, any>;
  prefix: string;
  fields: {
    name: string;
    label: string;
    type: string;
    value?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    options?: any;
  }[];
}
