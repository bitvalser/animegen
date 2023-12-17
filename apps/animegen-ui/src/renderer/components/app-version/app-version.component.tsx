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

export const AppVersion: FC = () => {
  const [versions, setVersions] = useState<{
    isNew: boolean;
    currentVersion: string;
    latestVersion: string;
    url: string;
  }>({} as never);

  useEffect(() => {
    window.electron.ipcRenderer.sendMessage('check-version');
    window.electron.ipcRenderer.once('check-version', (data: any) => {
      setVersions(data);
    });
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
