// Human-readable name and canonical URL for the SPDX identifiers used in content frontmatter.
const known: Record<string, { label: string; url: string }> = {
  'CC-BY-4.0': { label: 'CC BY 4.0', url: 'https://creativecommons.org/licenses/by/4.0/' },
  'CC-BY-SA-4.0': { label: 'CC BY-SA 4.0', url: 'https://creativecommons.org/licenses/by-sa/4.0/' },
  'CC-BY-ND-4.0': { label: 'CC BY-ND 4.0', url: 'https://creativecommons.org/licenses/by-nd/4.0/' },
  'CC0-1.0': { label: 'CC0 1.0', url: 'https://creativecommons.org/publicdomain/zero/1.0/' },
  MIT: { label: 'MIT', url: 'https://opensource.org/license/mit' },
};

export function describeLicense(spdx: string): { label: string; url?: string } {
  return known[spdx] ?? { label: spdx };
}
