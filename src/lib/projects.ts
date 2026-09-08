import { getCollection, type CollectionEntry } from 'astro:content';

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

export async function getProjects() {
  const projects = await getCollection('projects');
  return projects.sort((a, b) =>
    a.data.sortOrder - b.data.sortOrder || a.data.slug.localeCompare(b.data.slug)
  );
}
