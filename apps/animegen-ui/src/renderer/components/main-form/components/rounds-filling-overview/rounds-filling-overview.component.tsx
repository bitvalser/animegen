import { Grid, Typography } from '@mui/material';
import { UseFormWatch } from 'react-hook-form';
import { FormValues } from '../../main-form.types';

interface RoundsFillingOverviewProps {
  watch: UseFormWatch<FormValues>;
}

const LABELS_MAP: {
  [key: string]: string;
} = {
  screenshots: 'Скриншоты',
  characters: 'Персонажи',
  openings: 'Опенинги',
  endings: 'Эндинги',
  coubs: 'Коубы',
};

const COLORS_MAP: {
  [key: string]: string;
} = {
  screenshots: '#4185c6',
  characters: '#843a8e',
  openings: '#fecf16',
  endings: '#5dbca4',
  coubs: '#312783',
};

export const RoundsFillingOverview = ({
  watch,
}: RoundsFillingOverviewProps) => {
  const titleCounts = watch('titleCounts');
  const selectedRounds = watch('rounds') as string[];
  const roundFill = watch('roundsFill') as Record<string, { ratio: number }>;
  console.log(titleCounts, roundFill);

  const total = Math.floor(
    Object.entries(roundFill)
      .filter(([key]) => selectedRounds.includes(key))
      .map(([, value]) => value)
      .reduce((acc, val) => acc + titleCounts * val.ratio, 0),
  );
  return (
    <Grid
      sx={{
        pt: 2,
        pb: 2,
      }}
      container
      flexDirection="row"
      alignItems="center"
    >
      <Grid xs item>
        <Grid container flexDirection="row">
          {Object.entries(roundFill)
            .filter(([key]) => selectedRounds.includes(key))
            .map(([key, { ratio }], index) => (
              <Grid
                sx={{
                  position: 'relative',
                  height: '8px',
                  backgroundColor: COLORS_MAP[key],
                }}
                item
                flex={100 * ratio}
              >
                <Typography
                  sx={{
                    position: 'absolute',
                    left: '50%',
                    transform: 'translate(-50%)',
                    top: index % 2 === 0 ? '-20px' : 'initial',
                    bottom: index % 2 === 1 ? '-20px' : 'initial',
                  }}
                  fontSize={12}
                  whiteSpace="nowrap"
                >
                  {LABELS_MAP[key]} ({Math.floor(titleCounts * ratio)})
                </Typography>
              </Grid>
            ))}
        </Grid>
      </Grid>
      <Grid xs={1} item justifyContent="flex-end">
        <Typography textAlign="right">({total})</Typography>
      </Grid>
    </Grid>
  );
};
