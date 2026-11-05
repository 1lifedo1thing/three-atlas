// Terrain and scatter generation off the main thread.
import { buildTile } from './tiles.js';
import { scatterCell, scatterGrass } from './scatter.js';
import { runJob } from './jobs.js';

self.onmessage = ({ data }) => {
  const { result, transfer } = runJob(data, { buildTile, scatterCell, scatterGrass });
  self.postMessage(result, transfer);
};
