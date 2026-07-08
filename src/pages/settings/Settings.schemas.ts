import { z } from 'zod';

import type { useAppTranslation } from '@hooks/shared';

type TranslateFn = ReturnType<typeof useAppTranslation>['t'];

export const buildLocationFormSchema = (t: TranslateFn) =>
  z.object({
    code: z
      .string()
      .trim()
      .min(1, t('validation.codeRequired'))
      .max(40, t('validation.codeMax')),
    name: z
      .string()
      .trim()
      .min(1, t('validation.nameRequired'))
      .max(60, t('validation.nameMax')),
    description: z
      .string()
      .trim()
      .max(200, t('validation.descriptionMax'))
      .optional()
      .or(z.literal('')),
  });

export type LocationFormValues = z.infer<ReturnType<typeof buildLocationFormSchema>>;

export const buildCameraFormSchema = (t: TranslateFn) =>
  z.object({
    name: z
      .string()
      .trim()
      .min(1, t('validation.nameRequired'))
      .max(60, t('validation.nameMax')),
    locationId: z.string().min(1, t('validation.locationRequired')),
  });

export type CameraFormValues = z.infer<ReturnType<typeof buildCameraFormSchema>>;
