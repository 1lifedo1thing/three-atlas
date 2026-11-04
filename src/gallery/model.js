export function selectWorks(works, query = '') {
  const words = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return works.filter(work => {
    const searchable = [work.title, ...Object.values(work.subtitle), ...Object.values(work.summary), ...Object.values(work.category), ...work.tags, work.author.name, work.author.handle].join(' ').toLocaleLowerCase();
    return words.every(word => searchable.includes(word));
  });
}
