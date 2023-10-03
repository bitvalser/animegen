import { ControllerRenderProps } from 'react-hook-form';
import { InputProps } from '@mui/material';

export interface SliderNumProps extends ControllerRenderProps {
  label: string;
  step: number;
  min: number;
  max: number;
  unit?: string;
}
