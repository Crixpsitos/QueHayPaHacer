/* eslint-disable */
import { useAuth } from "@/app/store/auth/AuthContext";
import { useEffect, useLayoutEffect, useRef } from "react";
import { useFormContext } from "react-hook-form";

interface RemoteDataSyncerProps {
  recordId: string | undefined;
  subscribeToChanges: (id: string, callback: (data: any) => void) => () => void;
}

export const FormRemoteDataSyncer = ({ recordId, subscribeToChanges }: RemoteDataSyncerProps) => {
  const { setValue, getValues, clearErrors } = useFormContext();
  const { user } = useAuth();

  const subscribeRef = useRef(subscribeToChanges);

  useLayoutEffect(() => {
    subscribeRef.current = subscribeToChanges;
  });

  useEffect(() => {
    if (!recordId || !user?.uid) return;

    const unsubscribe = subscribeRef.current(recordId, (remoteData) => {
        if (!remoteData) return;

        // remoteData.mainImage may be a string (legacy) or an object {url,path} or legacy object with status
      if (remoteData.mainImage) {
        if (typeof remoteData.mainImage === "string") {
          // legacy string: convert to object
          setValue("mainImage", { url: remoteData.mainImage, path: undefined, status: undefined, temporaryUrl: undefined }, {
            shouldValidate: true,
            shouldDirty: true,
          });
          clearErrors("mainImage");
        } else if (typeof remoteData.mainImage === "object") {
          // If object already contains a direct url (new shape), set it and merge status/temporaryUrl if present
          if (remoteData.mainImage.url) {
            setValue("mainImage", {
              url: remoteData.mainImage.url,
              path: remoteData.mainImage.path,
              status: (remoteData.mainImage as any).status ?? undefined,
              temporaryUrl: (remoteData.mainImage as any).temporaryUrl ?? undefined,
            }, {
              shouldValidate: true,
              shouldDirty: true,
            });
            clearErrors("mainImage");
          }

          // legacy shape: merge status and temporaryUrl into mainImage object
          if ((remoteData.mainImage as any).status || (remoteData.mainImage as any).temporaryUrl) {
            const existing = getValues("mainImage") || {};
            setValue("mainImage", {
              ...(existing as any),
              status: (remoteData.mainImage as any).status ?? (existing as any).status,
              temporaryUrl: (remoteData.mainImage as any).temporaryUrl ?? (existing as any).temporaryUrl,
              desktop: (remoteData.mainImage as any).desktop ?? (existing as any).desktop,
            }, {
              shouldValidate: false,
              shouldDirty: true,
            });
          }

          if ((remoteData.mainImage as any).status === "ready" && (remoteData.mainImage as any).desktop?.url) {
            setValue("mainImage", {
              url: (remoteData.mainImage as any).desktop.url,
              path: (remoteData.mainImage as any).path,
              status: "ready",
            }, {
              shouldValidate: true,
              shouldDirty: true,
            });
            clearErrors("mainImage");
          }

          if ((remoteData.mainImage as any).status === "error") {
            // set error state inside mainImage object
            const existing = getValues("mainImage") || {};
            setValue("mainImage", {
              ...(existing as any),
              status: "error",
            }, {
              shouldValidate: true,
              shouldDirty: true,
            });
          }
        }
      }

      if (remoteData.media) {
        const currentMedia = getValues("media") || [];

        const updatedMedia = currentMedia.map((localItem: any) => {
          if (localItem.data?.status !== "processing") return localItem;

          const remoteItem = remoteData.media.find((r: any) => r.id === localItem.id);

          if (remoteItem?.data?.status === "ready" || remoteItem?.data?.status === "error") {
            return remoteItem;
          }

          return localItem;
        });

        setValue("media", updatedMedia);
      }
    });

    return () => unsubscribe();
  }, [recordId, user?.uid, setValue, getValues, clearErrors]);

  return null;
};