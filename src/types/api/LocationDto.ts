export type LocationForReadDto = {
  id: string;
  /** Stable join key matched against the identifier sent by the SIS for this room. Admin-entered, unique. */
  code: string;
  name: string;
  description: string | null;
  createdAt: string;
};

export type LocationForCreateDto = {
  code: string;
  name: string;
  description?: string | null;
};

export type LocationForUpdateDto = LocationForCreateDto;
