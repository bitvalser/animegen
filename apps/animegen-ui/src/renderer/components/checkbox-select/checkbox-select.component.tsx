import React, { FC, useState, ChangeEvent } from 'react';

import {
  Checkbox,
  FormControlLabel,
  FormGroup,
  FormLabel,
  Grid,
} from '@mui/material';

import { CheckboxSelectProps } from './checkbox-select.types';

export const CheckboxSelect: FC<CheckboxSelectProps> = ({
  label,
  onChange,
  options = [],
  value = [],
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

  const handleChangeField =
    (field: string) =>
    (event: ChangeEvent<HTMLInputElement>, checked: boolean) => {
      setValues((prevVal) => {
        const newValue = {
          ...prevVal,
          [field]: checked,
        };
        onChange(
          Object.entries(newValue)
            .filter(([, checked]) => checked)
            .map(([key]) => key),
        );
        return newValue;
      });
    };

  return (
    <FormGroup>
      <FormLabel id="demo-radio-buttons-group-label">{label}</FormLabel>
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
    </FormGroup>
  );
};
