import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button, Dialog } from '@components/ui';
import { Conditional } from '@components/utils';
import { LoadingButton } from '@components/shared';
import { FormContainer, FormInput, FormSelect } from '@components/forms';

import { useAppTranslation, useToast } from '@hooks/shared';
import { useCreateCameraMutation, useUpdateCameraMutation } from '@hooks/mutations';

import { DuplicateCameraNameError } from '@api/handlers';

import type { CameraForReadDto, LocationForReadDto } from '@app-types';

import { buildCameraFormSchema, type CameraFormValues } from '../Settings.schemas';

type CameraFormDialogProps = {
  open: boolean;
  camera: CameraForReadDto | null;
  locations: LocationForReadDto[];
  onClose: () => void;
};

const EMPTY_VALUES: CameraFormValues = { name: '', locationId: '' };

function CameraFormDialog({ open, camera, locations, onClose }: CameraFormDialogProps) {
  const { t } = useAppTranslation('settings');
  const { toast } = useToast();

  const isEdit = !!camera;

  const createMutation = useCreateCameraMutation();
  const updateMutation = useUpdateCameraMutation();

  const isPending = createMutation.isLoading || updateMutation.isLoading;

  const formContext = useForm<CameraFormValues>({
    resolver: zodResolver(buildCameraFormSchema(t)),
    defaultValues: EMPTY_VALUES,
    mode: 'onSubmit',
  });

  useEffect(() => {
    if (!open) return;

    formContext.reset(
      camera
        ? { name: camera.name, locationId: camera.locationId }
        : { ...EMPTY_VALUES, locationId: locations[0]?.id ?? '' },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, camera?.id]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && !isPending) onClose();
  };

  const handleSubmit = (values: CameraFormValues) => {
    const onSuccess = (created: CameraForReadDto) => {
      toast({
        title: t(isEdit ? 'cameras.toast.updated' : 'cameras.toast.created', { name: created.name }),
        variant: 'success',
      });
      onClose();
    };

    const onError = (error: unknown) => {
      if (error instanceof DuplicateCameraNameError) {
        formContext.setError('name', { message: t('cameras.toast.duplicateName') });
        return;
      }
      toast({ title: t('cameras.toast.genericError'), variant: 'destructive' });
    };

    if (isEdit && camera) {
      updateMutation.mutate({ id: camera.id, payload: values }, { onSuccess, onError });
    } else {
      createMutation.mutate(values, { onSuccess, onError });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Conditional.If condition={open}>
        <Dialog.Panel className="max-w-md">
          <Dialog.Header>
            <Dialog.Title>
              <Conditional>
                <Conditional.If condition={isEdit}>{t('cameras.form.editTitle')}</Conditional.If>
                <Conditional.Else>{t('cameras.form.createTitle')}</Conditional.Else>
              </Conditional>
            </Dialog.Title>
          </Dialog.Header>

          <FormContainer formContext={formContext} onSuccess={handleSubmit} className="flex flex-col gap-4">
            <Dialog.Content className="flex flex-col gap-4">
              <FormInput
                name="name"
                label={t('cameras.form.nameLabel')}
                placeholder={t('cameras.form.namePlaceholder')}
                required
                autoFocus
                disabled={isPending}
              />

              <FormSelect<CameraFormValues, LocationForReadDto>
                name="locationId"
                control={formContext.control}
                label={t('cameras.form.locationLabel')}
                placeholder={t('cameras.form.locationPlaceholder')}
                required
                options={locations}
                noOptionsText={t('cameras.form.noLocations')}
                getOptionLabel={(option) => option.name}
                getOptionValue={(option) => option.id}
                disabled={isPending || locations.length === 0}
                clearable={false}
              />
            </Dialog.Content>

            <Dialog.Footer className="flex justify-end gap-2">
              <Button type="button" variant="outline-muted" onClick={onClose} disabled={isPending}>
                {t('cameras.form.cancel')}
              </Button>

              <LoadingButton type="submit" variant="default" loading={isPending} disabled={locations.length === 0}>
                {isEdit ? t('cameras.form.submitEdit') : t('cameras.form.submitCreate')}
              </LoadingButton>
            </Dialog.Footer>
          </FormContainer>
        </Dialog.Panel>
      </Conditional.If>
    </Dialog>
  );
}

export default CameraFormDialog;
