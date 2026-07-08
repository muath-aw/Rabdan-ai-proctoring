import type { CameraForCreateDto, CameraForReadDto, CameraForUpdateDto } from '@app-types';

import { createLocalStorageStore, generateId, simulateLatency } from './localStorageStore';

const STORAGE_KEY = 'rabdan.settings.cameras.v1';
const store = createLocalStorageStore<CameraForReadDto>(STORAGE_KEY);

const normalizeName = (name: string) => name.trim().toLowerCase();

class DuplicateCameraNameError extends Error {
  constructor() {
    super('DUPLICATE_CAMERA_NAME');
    this.name = 'DuplicateCameraNameError';
  }
}

class CameraNotFoundError extends Error {
  constructor() {
    super('CAMERA_NOT_FOUND');
    this.name = 'CameraNotFoundError';
  }
}

async function getCameraList(): Promise<CameraForReadDto[]> {
  const items = store.read().slice().sort((a, b) => a.name.localeCompare(b.name));
  return simulateLatency(items);
}

async function createCamera(payload: CameraForCreateDto): Promise<CameraForReadDto> {
  const items = store.read();
  const nameKey = normalizeName(payload.name);
  if (items.some((item) => item.locationId === payload.locationId && normalizeName(item.name) === nameKey)) {
    throw new DuplicateCameraNameError();
  }

  const created: CameraForReadDto = {
    id: generateId('cam'),
    name: payload.name.trim(),
    locationId: payload.locationId,
    createdAt: new Date().toISOString(),
  };
  store.write([...items, created]);

  return simulateLatency(created);
}

async function updateCamera(id: string, payload: CameraForUpdateDto): Promise<CameraForReadDto> {
  const items = store.read();
  const current = items.find((item) => item.id === id);
  if (!current) throw new CameraNotFoundError();

  const nameKey = normalizeName(payload.name);
  if (items.some((item) => item.id !== id && item.locationId === payload.locationId && normalizeName(item.name) === nameKey)) {
    throw new DuplicateCameraNameError();
  }

  const updated: CameraForReadDto = {
    ...current,
    name: payload.name.trim(),
    locationId: payload.locationId,
  };
  store.write(items.map((item) => (item.id === id ? updated : item)));

  return simulateLatency(updated);
}

async function deleteCamera(id: string): Promise<{ id: string }> {
  const items = store.read();
  if (!items.some((item) => item.id === id)) throw new CameraNotFoundError();

  store.write(items.filter((item) => item.id !== id));
  return simulateLatency({ id });
}

/** Returns cameras that reference the given location (used to block location deletion). */
async function getCamerasByLocation(locationId: string): Promise<CameraForReadDto[]> {
  return simulateLatency(store.read().filter((item) => item.locationId === locationId));
}

export const camerasHandler = {
  getList: {
    queryKey: 'settings/cameras/list',
    request: getCameraList,
  },
  getByLocation: {
    queryKey: 'settings/cameras/by-location',
    request: getCamerasByLocation,
  },
  create: {
    request: createCamera,
  },
  update: {
    request: updateCamera,
  },
  delete: {
    request: deleteCamera,
  },
} as const;

export { DuplicateCameraNameError, CameraNotFoundError };
