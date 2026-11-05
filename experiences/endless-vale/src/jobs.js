// One job format for the worker and the main-thread fallback.
export function runJob(job, { buildTile, scatterCell, scatterGrass }) {
  if (job.kind === 'tile') {
    const tile = buildTile(job.x0, job.z0, job.size, job.res);
    const transfer = [tile.position.buffer, tile.normal.buffer, tile.color.buffer];
    if (tile.water) transfer.push(tile.water.position.buffer, tile.water.depth.buffer, tile.water.index.buffer);
    return { result: { id: job.id, kind: job.kind, tile }, transfer };
  }
  if (job.kind === 'cell') {
    const props = scatterCell(job.cx, job.cz);
    const transfer = Object.values(props).flatMap(p => [p.matrices.buffer, p.colors.buffer]);
    return { result: { id: job.id, kind: job.kind, props }, transfer };
  }
  const grass = scatterGrass(job.cx, job.cz, job.density);
  return { result: { id: job.id, kind: job.kind, grass }, transfer: [grass.buffer] };
}
