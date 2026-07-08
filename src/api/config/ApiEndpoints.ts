export const ApiEndpoints = {
  DOCTORS: {
    INDEX: '/doctors',
    DETAILS: '/doctors/:doctorId/details',
  },
  SETTINGS: {
    LOCATIONS: {
      INDEX: '/settings/locations',
      DETAILS: '/settings/locations/:locationId',
    },
    CAMERAS: {
      INDEX: '/settings/cameras',
      DETAILS: '/settings/cameras/:cameraId',
    },
  },
} as const;
