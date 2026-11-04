/** The work the home page opens with: the one marked `featured`, else the first. */
export const pickFeatured = works => works.find(work => work.featured === true) ?? works[0] ?? null;

export function selectWorks(works, query = '') {
  const words = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return works.filter(work => {
    const searchable = [work.title, ...Object.values(work.subtitle), ...Object.values(work.summary), ...Object.values(work.category), ...work.tags, work.author.name, work.author.handle].join(' ').toLocaleLowerCase();
    return words.every(word => searchable.includes(word));
  });
}
