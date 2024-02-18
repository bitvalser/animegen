import React, { FC, useState, useEffect } from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';

import Grid from '@mui/material/Grid';
import {
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormLabel,
  Radio,
  RadioGroup,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Typography,
  Tooltip,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import { FormValues } from './main-form.types';
import { CheckboxSelect } from '../checkbox-select/checkbox-select.component';
import {
  ANIME_PROVIDERS,
  ANIME_TYPES_OPTIONS,
  CHARACTER_ROLES_OPTIONS,
  DEFAULT_VALUES,
  MUSIC_PROVIDERS,
  ROUNDS_CONTENT_RATIO,
  ROUNDS_OPTIONS,
  shikimoriUserValidate,
} from './main-form.util';
import { SliderNum } from '../slider-num';
import * as Styled from './main-form.styles';
import { GeneratorModal } from '../generator-modal';
import { AppVersion } from '../app-version';
import { saveFile } from '../../core/save-file';
import { readFile } from '../../core/read-file';
import { CustomFields } from '../custom-fields';
import { logEvent } from 'firebase/analytics';
import { analytics, firestore } from '../../core/firebase';
import { addDoc, collection } from 'firebase/firestore';
import {
  FEEDBACK_MAX_LENGTH,
  FeedbackModal,
} from '../feedback-modal/feedback-modal.component';
import { getFromElectron } from '../../core/get-from-electron';
import { RoundsFillingOverview } from './components/rounds-filling-overview';

export const MainForm: FC = () => {
  const {
    control,
    watch,
    setValue,
    reset,
    getValues,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: DEFAULT_VALUES,
    reValidateMode: 'onBlur',
  });
  const [showGenerator, setShowGenerator] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showLogs, setShowLogs] = useState(false);

  useEffect(() => {
    logEvent(analytics, 'page_view', { page_path: 'main-form' });
  }, []);

  useEffect(() => {
    const handleError = (error: any) => {
      logEvent(analytics, 'exception', { description: error?.message, error });
    };
    window.addEventListener('error', handleError);
    return () => {
      window.removeEventListener('error', handleError);
    };
  }, []);

  useEffect(
    () =>
      window.electron.ipcRenderer.on('animegen', (args: any) => {
        if (!args?.type) return;
        if (args.type === 'gen-start') {
          setShowGenerator(true);
        }
      }),
    [],
  );

  const onSubmit: SubmitHandler<FormValues> = (data) => {
    setShowGenerator(true);
    window.electron.ipcRenderer.sendMessage('animegen', {
      task: 'start',
      options: data,
    });
    logEvent(analytics, 'generate_si', data);
  };

  const handleCloseGenerator = () => {
    setShowGenerator(false);
  };

  const handleSaveSettings = () => {
    const values = getValues();
    saveFile(JSON.stringify(values));
    logEvent(analytics, 'click_event', { button: 'save_settings' });
  };

  const handleLoadSettings: React.ChangeEventHandler<HTMLInputElement> = (
    event,
  ) => {
    if (event.target.files?.length > 0) {
      readFile(event.target.files[0]).then((json) => {
        try {
          reset(JSON.parse(json));
          event.target.value = '';
        } catch (error) {
          console.error(error);
        }
      });
    }
    logEvent(analytics, 'click_event', { button: 'load_settings' });
  };

  const handleOpenPacksFolder = () => {
    window.electron.ipcRenderer.sendMessage('open-location', {
      path: 'packs',
    });
  };

  const handleOpenPresetsFolder = () => {
    window.electron.ipcRenderer.sendMessage('open-location', {
      path: 'resources\\assets\\presets',
    });
  };

  const handleShowLogs = () => {
    setShowLogs(true);
  };

  const handleCloseLogs = () => {
    setShowLogs(false);
  };

  const handleShowFeedback = () => {
    setShowFeedback(true);
  };

  const handleCloseFeedback = () => {
    setShowFeedback(false);
  };

  const handleSubmitFeedback = (message: string) => {
    try {
      if (message.length > 3) {
        setShowFeedback(false);
        addDoc(collection(firestore, 'feedback'), {
          message: (message || '').substring(0, FEEDBACK_MAX_LENGTH),
          date: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmitLog = (message: string) => {
    try {
      setShowLogs(false);
      getFromElectron('get-logs').then((logText) =>
        addDoc(collection(firestore, 'logs'), {
          message: (message || '').substring(0, FEEDBACK_MAX_LENGTH),
          logFile: logText,
          date: new Date().toISOString(),
        }),
      );
    } catch (error) {
      console.error(error);
    }
  };

  const handleResetPreset = () => {
    setValue('preset', 'default');
    setValue('presetJson', null);
    setValue('presetFields', {});
  };

  const handleLoadPreset: React.ChangeEventHandler<HTMLInputElement> = (
    event,
  ) => {
    if (event.target.files?.length > 0) {
      readFile(event.target.files[0]).then((json) => {
        try {
          const preset = JSON.parse(json) as FormValues['presetJson'];
          setValue('presetJson', preset);
          setValue(
            'presetFields',
            (preset?.fieldsScheme || []).reduce(
              (acc, item) => ({
                ...acc,
                [item.name]: item.value ?? null,
              }),
              {},
            ),
          );
          setValue('preset', 'custom');
          event.target.value = '';
        } catch (error) {
          console.error(error);
        }
      });
    }
    logEvent(analytics, 'click_event', { button: 'load_preset' });
  };

  const selectedRounds = (watch('rounds') || []) as string[];
  const animeProvider = (watch('animeProvider') || 'shikimori') as string;
  const hasImagesRound = selectedRounds.some((item) =>
    ['screenshots', 'characters'].includes(item),
  );
  const hasAudioRound = selectedRounds.some((item) =>
    ['openings', 'endings'].includes(item),
  );
  const hasCharacterRound = selectedRounds.includes('characters');
  const selectedPreset = watch('preset');
  const presetScheme = watch('presetJson');
  const getUserValidator = (): ((
    value: string,
  ) => Promise<boolean | string>) => {
    if (animeProvider === 'mal') {
      return () => Promise.resolve(true);
    }
    return shikimoriUserValidate;
  };

  return (
    <Styled.MainForm onSubmit={handleSubmit(onSubmit)}>
      <GeneratorModal
        key={`modal_update_${showGenerator}`}
        open={showGenerator}
        onClose={handleCloseGenerator}
      />
      {showFeedback && (
        <FeedbackModal
          onSubmit={handleSubmitFeedback}
          onClose={handleCloseFeedback}
        />
      )}
      {showLogs && (
        <FeedbackModal
          title="Отчёт об ошибке"
          label="Подробное описание ошибки и что произошло"
          onSubmit={handleSubmitLog}
          onClose={handleCloseLogs}
        />
      )}
      <Grid
        sx={{
          padding: '10px',
          height: '100%',
        }}
        container
        flexDirection="column"
        wrap="nowrap"
        spacing={1}
      >
        {selectedPreset === 'custom' && presetScheme && (
          <Grid item>
            <FormLabel>Выбранный пресет</FormLabel>
            <Typography variant="h6">{presetScheme.name}</Typography>
          </Grid>
        )}

        {selectedPreset === 'default' && (
          <>
            <Grid item>
              <Controller
                name="name"
                control={control}
                rules={{
                  required: 'Имя пользователя обязательное поле!',
                  validate: getUserValidator(),
                }}
                render={({ field }) => (
                  <TextField
                    fullWidth
                    label="Имя"
                    error={Boolean(errors.name)}
                    helperText={errors.name?.message}
                    {...field}
                  />
                )}
              />
            </Grid>

            <Grid item>
              <Controller
                name="animeProvider"
                control={control}
                render={({ field }) => (
                  <FormControl>
                    <FormLabel id="anime-provider-group-label">
                      Провайдер аниме списка
                    </FormLabel>
                    <RadioGroup
                      aria-labelledby="anime-provider-group-label"
                      sx={{
                        display: 'flex',
                        flexDirection: 'row',
                        flexWrap: 'wrap',
                      }}
                      {...field}
                    >
                      {ANIME_PROVIDERS.map((item) => (
                        <FormControlLabel
                          key={item.value}
                          value={item.value}
                          control={<Radio />}
                          label={item.label}
                        />
                      ))}
                    </RadioGroup>
                  </FormControl>
                )}
              />
            </Grid>
          </>
        )}

        {selectedPreset === 'custom' && (
          <CustomFields
            control={control}
            prefix="presetFields"
            fields={presetScheme.fieldsScheme}
          />
        )}

        <Grid item>
          <Controller
            name="titleCounts"
            control={control}
            render={({ field }) => (
              <SliderNum
                label="Количество тайтлов"
                max={400}
                min={10}
                step={5}
                {...field}
              />
            )}
          />
        </Grid>

        {hasAudioRound && (
          <Grid item>
            <Controller
              name="concurrency"
              control={control}
              render={({ field }) => (
                <SliderNum
                  label="Количество одновременных задач обработки"
                  max={6}
                  min={1}
                  step={1}
                  {...field}
                />
              )}
            />
          </Grid>
        )}

        {hasImagesRound && (
          <Grid item>
            <Controller
              name="imageCompression"
              control={control}
              render={({ field }) => (
                <SliderNum
                  label="Качество изображения"
                  max={1}
                  min={0.1}
                  step={0.05}
                  {...field}
                />
              )}
            />
          </Grid>
        )}

        {hasAudioRound && (
          <Grid item>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <FormLabel>Найстройки аудио</FormLabel>
              </AccordionSummary>
              <AccordionDetails>
                <Grid item>
                  <Controller
                    name="musicProvider"
                    control={control}
                    render={({ field }) => (
                      <FormControl>
                        <FormLabel id="music-provider-group-label">
                          Провайдер музыки
                        </FormLabel>
                        <RadioGroup
                          aria-labelledby="music-provider-group-label"
                          sx={{
                            display: 'flex',
                            flexDirection: 'row',
                            flexWrap: 'wrap',
                          }}
                          {...field}
                        >
                          {MUSIC_PROVIDERS.map((item) => (
                            <FormControlLabel
                              key={item.value}
                              value={item.value}
                              control={<Radio />}
                              label={item.label}
                            />
                          ))}
                        </RadioGroup>
                      </FormControl>
                    )}
                  />
                </Grid>
                <Grid item>
                  <Controller
                    name="audioBitrate"
                    control={control}
                    render={({ field }) => (
                      <SliderNum
                        label="Аудио битрейт"
                        max={192}
                        min={60}
                        step={18}
                        unit="k"
                        {...field}
                      />
                    )}
                  />
                </Grid>
                <Grid item>
                  <Controller
                    name="musicLength"
                    control={control}
                    render={({ field }) => (
                      <SliderNum
                        label="Длительность аудио"
                        max={45}
                        min={5}
                        step={5}
                        unit="сек"
                        {...field}
                      />
                    )}
                  />
                </Grid>
                <Grid item>
                  <FormGroup>
                    <FormLabel id="demo-radio-buttons-group-label">
                      Дополнительные опции
                    </FormLabel>
                    <Controller
                      name="musicRandomStart"
                      control={control}
                      render={({ field }) => (
                        <FormControlLabel
                          control={
                            <Checkbox {...field} checked={field.value} />
                          }
                          label="Случайное время начала"
                        />
                      )}
                    />
                  </FormGroup>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Grid>
        )}

        <Grid item>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <FormLabel>Найстройки контента пакета</FormLabel>
            </AccordionSummary>
            <AccordionDetails>
              <Grid item>
                <Controller
                  name="rounds"
                  control={control}
                  rules={{
                    required: 'Должен быть выбран хотябы один раунд',
                  }}
                  render={({ field }) => (
                    <CheckboxSelect
                      label="Раунды"
                      options={ROUNDS_OPTIONS}
                      onBlur={field.onBlur}
                      onChange={field.onChange}
                      value={field.value}
                      error={Boolean(errors.rounds)}
                      helperText={errors.rounds?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item>
                <Controller
                  name="animeKinds"
                  control={control}
                  rules={{
                    required: 'Должен быть выбран хотябы один тип аниме',
                  }}
                  render={({ field }) => (
                    <CheckboxSelect
                      label="Типы аниме"
                      options={ANIME_TYPES_OPTIONS}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      value={field.value}
                      error={Boolean(errors.animeKinds)}
                      helperText={errors.animeKinds?.message}
                    />
                  )}
                />
              </Grid>
              {hasCharacterRound && (
                <Grid item>
                  <Controller
                    name="charactersRoles"
                    control={control}
                    render={({ field }) => (
                      <CheckboxSelect
                        label="Роли персонажей"
                        options={CHARACTER_ROLES_OPTIONS}
                        onChange={field.onChange}
                        value={field.value}
                      />
                    )}
                  />
                </Grid>
              )}
              <Grid item>
                <FormGroup>
                  <FormLabel id="demo-radio-buttons-group-label">
                    Дополнительные опции
                  </FormLabel>
                  <Controller
                    name="noRepeats"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={<Checkbox {...field} checked={field.value} />}
                        label="Убрать повторы из одной франшизы"
                      />
                    )}
                  />
                  <Controller
                    name="noRepeatsAtAll"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={<Checkbox {...field} checked={field.value} />}
                        label="Убрать повторы между раундами"
                      />
                    )}
                  />
                  <Controller
                    name="shuffleStrategy"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={<Checkbox {...field} checked={field.value} />}
                        label="Смешать вопросы"
                      />
                    )}
                  />
                </FormGroup>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>

        {selectedRounds.length > 0 && (
          <Grid item>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <FormLabel>Распределение контента в раундах</FormLabel>
              </AccordionSummary>
              <AccordionDetails>
                <Grid item>
                  <RoundsFillingOverview watch={watch} />
                </Grid>
                {ROUNDS_CONTENT_RATIO.filter(({ round }) =>
                  selectedRounds.includes(round),
                ).map((option) => (
                  <Grid item>
                    <Controller
                      name={option.name as any}
                      control={control}
                      render={({ field }) => (
                        <SliderNum
                          label={option.label}
                          max={1}
                          min={0.1}
                          step={0.05}
                          unit="ratio"
                          {...field}
                        />
                      )}
                    />
                  </Grid>
                ))}
              </AccordionDetails>
            </Accordion>
          </Grid>
        )}

        <Grid item>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <FormLabel>Действия</FormLabel>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container wrap="wrap" gap={1}>
                <Grid item>
                  <Button
                    type="button"
                    variant="contained"
                    onClick={handleSaveSettings}
                  >
                    Сохранить настройки
                  </Button>
                </Grid>
                <Grid item>
                  <Button component="label" variant="contained">
                    Загрузить настройки
                    <input
                      hidden
                      type="file"
                      accept=".json"
                      onChange={handleLoadSettings}
                    />
                  </Button>
                </Grid>
                <Grid item>
                  <Button component="label" variant="contained">
                    Загрузить пресет
                    <input
                      hidden
                      type="file"
                      accept=".json"
                      onChange={handleLoadPreset}
                    />
                  </Button>
                </Grid>
                {selectedPreset !== 'default' && (
                  <Grid item>
                    <Button
                      type="button"
                      variant="contained"
                      onClick={handleResetPreset}
                    >
                      Сбросить пресет
                    </Button>
                  </Grid>
                )}
                <Grid item>
                  <Button
                    type="button"
                    variant="contained"
                    onClick={handleOpenPacksFolder}
                  >
                    Открыть папку с паками
                  </Button>
                </Grid>
                <Grid item>
                  <Button
                    type="button"
                    variant="contained"
                    onClick={handleOpenPresetsFolder}
                  >
                    Открыть папку с пресетами
                  </Button>
                </Grid>
                <Grid item>
                  <Tooltip
                    placement="top"
                    title="Отправить ваш лог файл разработчику. Используйте эту опцию когда что-то ломает или не работает. Мне будет легче понять что именно пошло не так, если вы также оставите описание того что произошло."
                  >
                    <Button
                      type="button"
                      variant="contained"
                      onClick={handleShowLogs}
                    >
                      Отправить логи
                    </Button>
                  </Tooltip>
                </Grid>
                <Grid item>
                  <Tooltip
                    placement="top"
                    title="Отправить ваши предложения или отзыв разработчику. Можете описать что-бы вы хотели увидеть в следующих версиях, будем полезно если вы оставите также контакт для обратной связи (например дискорд)."
                  >
                    <Button
                      type="button"
                      variant="contained"
                      onClick={handleShowFeedback}
                    >
                      Отправить фидбэк
                    </Button>
                  </Tooltip>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>

        <Grid flex={1} />

        <AppVersion />

        <Grid item>
          <Button
            sx={{
              marginBottom: '10px',
            }}
            fullWidth
            type="submit"
            variant="contained"
          >
            Создать пакет
          </Button>
        </Grid>
      </Grid>
    </Styled.MainForm>
  );
};
