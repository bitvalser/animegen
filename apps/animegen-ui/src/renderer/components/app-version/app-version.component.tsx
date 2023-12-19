import React, { FC, useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Grid,
  Typography,
} from '@mui/material';
import { getFromElectron } from '../../core/get-from-electron';

export const AppVersion: FC = () => {
  const [versions, setVersions] = useState<{
    isNew: boolean;
    currentVersion: string;
    latestVersion: string;
    url: string;
  }>({} as never);

  useEffect(() => {
    try {
      getFromElectron('check-version').then(setVersions);
    } catch (error) {
      console.error(error);
    }
  }, []);

  return (
    <Grid
      sx={{
        marginLeft: '10px',
      }}
      direction="column"
      alignSelf="flex-start"
      flexShrink={0}
    >
      {versions.isNew && (
        <Card>
          <CardContent>
            <Typography variant="body1">Доступна новая версия!</Typography>
            <Typography variant="h5" fontWeight={700}>
              {versions.currentVersion}
            </Typography>
          </CardContent>
          <CardActions>
            <Button size="small" href={versions.url} target="_blank">
              Скачать обновление
            </Button>
          </CardActions>
        </Card>
      )}
      <Typography>Текущая версия: {versions.currentVersion}</Typography>
    </Grid>
  );
};
