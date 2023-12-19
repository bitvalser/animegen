import React, { FC, useId } from 'react';

import { Box, FormLabel, Input, Slider, Grid, Typography } from '@mui/material';

import { SliderNumProps } from './slider-num.types';

export const SliderNum: FC<SliderNumProps> = ({
  label,
  max,
  min,
  step,
  unit = '',
  ...field
}) => {
  const labelId = useId();

  return (
    <Box>
      <FormLabel id={`${labelId}-slider`}>{label}</FormLabel>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs>
          <Slider
            aria-labelledby={`${labelId}-slider`}
            max={max}
            min={min}
            step={step}
            {...field}
          />
        </Grid>
        <Grid item direction="row">
          <Input
            sx={{
              width: 80,
            }}
            size="small"
            inputProps={{
              step,
              min: min,
              max: max,
              type: 'tel',
              'aria-labelledby': `${labelId}-slider`,
            }}
            {...field}
          />
          <Typography
            sx={{
              right: 10,
              position: 'absolute',
            }}
            align="right"
            component="span"
          >
            {unit}
          </Typography>
        </Grid>
      </Grid>
    </Box>
  );
};
