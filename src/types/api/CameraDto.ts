export type CameraForReadDto = {
  id: string;
  name: string;
  locationId: string;
  createdAt: string;
};

export type CameraForCreateDto = {
  name: string;
  locationId: string;
};

export type CameraForUpdateDto = CameraForCreateDto;
