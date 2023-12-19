import React, { FC, useState, useEffect, useRef } from 'react';

import {
  Box,
  Modal,
  Typography,
  TextField,
  useTheme,
  LinearProgress,
  Button,
  Grid,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

import { GeneratorModalProps } from './generator-modal.types';
import { logEvent } from 'firebase/analytics';
import { analytics } from '../../core/firebase';

export const GeneratorModal: FC<GeneratorModalProps> = ({
  open,
  onClose = () => {},
}) => {
  const inputRef = useRef<HTMLTextAreaElement>();
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState('');
  const [packPath, setPackPath] = useState(null);
  const [error, setError] = useState(null);
  const theme = useTheme();

  useEffect(() => {
    if (inputRef.current) {
      if (
        inputRef.current.clientHeight + inputRef.current.scrollTop >
        inputRef.current.scrollHeight - 80
      ) {
        inputRef.current.scrollTo(0, inputRef.current.scrollHeight);
      }
    }
  }, [logs]);

  useEffect(
    () =>
      window.electron.ipcRenderer.on('animegen', (args: any) => {
        console.log(args);
        if (!args?.type) return;
        if (args.type === 'gen-progress') {
          setProgress(args.progress);
          setLogs((prevLogs) => `${prevLogs}\n${args.message}`);
        }
        if (args.type === 'gen-error') {
          setError(args.message || 'Что-то пошло не так :(');
          logEvent(analytics, 'generate_si_error', { message: args.message });
        }
        if (args.type === 'gen-success') {
          setProgress(100);
          setPackPath(args.packPath);
          setLogs(
            (prevLogs) =>
              `${prevLogs}\nПуть созданного пака -> ${args.packPath}`,
          );
          logEvent(analytics, 'generate_si_success');
        }
      }),
    [],
  );

  return (
    <Modal open={open}>
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          padding: '10px',
          outline: 'none',
          width: 596,
          height: 400,
          borderRadius: '4px',
          paddingBottom: 0,
          display: 'flex',
          overflow: 'hidden',
          flexDirection: 'column',
          backgroundColor: theme.palette.background.paper,
        }}
      >
        <Grid
          sx={{
            marginBottom: '6px',
          }}
          container
          flexDirection="row"
          justifyContent="space-between"
        >
          <Typography variant="h6" component="h2">
            Генерация пакета
          </Typography>
          {error && (
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          )}
        </Grid>
        <TextField
          inputRef={inputRef}
          rows={17}
          variant="filled"
          fullWidth
          label="Логи"
          multiline
          value={logs}
          inputProps={{
            style: {
              fontSize: '14px',
              lineHeight: '14px',
            },
            readOnly: true,
          }}
        />
        {error && (
          <Typography
            color="red"
            sx={{
              marginTop: '5px',
            }}
          >
            {error}
          </Typography>
        )}
        {progress !== 100 && !error && (
          <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <Box sx={{ width: '100%', mr: 1 }}>
              <LinearProgress variant="determinate" value={progress} />
            </Box>
            <Box sx={{ minWidth: 35 }}>
              <Typography variant="body2" color="text.secondary">{`${Math.round(
                progress,
              )}%`}</Typography>
            </Box>
          </Box>
        )}
        {progress === 100 && (
          <Button
            sx={{
              margin: '2px',
              marginTop: '5px',
            }}
            variant="contained"
            onClick={onClose}
          >
            Принять
          </Button>
        )}
      </Box>
    </Modal>
  );
};
