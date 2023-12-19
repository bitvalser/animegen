import { FC, useState } from 'react';
import {
  Box,
  Button,
  Grid,
  IconButton,
  Modal,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { FeedbackModalProps } from './feedback-modal.types';

export const FEEDBACK_MAX_LENGTH = 2048;

export const FeedbackModal: FC<FeedbackModalProps> = ({
  title = 'Фидбэк',
  label = 'Ваш Фидбэк',
  onClose,
  onSubmit,
}) => {
  const [message, setMessage] = useState('');
  const theme = useTheme();

  const handleMessageChange: React.ChangeEventHandler<HTMLTextAreaElement> = (
    event,
  ) => setMessage(event.target.value);

  const handleSubmit = () => {
    onSubmit(message);
  };

  return (
    <Modal open>
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
            {title}
          </Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Grid>
        <TextField
          rows={10}
          variant="filled"
          fullWidth
          label={label}
          multiline
          onChange={handleMessageChange}
          value={message}
          inputProps={{
            style: {
              fontSize: '16px',
            },
            maxLength: FEEDBACK_MAX_LENGTH,
          }}
        />
        <Button
          sx={{
            margin: '2px',
            marginTop: '5px',
          }}
          variant="contained"
          onClick={handleSubmit}
        >
          Отправить
        </Button>
      </Box>
    </Modal>
  );
};
