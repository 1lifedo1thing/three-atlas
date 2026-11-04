import { execFileSync } from 'node:child_process';
import { mkdirSync, statSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const [id, input, startText = '0'] = process.argv.slice(2);
const start = Number(startText);
if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id ?? '') || !input || !Number.isFinite(start) || start < 0) {
  throw new Error('用法：node scripts/encode-preview.mjs <id> <原片路径> [起点秒数]；原片在起点后至少保留 10.6 秒。');
}
const metadata = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_format', '-of', 'json', input], { encoding: 'utf8' }));
if (Number(metadata.format.duration) < start + 10.6) throw new Error('原片不足 10.6 秒，无法制作 10 秒无缝循环。');
mkdirSync('public/media', { recursive: true });
const results = [];
for (const width of [1920, 960]) {
  const height = width * 5 / 8;
  const filter = `[0:v]fps=30,scale=${width}:${height}:flags=lanczos,split=2[a][b];[a]trim=start=0.6:end=10.6,setpts=PTS-STARTPTS[main];[b]trim=start=0:end=0.6,setpts=PTS-STARTPTS[head];[main][head]xfade=transition=fade:duration=0.6:offset=9.4,format=yuv420p[out]`;
  for (const extension of ['mp4', 'webm']) {
    const output = resolve(`public/media/${id}-${width}.${extension}`);
    const encoding = extension === 'mp4'
      ? ['-c:v', 'libx264', '-preset', 'slow', '-crf', '23', '-movflags', '+faststart']
      : ['-c:v', 'libvpx-vp9', '-crf', '34', '-b:v', '0', '-row-mt', '1', '-cpu-used', '2'];
    execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-ss', String(start), '-t', '10.6', '-i', input, '-filter_complex', filter, '-map', '[out]', '-an', ...encoding, '-t', '10', '-threads', '4', output], { stdio: 'inherit' });
    const bytes = statSync(output).size;
    const limit = width === 1920 ? 4_000_000 : 1_200_000;
    if (bytes > limit) throw new Error(`${width} ${extension} 超出体积预算：${bytes} > ${limit}`);
    results.push({ file: `${id}-${width}.${extension}`, width, height, bytes, duration: 10 });
    console.log(`${id}-${width}.${extension}：${bytes} bytes`);
  }
}
writeFileSync(`public/media/${id}-preview.json`, JSON.stringify({ duration: 10, crossfade: 0.6, outputs: results }, null, 2) + '\n');
