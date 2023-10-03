export interface CheckboxSelectProps {
  onChange: (value: string[]) => void;
  value: string[];
  options: {
    label: string;
    value: string;
  }[];
  label: string;
}
