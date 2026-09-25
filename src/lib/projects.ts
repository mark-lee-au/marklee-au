import { getCollection, type CollectionEntry } from 'astro:content';
import { siteAdminConfig } from './site-admin';

export type Project = CollectionEntry<'projects'>;
export type ProjectCategory = Project['data']['category'];

export const projectStatusLabels: Record<Project['data']['status'], string> = {
  idea: 'PLANNED',
  prototype: 'PROTOTYPE',
  published: 'PUBLISHED',
  archived: 'ARCHIVED',
};

export function projectUrl(project: Project): string {
  return `/projects/${project.data.slug}/`;
}

export function projectBadge(project: Project): string {
  return siteAdminConfig.projects[project.data.slug]?.badge === 'updated'
    ? 'UPDATED'
    : projectStatusLabels[project.data.status];
}

export async function getProjects(): Promise<Project[]> {
  const projects = await getCollection('projects');
  return projects
    .filter((project) => siteAdminConfig.projects[project.data.slug]?.visible !== false)
    .map((project) => {
      const { visible: _visible, badge: _badge, ...changes } = siteAdminConfig.projects[project.data.slug] ?? {};
      return { ...project, data: { ...project.data, ...changes } } as Project;
    })
    .sort((a, b) => a.data.sortOrder - b.data.sortOrder || a.data.slug.localeCompare(b.data.slug));
}
