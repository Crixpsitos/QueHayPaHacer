import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import {  CtaNavigateEntity, CtaExternalLinkEntity } from "../types";

export const clientCtaRegistry = (context: { router: AppRouterInstance }) => ({
  navigate: (entity: CtaNavigateEntity) => {
    const url = new URL(
      `/${entity.resource}/${entity.path}`,
      window.location.origin,
    );

    Object.entries(entity.params ?? {}).forEach(([key, value]) => {
      url.searchParams.set(key, String(value));
    });

    context.router.push(`${url.pathname}${url.search}`);
  },
  external_link: (entity: CtaExternalLinkEntity) => {
    window.open(entity.path, entity.target, entity.rel);
  },
});
