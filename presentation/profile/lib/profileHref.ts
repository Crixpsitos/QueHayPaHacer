interface ProfileLinkableAuthor {
  id: string;
  displayName?: string;
}

export const buildProfileHref = (author: ProfileLinkableAuthor): string => {
  const handle = author.displayName?.trim() || author.id;
  return `/profile/${encodeURIComponent(handle)}`;
};
