import React, { FC } from 'react';

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
  return (
    <Box>
      <FormLabel id="input-slider">{label}</FormLabel>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs>
          <Slider
            aria-labelledby="input-slider"
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
              'aria-labelledby': 'input-slider',
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
