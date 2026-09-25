import rawConfig from '../data/site-admin.json';

export type SiteCategory = 'data' | 'maps' | 'games' | 'lab';
export type SiteStatus = 'idea' | 'prototype' | 'published' | 'archived';
export type SiteSection = 'home' | SiteCategory | 'photography' | 'about';
export type ProjectOverride = {
  category?: SiteCategory;
  status?: SiteStatus;
  featured?: boolean;
  visible?: boolean;
  sortOrder?: number;
  badge?: 'default' | 'updated';
};
export type SiteAdminConfig = {
  version: 1;
  projects: Record<string, ProjectOverride>;
  sectionOrder: SiteSection[];
  examples: Record<'home' | SiteCategory, string[]>;
};

// Committed editorial settings are applied during the static Astro build.
// No credentials, sessions, unpublished puzzle answers, or private analytics belong here.
export const siteAdminConfig = rawConfig as SiteAdminConfig;
