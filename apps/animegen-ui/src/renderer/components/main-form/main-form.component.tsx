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
  ROUNDS_OPTIONS,
  malUserValidate,
  shikimoriUserValidate,
} from './main-form.util';
import { SliderNum } from '../slider-num';
import * as Styled from './main-form.styles';
import { GeneratorModal } from '../generator-modal';
import { AppVersion } from '../app-version';

export const MainForm: FC = () => {
  const {
    control,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: DEFAULT_VALUES,
    reValidateMode: 'onBlur',
  });
  const [showGenerator, setShowGenerator] = useState(false);

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
    console.log(data);
    window.electron.ipcRenderer.sendMessage('animegen', {
      task: 'start',
      options: data,
    });
  };

  const handleCloseGenerator = () => {
    setShowGenerator(false);
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
  const getUserValidator = () => {
    if (animeProvider === 'mal') {
      return true;
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
        <Grid item>
          <Controller
            name="name"
            control={control}
            rules={{
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
                        control={<Checkbox {...field} />}
                        label="Убрать повторы из одной франшизы"
                      />
                    )}
                  />
                  <Controller
                    name="shuffleStrategy"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={<Checkbox {...field} />}
                        label="Смешать вопросы"
                      />
                    )}
                  />
                </FormGroup>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>

        <Grid flex={1} />

        <AppVersion />

        <Button
          sx={{
            marginTop: '10px',
            marginLeft: '10px',
          }}
          type="submit"
          variant="contained"
        >
          Создать пакет
        </Button>
      </Grid>
    </Styled.MainForm>
  );
};
