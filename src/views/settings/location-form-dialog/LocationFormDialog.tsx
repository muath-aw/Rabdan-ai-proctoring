import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Conditional } from '@components/utils';
import { PrimeDialog } from '@components/shared';
import { FormContainer, FormInput, FormTextarea } from '@components/forms';

import { useAppTranslation, useToast } from '@hooks/shared';
import { useCreateLocationMutation, useUpdateLocationMutation } from '@hooks/mutations';

import { DuplicateLocationCodeError, DuplicateLocationNameError } from '@api/handlers';

import type { LocationForReadDto } from '@app-types';

import { buildLocationFormSchema, type LocationFormValues } from '../Settings.schemas';

type LocationFormDialogProps = {
  open: boolean;
  location: LocationForReadDto | null;
  onClose: () => void;
};

const EMPTY_VALUES: LocationFormValues = { code: '', name: '', description: '' };

function LocationFormDialog({ open, location, onClose }: LocationFormDialogProps) {
  const { t } = useAppTranslation('settings');
  const { toast } = useToast();

  const isEdit = !!location;

  const createMutation = useCreateLocationMutation();
  const updateMutation = useUpdateLocationMutation();

  const isPending = createMutation.isLoading || updateMutation.isLoading;

  const formContext = useForm<LocationFormValues>({
    resolver: zodResolver(buildLocationFormSchema(t)),
    defaultValues: EMPTY_VALUES,
    mode: 'onSubmit',
  });

  useEffect(() => {
    if (!open) return;

    formContext.reset(
      location
        ? { code: location.code, name: location.name, description: location.description ?? '' }
        : EMPTY_VALUES,
    );
    // Only re-run when the dialog opens or the target location changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, location?.id]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && !isPending) onClose();
  };

  const handleSubmit = (values: LocationFormValues) => {
    const payload = {
      code: values.code,
      name: values.name,
      description: values.description?.trim() ? values.description : null,
    };

    const handleSuccess = (created: LocationForReadDto) => {
      toast({
        title: t(isEdit ? 'locations.toast.updated' : 'locations.toast.created', { name: created.name }),
        variant: 'success',
      });
      onClose();
    };

    const handleError = (error: unknown) => {
      if (error instanceof DuplicateLocationCodeError) {
        formContext.setError('code', { message: t('locations.toast.duplicateCode') });
        return;
      }
      if (error instanceof DuplicateLocationNameError) {
        formContext.setError('name', { message: t('locations.toast.duplicateName') });
        return;
      }
      toast({ title: t('locations.toast.genericError'), variant: 'destructive' });
    };

    if (isEdit && location) {
      updateMutation.mutate({ id: location.id, payload }, { onSuccess: handleSuccess, onError: handleError });
    } else {
      createMutation.mutate(payload, { onSuccess: handleSuccess, onError: handleError });
    }
  };

  return (
    <PrimeDialog open={open} onOpenChange={handleOpenChange} isLoading={isPending}>
      <PrimeDialog.Panel>
        <PrimeDialog.Header>
          <PrimeDialog.Title>
            <Conditional>
              <Conditional.If condition={isEdit}>{t('locations.form.editTitle')}</Conditional.If>
              <Conditional.Else>{t('locations.form.createTitle')}</Conditional.Else>
            </Conditional>
          </PrimeDialog.Title>
        </PrimeDialog.Header>

        <FormContainer formContext={formContext} onSuccess={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <PrimeDialog.Content className="flex flex-col gap-4">
            <FormInput
              name="name"
              label={t('locations.form.nameLabel')}
              placeholder={t('locations.form.namePlaceholder')}
              required
              autoFocus
              disabled={isPending}
            />

            <FormInput
              name="code"
              label={t('locations.form.codeLabel')}
              placeholder={t('locations.form.codePlaceholder')}
              required
              disabled={isPending}
              className="font-mono"
              aria-describedby="location-code-help"
            />

            <p id="location-code-help" className="text-muted-foreground -mt-2 text-xs">
              {t('locations.form.codeHelp')}
            </p>

            <FormTextarea
              name="description"
              label={t('locations.form.descriptionLabel')}
              placeholder={t('locations.form.descriptionPlaceholder')}
              rows={3}
              disabled={isPending}
            />
          </PrimeDialog.Content>

          <PrimeDialog.Actions
            primaryButtonProps={{ children: isEdit ? t('locations.form.submitEdit') : t('locations.form.submitCreate') }}
            secondaryButtonProps={{ children: t('locations.form.cancel'), disabled: isPending }}
          />
        </FormContainer>
      </PrimeDialog.Panel>
    </PrimeDialog>
  );
}

export default LocationFormDialog;
