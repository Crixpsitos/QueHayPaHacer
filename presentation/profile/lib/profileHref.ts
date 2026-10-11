interface ProfileLinkableAuthor {
  id: string;
  displayName?: string;
}

export const buildProfileHref = (author: ProfileLinkableAuthor): string => {
  // Por uid: los snapshots de autor guardan el displayName del momento, que puede
  // no ser el username vigente (o tener espacios) → 404. El uid siempre resuelve.
  // ponytail: URL con uid; cambiar a username cuando los snapshots lo guarden actualizado.
  return `/profile/${encodeURIComponent(author.id)}`;
};
