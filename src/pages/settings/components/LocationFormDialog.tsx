import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button, Dialog } from '@components/ui';
import { Conditional } from '@components/utils';
import { LoadingButton } from '@components/shared';
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

    const onSuccess = (created: LocationForReadDto) => {
      toast({
        title: t(isEdit ? 'locations.toast.updated' : 'locations.toast.created', { name: created.name }),
        variant: 'success',
      });
      onClose();
    };

    const onError = (error: unknown) => {
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
      updateMutation.mutate({ id: location.id, payload }, { onSuccess, onError });
    } else {
      createMutation.mutate(payload, { onSuccess, onError });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Conditional.If condition={open}>
        <Dialog.Panel className="max-w-md">
          <Dialog.Header>
            <Dialog.Title>
              <Conditional>
                <Conditional.If condition={isEdit}>{t('locations.form.editTitle')}</Conditional.If>
                <Conditional.Else>{t('locations.form.createTitle')}</Conditional.Else>
              </Conditional>
            </Dialog.Title>
          </Dialog.Header>

          <FormContainer formContext={formContext} onSuccess={handleSubmit} className="flex flex-col gap-4">
            <Dialog.Content className="flex flex-col gap-4">
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
            </Dialog.Content>

            <Dialog.Footer className="flex justify-end gap-2">
              <Button type="button" variant="outline-muted" onClick={onClose} disabled={isPending}>
                {t('locations.form.cancel')}
              </Button>

              <LoadingButton type="submit" variant="default" loading={isPending}>
                {isEdit ? t('locations.form.submitEdit') : t('locations.form.submitCreate')}
              </LoadingButton>
            </Dialog.Footer>
          </FormContainer>
        </Dialog.Panel>
      </Conditional.If>
    </Dialog>
  );
}

export default LocationFormDialog;
