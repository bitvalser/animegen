import React, { FC } from 'react';
import { Controller } from 'react-hook-form';
import {
  Checkbox,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from '@mui/material';
import { CustomFieldsProps } from './custom-fields.types';
import { SliderNum } from '../slider-num';
import { CheckboxSelect } from '../checkbox-select';

export const CustomFields: FC<CustomFieldsProps> = ({
  control,
  fields,
  prefix,
}) => {
  return (
    <>
      {fields.map((fieldItem) => (
        <Grid key={fieldItem.name} item>
          <Controller
            name={`${prefix}.${fieldItem.name}`}
            control={control}
            render={({ field }) => {
              switch (fieldItem.type) {
                case 'input':
                  return (
                    <TextField fullWidth label={fieldItem.label} {...field} />
                  );
                case 'slider':
                  return (
                    <SliderNum
                      label={fieldItem.label}
                      {...fieldItem.options}
                      {...field}
                    />
                  );
                case 'select':
                  return (
                    <FormControl fullWidth>
                      <InputLabel id={`${fieldItem.name}-select-label`}>
                        {fieldItem.label}
                      </InputLabel>
                      <Select
                        labelId={`${fieldItem.name}-select-label`}
                        label={fieldItem.label}
                        {...field}
                      >
                        <MenuItem value={null}>Не важно</MenuItem>
                        {(fieldItem.options?.values || []).map((item: any) => (
                          <MenuItem value={item.value}>{item.label}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  );
                case 'checkbox':
                  return (
                    <FormControlLabel
                      control={<Checkbox {...field} checked={field.value} />}
                      label={fieldItem.label}
                    />
                  );
                case 'checkbox-select':
                  return (
                    <CheckboxSelect
                      label={fieldItem.label}
                      options={fieldItem.options?.values || []}
                      {...field}
                    />
                  );
                default:
                  return null;
              }
            }}
          />
        </Grid>
      ))}
    </>
  );
};
