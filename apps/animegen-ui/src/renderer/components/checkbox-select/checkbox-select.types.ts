export interface CheckboxSelectProps {
  onChange: (value: string[]) => void;
  onBlur?: () => void;
  value: string[];
  options: {
    label: string;
    value: string;
  }[];
  label: string;
  error?: boolean;
  helperText?: string;
}
