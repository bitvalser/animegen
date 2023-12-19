import React, { FC, useState, ChangeEvent, useEffect } from 'react';

import {
  Checkbox,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  FormLabel,
  Grid,
} from '@mui/material';

import { CheckboxSelectProps } from './checkbox-select.types';

export const CheckboxSelect: FC<CheckboxSelectProps> = ({
  label,
  onChange,
  onBlur,
  options = [],
  value = [],
  error,
  helperText,
}) => {
  const [values, setValues] = useState<Record<string, boolean>>(() =>
    options.reduce(
      (acc, val) => ({
        ...acc,
        [val.value]: (value || []).includes(val.value),
      }),
      {},
    ),
  );

  useEffect(() => {
    setValues(
      options.reduce(
        (acc, val) => ({
          ...acc,
          [val.value]: (value || []).includes(val.value),
        }),
        {},
      ),
    );
  }, [value]);

  const handleChangeField =
    (field: string) =>
    (event: ChangeEvent<HTMLInputElement>, checked: boolean) => {
      const newValue = {
        ...values,
        [field]: checked,
      };
      onChange(
        Object.entries(newValue)
          .filter(([, checked]) => checked)
          .map(([key]) => key),
      );
      onBlur?.();
    };

  return (
    <FormGroup>
      <FormLabel id="demo-radio-buttons-group-label" error={error}>
        {label}
      </FormLabel>
      <Grid direction="row" wrap="wrap">
        {options.map((item) => (
          <FormControlLabel
            key={item.value}
            control={
              <Checkbox
                checked={values[item.value]}
                onChange={handleChangeField(item.value)}
              />
            }
            label={item.label}
          />
        ))}
      </Grid>
      {helperText && (
        <FormHelperText error={error}>{helperText}</FormHelperText>
      )}
    </FormGroup>
  );
};
