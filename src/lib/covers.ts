/* eslint-disable import/prefer-default-export */
const COVERS_BASE_URL = '/covers';

export const coverUrl = (coverImage: string | null | undefined): string | null =>
  coverImage ? `${COVERS_BASE_URL}/${coverImage}` : null;
