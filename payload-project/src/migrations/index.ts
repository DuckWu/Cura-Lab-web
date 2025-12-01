import * as migration_20251201_063221_initial from './20251201_063221_initial';

export const migrations = [
  {
    up: migration_20251201_063221_initial.up,
    down: migration_20251201_063221_initial.down,
    name: '20251201_063221_initial'
  },
];
