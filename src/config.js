// Game Configuration Constants
export const CONFIG = {
  WIDTH: 960,
  HEIGHT: 540,
  GRAVITY_Y: 650,
  BASE_SPEED: 320,
  MAX_SPEED: 700,
  SPEED_ACCEL: 3.5, // speed increase per second
  FLOOR_HEIGHT: 64,
  CEILING_HEIGHT: 64,
  PLAYER: {
    X: 180,
    WIDTH: 44,
    HEIGHT: 58,
    BOUNCE: 0,
    FLIP_IMPULSE: 180 // slight initial vertical impulse on flip for responsive snap
  },
  OBSTACLES: {
    SPAWN_INTERVAL_MIN: 900,
    SPAWN_INTERVAL_MAX: 1700,
    SHURIKEN_ROTATION_SPEED: 12
  },
  SCROLLS: {
    SPAWN_INTERVAL_MIN: 1200,
    SPAWN_INTERVAL_MAX: 2200,
    VALUE: 100
  }
};
