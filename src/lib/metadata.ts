export function pageHead(title: string, description: string) {
  return { meta: [
    { title: `${title} | Balay NORSU` },
    { name: 'description', content: description },
    { property: 'og:title', content: `${title} | Balay NORSU` },
    { property: 'og:description', content: description },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }
}