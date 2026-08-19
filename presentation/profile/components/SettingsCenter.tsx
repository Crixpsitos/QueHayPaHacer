"use client";

import { Button } from "@/app/components/ui/button";
import { Switch } from "@/app/components/ui/switch";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/app/components/ui/drawer";
import {
  AtSign,
  ChevronDown,
  ChevronLeft,
  Settings,
  X,
  Trash2,
  Lock,
  Briefcase,
  User,
  Camera,
  AlertTriangle,
  Globe,
  EyeOff,
  Award,
  Landmark,
  Loader2,
  Plus,
  ShieldCheck,
  // Bell, // reactivar junto con la sección de Notificaciones
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { AlertCircle, CheckCircle } from "lucide-react";
import { ProfileAvatar } from "./ProfileAvatar";
import { useProfileConfigStore } from "@/app/store/profile/profileConfig.store";
import { useMediaQuery } from "@/app/lib/hooks/useMediaQuery";
import { useAuth } from "@/app/store/auth/AuthContext";
import { updateProfileAction } from "@/app/actions/profile/update-profile.action";
import { checkUsernameAvailabilityAction } from "@/app/actions/professional/check-username-availability.action";
import { generateUsername } from "@/app/lib/utils/generateUsername";
import { cn } from "@/app/lib/utils/cn";
import type { SocialLinkEntry } from "@/domain/entities/user/User";
import { updateProfileVisibilityAction } from "@/app/actions/profile/update-profile-visibility.action";
import { updateAvatarAction } from "@/app/actions/profile/update-avatar.action";
import { changePasswordAction } from "@/app/actions/auth/change-password.action";
import { deleteAccountAction } from "@/app/actions/auth/delete-account.action";
import { uploadToGoogleStorage } from "@/presentation/events/lib/upload/uploadToGoogleStorage";
import { notify } from "@/presentation/shared/lib/notify";
import { ProfessionalRequestSection } from "./professional/ProfessionalRequestSection";
import type { OrganizerDetails, BusinessDetails, GovernmentDetails } from "@/domain/entities/professional/ProfessionalRequest";
import { BUSINESS_CATEGORY_LABEL, isProfessionalType, PROFESSIONAL_TYPE_LABEL } from "../lib/professionalType";

type selectedSectionSetting =
  | "main"
  | "edit-profile"
  | "change-password"
  | "professional"
  | "delete";

const SOCIAL_PLATFORMS = [
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "tiktok", label: "TikTok" },
  { value: "youtube", label: "YouTube" },
  { value: "twitter", label: "X / Twitter" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "other", label: "Otro enlace" },
] as const;

const PLATFORM_LABEL: Record<string, string> = Object.fromEntries(
  SOCIAL_PLATFORMS.map((p) => [p.value, p.label]),
);

interface UserData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  bio: string;
  username: string;
  isUsernameCustomized: boolean;
  avatarUrl: string;
  imagePath: string;
  isProfessional: boolean;
  website: string;
  mapsLink: string;
  socialLinks: SocialLinkEntry[];
  professionalDescription: string;
  brandName: string;
  // Campos editables exclusivos de cuentas gobierno
  governmentDepartment: string;
  governmentEmail: string;
  governmentPhone: string;
  governmentNit: string;
  // Campos editables exclusivos de cuentas negocio
  businessNit: string;
  businessPhone: string;
}

const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024;

const getSectionTitle = (section: selectedSectionSetting) => {
  switch (section) {
    case "main":
      return "General";
    case "edit-profile":
      return "Editar perfil";
    case "change-password":
      return "Cambiar contraseña";
    case "professional":
      return "Perfil profesional";
    case "delete":
      return "Eliminar cuenta";
    default:
      return "General";
  }
};

export const SettingsCenter = ({ hideTrigger = false }: { hideTrigger?: boolean } = {}) => {
  const { user, refreshUser } = useAuth();
  const { openSettings, onOpenSettings, selectedSectionSetting, onSelectSectionSetting } = useProfileConfigStore();
  const closeResetTimeoutRef = useRef<number | null>(null);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  // const [categoryNotifications, setCategoryNotifications] = useState(true); // reactivar con la sección de Notificaciones
  const [isPublic, setIsPublic] = useState(true);
  const [isProfessional, setIsProfessional] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUpdatingVisibility, setIsUpdatingVisibility] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const isMobile = useMediaQuery("(max-width: 640px)");
  const drawerDirection = isMobile ? "bottom" : "right";
  const drawerContentClassName = isMobile
    ? "h-dvh max-h-dvh !p-0 before:inset-0 before:rounded-none"
    : "h-dvh max-h-dvh w-full sm:w-[480px] sm:max-w-[480px] !p-0 before:inset-0 before:rounded-none before:border-y-0 before:border-r-0 before:border-l";

  useEffect(() => {
    return () => {
      if (closeResetTimeoutRef.current !== null) {
        window.clearTimeout(closeResetTimeoutRef.current);
      }
    };
  }, []);

  // Form states
  const [editedUser, setEditedUser] = useState<UserData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    bio: "",
    username: "",
    isUsernameCustomized: false,
    avatarUrl: "",
    imagePath: "",
    isProfessional: false,
    website: "",
    mapsLink: "",
    socialLinks: [],
    professionalDescription: "",
    brandName: "",
    governmentDepartment: "",
    governmentEmail: "",
    governmentPhone: "",
    governmentNit: "",
    businessNit: "",
    businessPhone: "",
  });
  const [initialProfileData, setInitialProfileData] = useState<UserData | null>(null);

  const getUserDataFromAuth = useCallback((): UserData => {
    const emptySocialLinks: SocialLinkEntry[] = [];
    if (!user) {
      return {
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        bio: "",
        username: "",
        isUsernameCustomized: false,
        avatarUrl: "",
        imagePath: "",
        isProfessional: false,
        website: "",
        mapsLink: "",
        socialLinks: emptySocialLinks,
        professionalDescription: "",
        brandName: "",
        governmentDepartment: "",
        governmentEmail: "",
        governmentPhone: "",
        governmentNit: "",
        businessNit: "",
        businessPhone: "",
      };
    }
    const fullName = user.displayName ?? "";
    const [first = "", ...rest] = fullName.split(" ");
    const last = rest.join(" ");

    // Backward compat: convert legacy single socialLink to socialLinks array
    const rawSocialLinks = user.profile?.socialLinks as SocialLinkEntry[] | undefined;
    const legacySocialLink = user.profile?.socialLink as string | undefined;
    const resolvedSocialLinks: SocialLinkEntry[] =
      rawSocialLinks?.length
        ? rawSocialLinks
        : legacySocialLink
          ? [{ platform: "other" as const, url: legacySocialLink }]
          : [];

    return {
      firstName: user.profile?.firstName ?? first,
      lastName: user.profile?.lastName ?? last,
      email: user.email ?? "",
      phone: user.phoneNumber ?? user.profile?.phoneNumber ?? "",
      bio: user.profile?.bio ?? "",
      username: user.profile?.username ?? fullName.toLowerCase().replace(/\s+/g, "") ?? "",
      isUsernameCustomized: (user.profile?.isUsernameCustomized as boolean | undefined) ?? false,
      avatarUrl: user.profile?.photoURL ?? user.photoURL ?? "",
      imagePath: user.profile?.imagePath ?? "",
      isProfessional: user.profile?.accountType === "professional",
      website: user.profile?.website ?? "",
      mapsLink: (user.profile?.mapsLink as string | undefined) ?? "",
      socialLinks: resolvedSocialLinks,
      professionalDescription: user.profile?.professionalDescription ?? "",
      brandName: user.profile?.brandName ?? "",
      governmentDepartment: user.profile?.professionalType === "government"
        ? ((user.profile?.professionalDetails as GovernmentDetails | undefined)?.department ?? "")
        : "",
      governmentEmail: user.profile?.professionalType === "government"
        ? ((user.profile?.professionalDetails as GovernmentDetails | undefined)?.institutionalEmail ?? "")
        : "",
      governmentPhone: user.profile?.professionalType === "government"
        ? ((user.profile?.professionalDetails as GovernmentDetails | undefined)?.institutionalPhone ?? "")
        : "",
      governmentNit: user.profile?.professionalType === "government"
        ? ((user.profile?.professionalDetails as GovernmentDetails | undefined)?.nit ?? "")
        : "",
      businessNit: user.profile?.professionalType === "business"
        ? ((user.profile?.professionalDetails as BusinessDetails | undefined)?.nit ?? "")
        : "",
      businessPhone: user.profile?.professionalType === "business"
        ? ((user.profile?.professionalDetails as BusinessDetails | undefined)?.businessPhone ?? "")
        : "",
    };
  }, [user]);

  const syncUserData = useCallback(() => {
    if (!user) {
      return;
    }

    const userData = getUserDataFromAuth();
    setEditedUser(userData);
    setInitialProfileData(userData);
    setIsProfessional(user.profile?.accountType === "professional");
    // Obtener isPublic del usuario (por defecto true si no existe)
    setIsPublic(user.profile?.isPublic !== false);
    // Resetear estado de acordeones al reabrir
    setOpenEditSections(new Set(["personal"]));
    setAddingSocialLink(null);
  }, [getUserDataFromAuth, user]);

  // Estado para acordeones y UI del formulario de edición
  const [openEditSections, setOpenEditSections] = useState<Set<string>>(new Set(["personal"]));
  const toggleEditSection = useCallback((id: string) => {
    setOpenEditSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);
  const [addingSocialLink, setAddingSocialLink] = useState<{ platform: string; url: string } | null>(null);

  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [saveProfileMessage, setSaveProfileMessage] = useState<{ type: "success" | "error"; message: string } | null>(null);
  
  // React Hook Form para cambiar contraseña
  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    watch: watchPassword,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors, isSubmitting: isSubmittingPassword },
  } = useForm<{
    current: string;
    new: string;
    confirm: string;
  }>({
    mode: "onChange",
  });

  const [changePasswordMessage, setChangePasswordMessage] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Estado para verificación de disponibilidad del @username
  const [usernameCheckResult, setUsernameCheckResult] = useState<"available" | "taken" | null>(null);
  const [usernameCheckedValue, setUsernameCheckedValue] = useState<string>("");

  const usernameCheckStatus = useMemo<"idle" | "checking" | "available" | "taken">(() => {
    const trimmed = editedUser.username.trim();
    if (!trimmed || trimmed.length < 3) return "idle";
    if (trimmed === initialProfileData?.username.trim()) return "idle";
    if (trimmed !== usernameCheckedValue || usernameCheckResult === null) return "checking";
    return usernameCheckResult;
  }, [editedUser.username, initialProfileData?.username, usernameCheckedValue, usernameCheckResult]);

  const normalizePhoneToColombia = (phone: string): string | undefined => {
    const rawPhone = phone.trim();
    if (!rawPhone) {
      return undefined;
    }

    const digits = rawPhone.replace(/\D/g, "");

    if (!digits) {
      return undefined;
    }

    if (digits === "57") {
      return undefined;
    }

    if (digits.startsWith("57")) {
      return `+${digits}`;
    }

    return `+57${digits}`;
  };

  const buildComparableProfilePayload = useCallback(
    (data: UserData) => ({
      username: data.username.trim(),
      isUsernameCustomized: data.isUsernameCustomized,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      bio: data.bio.trim(),
      phoneNumber: normalizePhoneToColombia(data.phone) ?? "",
      avatarUrl: data.avatarUrl,
      website: data.website.trim(),
      mapsLink: data.mapsLink.trim(),
      socialLinks: data.socialLinks,
      professionalDescription: data.professionalDescription.trim(),
      brandName: data.brandName.trim(),
      governmentDepartment: data.governmentDepartment.trim(),
      governmentEmail: data.governmentEmail.trim(),
      governmentPhone: data.governmentPhone.trim(),
      governmentNit: data.governmentNit.trim(),
      businessNit: data.businessNit.trim(),
      businessPhone: data.businessPhone.trim(),
    }),
    [],
  );

  // Función para identificar campos incompletos
  const getIncompleteFields = useCallback((data: UserData): string[] => {
    const incomplete: string[] = [];
    
    if (!data.firstName.trim()) incomplete.push("firstName");
    if (!data.lastName.trim()) incomplete.push("lastName");
    if (!data.phone.trim()) incomplete.push("phone");
    if (!data.bio.trim()) incomplete.push("bio");
    
    return incomplete;
  }, []);

  const incompleteFields = useMemo(() => {
    return getIncompleteFields(editedUser);
  }, [editedUser, getIncompleteFields]);

  const hasIncompleteProfile = incompleteFields.length > 0;

  const handleAvatarFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    event.target.value = "";

    if (!selectedFile) {
      return;
    }

    if (!user?.uid) {
      notify.error("No hay sesión activa para actualizar la foto.");
      return;
    }

    if (!selectedFile.type.startsWith("image/")) {
      notify.error("Solo puedes subir imágenes para el avatar.");
      return;
    }

    if (selectedFile.size > MAX_AVATAR_SIZE_BYTES) {
      notify.error("La foto de perfil no puede pesar más de 5MB.");
      return;
    }

    const uploadPromise = (async () => {
      setIsUploadingAvatar(true);
      try {
        const uploadResult = await uploadToGoogleStorage(selectedFile, "profile", user.uid, {
          fileName: `avatar-${user.uid}`,
          contentType: selectedFile.type,
          isPublic: true,
          subFolder: "avatar",
          cacheControl: "public, max-age=31536000, immutable",
        });

        const updateResult = await updateAvatarAction({
          uid: user.uid,
          photoURL: uploadResult.publicUrl,
          imagePath: uploadResult.path,
        });

        if (!updateResult.success) {
          throw new Error(updateResult.error ?? "No se pudo actualizar la foto de perfil.");
        }

        await refreshUser();

        setEditedUser((prev) => ({
          ...prev,
          avatarUrl: uploadResult.publicUrl,
          imagePath: uploadResult.path,
        }));
        setInitialProfileData((prev) =>
          prev
            ? {
                ...prev,
                avatarUrl: uploadResult.publicUrl,
                imagePath: uploadResult.path,
              }
            : prev,
        );

        return uploadResult;
      } finally {
        setIsUploadingAvatar(false);
      }
    })();

    await notify.promise(uploadPromise, {
      loading: "Subiendo foto de perfil...",
      success: () => "Foto de perfil actualizada.",
      error: (error) => (error instanceof Error ? error.message : "No se pudo actualizar la foto de perfil."),
    });
  };

  const hasProfileChanges = useMemo(() => {
    if (!initialProfileData) {
      return false;
    }

    const currentPayload = buildComparableProfilePayload(editedUser);
    const initialPayload = buildComparableProfilePayload(initialProfileData);

    return JSON.stringify(currentPayload) !== JSON.stringify(initialPayload);
  }, [buildComparableProfilePayload, editedUser, initialProfileData]);

  const handleSaveProfile = async () => {
    if (!user?.uid) {
      setSaveProfileMessage({ type: "error", message: "No hay sesión activa." });
      return;
    }

    setIsSavingProfile(true);
    setSaveProfileMessage(null);

    const normalizedPhone = normalizePhoneToColombia(editedUser.phone);

    if (usernameCheckStatus === "taken") {
      setSaveProfileMessage({ type: "error", message: "El identificador público no está disponible. Elige otro." });
      setIsSavingProfile(false);
      return;
    }

    const isUsernameChanged =
      editedUser.username.trim() !== (initialProfileData?.username.trim() ?? "");

    // Construir professionalDetails actualizado según el tipo
    const isGovType = user.profile?.professionalType === "government";
    const isBizType = user.profile?.professionalType === "business";
    const existingGovDetails = isGovType
      ? (user.profile?.professionalDetails as GovernmentDetails | undefined)
      : undefined;
    const existingBizDetails = isBizType
      ? (user.profile?.professionalDetails as BusinessDetails | undefined)
      : undefined;

    const updatedProfessionalDetails =
      isGovType && existingGovDetails
        ? ({
            ...existingGovDetails,
            department: editedUser.governmentDepartment.trim(),
            institutionalEmail: editedUser.governmentEmail.trim(),
            institutionalPhone: editedUser.governmentPhone.trim(),
            nit: editedUser.governmentNit.trim() || existingGovDetails.nit || null,
          } as Record<string, unknown>)
        : isBizType && existingBizDetails
          ? ({
              ...existingBizDetails,
              nit: editedUser.businessNit.trim() || existingBizDetails.nit || null,
              businessPhone: editedUser.businessPhone.trim() || null,
            } as Record<string, unknown>)
          : undefined;

    const result = await updateProfileAction({
      uid: user.uid,
      username: editedUser.username.trim(),
      firstName: editedUser.firstName.trim(),
      lastName: editedUser.lastName.trim(),
      bio: editedUser.bio.trim(),
      phoneNumber: editedUser.phone,
      website: editedUser.website.trim(),
      mapsLink: isProfessional ? editedUser.mapsLink.trim() : undefined,
      socialLinks: editedUser.socialLinks,
      isUsernameCustomized: isUsernameChanged ? true : editedUser.isUsernameCustomized,
      professionalDescription: isProfessional ? editedUser.professionalDescription.trim() : undefined,
      brandName: isProfessional ? editedUser.brandName.trim() : undefined,
      professionalDetails: updatedProfessionalDetails,
    });

    if (!result.success) {
      setSaveProfileMessage({
        type: "error",
        message: result.error ?? "No se pudo actualizar el perfil.",
      });
      setIsSavingProfile(false);
      return;
    }

    await refreshUser();
    const updatedUserData: UserData = {
      ...editedUser,
      username: editedUser.username.trim(),
      isUsernameCustomized: isUsernameChanged ? true : editedUser.isUsernameCustomized,
      firstName: editedUser.firstName.trim(),
      lastName: editedUser.lastName.trim(),
      bio: editedUser.bio.trim(),
      phone: normalizedPhone ?? "",
      website: editedUser.website.trim(),
      mapsLink: editedUser.mapsLink.trim(),
      socialLinks: editedUser.socialLinks,
      professionalDescription: editedUser.professionalDescription.trim(),
      brandName: editedUser.brandName.trim(),
      governmentDepartment: editedUser.governmentDepartment.trim(),
      governmentEmail: editedUser.governmentEmail.trim(),
      governmentPhone: editedUser.governmentPhone.trim(),
      governmentNit: editedUser.governmentNit.trim(),
      businessNit: editedUser.businessNit.trim(),
      businessPhone: editedUser.businessPhone.trim(),
    };
    setEditedUser(updatedUserData);
    setInitialProfileData(updatedUserData);
    setSaveProfileMessage({ type: "success", message: "Perfil actualizado correctamente." });
    setIsSavingProfile(false);
    onSelectSectionSetting("main");
  };

  const handleChangePassword = async (data: {
    current: string;
    new: string;
    confirm: string;
  }) => {
    if (!user?.uid) {
      setChangePasswordMessage({ type: "error", message: "No hay sesión activa." });
      return;
    }

    setChangePasswordMessage(null);

    const result = await changePasswordAction({
      uid: user.uid,
      newPassword: data.new,
    });

    if (!result.success) {
      setChangePasswordMessage({
        type: "error",
        message: result.error ?? "No se pudo cambiar la contraseña.",
      });
      return;
    }

    setChangePasswordMessage({
      type: "success",
      message: result.message || "Contraseña actualizada correctamente.",
    });

    resetPasswordForm();
    setTimeout(() => {
      onSelectSectionSetting("main");
    }, 1500);
  };

  const handleToggleVisibility = async () => {
    if (!user?.uid) {
      notify.error("No hay sesión activa.");
      return;
    }

    setIsUpdatingVisibility(true);
    const newVisibility = !isPublic;

    try {
      const result = await updateProfileVisibilityAction({
        uid: user.uid,
        isPublic: newVisibility,
      });

      if (result.success) {
        setIsPublic(newVisibility);
        notify.success(result.message || "Visibilidad del perfil actualizada.");
      } else {
        notify.error(result.error || "Error al actualizar la visibilidad.");
      }
    } catch {
      notify.error("Error al actualizar la visibilidad del perfil.");
    } finally {
      setIsUpdatingVisibility(false);
    }
  };

  const handleDrawerOpenChange = (nextOpen: boolean) => {
    onOpenSettings(nextOpen);

    if (closeResetTimeoutRef.current !== null) {
      window.clearTimeout(closeResetTimeoutRef.current);
      closeResetTimeoutRef.current = null;
    }

    if (!nextOpen) {
      // Espera breve para que la animacion de cierre termine antes de volver a "main".
      closeResetTimeoutRef.current = window.setTimeout(() => {
        onSelectSectionSetting("main");
        closeResetTimeoutRef.current = null;
      }, 180);
    }
  };

  useEffect(() => {
    if (!openSettings || !user) {
      return;
    }

    const shouldSync = selectedSectionSetting === "edit-profile" || selectedSectionSetting === "main";
    if (!shouldSync) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      syncUserData();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [openSettings, selectedSectionSetting, syncUserData, user]);

  // Verifica disponibilidad del @username con debounce de 500 ms
  useEffect(() => {
    const trimmed = editedUser.username.trim();
    if (!trimmed || trimmed.length < 3) return;
    if (trimmed === usernameCheckedValue) return;
    // El username inicial ya le pertenece al usuario — no necesita verificarse
    if (trimmed === initialProfileData?.username.trim()) return;
    const timer = setTimeout(() => {
      void checkUsernameAvailabilityAction(trimmed, user?.uid ?? "").then((res) => {
        setUsernameCheckedValue(trimmed);
        setUsernameCheckResult(res.available ? "available" : "taken");
      });
    }, 500);
    return () => clearTimeout(timer);
  }, [editedUser.username, initialProfileData?.username, user?.uid, usernameCheckedValue]);

  const renderMainMenu = () => (
    <div className="space-y-8">
      <div className="rounded-xl border border-border bg-muted/30 p-4">
        <div className="flex items-center gap-3">
          <ProfileAvatar
            src={editedUser.avatarUrl}
            alt={editedUser.firstName || "Usuario"}
            sizes="48px"
            firstName={editedUser.firstName}
            lastName={editedUser.lastName}
            className="h-12 w-12 border border-border"
            textClassName="text-sm"
          />
          <div className="min-w-0">
            <p className="truncate font-semibold">
              {editedUser.firstName || "Usuario"} {editedUser.lastName}
            </p>
            <p className="truncate text-sm text-muted-foreground">{editedUser.email || "Sin correo"}</p>
            <p className="truncate text-xs text-muted-foreground">{editedUser.phone || "Sin telefono"}</p>
          </div>
        </div>
      </div>

      {/* ACCOUNT */}
      <Section title="Cuenta">
        <MenuRow
          icon={User}
          title="Editar perfil"
          description="Nombre, apellido, usuario, correo, telefono y foto"
          onClick={() => {
            syncUserData();
            onSelectSectionSetting("edit-profile");
          }}
        />
        <MenuRow
          icon={Lock}
          title="Cambiar contraseña"
          description="Actualiza tu contraseña de acceso"
          onClick={() => onSelectSectionSetting("change-password")}
        />
      </Section>

      {/* PRIVACY */}
      <Section title="Privacidad">
        <ToggleRow
          icon={isPublic ? Globe : EyeOff}
          title="Visibilidad del perfil"
          description={isPublic ? "Tu perfil es público" : "Tu perfil es privado"}
          checked={isPublic}
          onChange={handleToggleVisibility}
          disabled={isUpdatingVisibility}
        />
      </Section>

      {/* NOTIFICATIONS — oculto por ahora. Reactivar cuando el envío de emails
          (preferencia persistida + cron semanal + proveedor) esté implementado. */}
      {/* <Section title="Notificaciones">
        <ToggleRow
          icon={Bell}
          title="Eventos nuevos de tus categorías favoritas"
          description="Recibe avisos semanales de nuevos eventos"
          checked={categoryNotifications}
          onChange={() => setCategoryNotifications(!categoryNotifications)}
        />
      </Section> */}

      {/* PROFESSIONAL ACCOUNT */}
      <Section title="Cuenta profesional">
        <button
          onClick={() => onSelectSectionSetting("professional")}
          className="flex w-full items-center justify-between rounded-lg border border-border px-4 py-3 text-left transition-colors hover:bg-muted"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium">
                {isProfessional
                  ? "Gestionar cuenta profesional"
                  : "Cambiar a cuenta profesional"}
              </p>
              <p className="text-sm text-muted-foreground">
                Para influencers, negocios, organizaciones culturales y
                entidades gubernamentales.
              </p>
            </div>
          </div>
          {isProfessional ? (
            <span className="shrink-0 rounded-full bg-foreground px-2 py-0.5 text-xs font-medium text-background">
              Activa
            </span>
          ) : (
            <ChevronLeft className="h-5 w-5 rotate-180 shrink-0 text-muted-foreground" />
          )}
        </button>
      </Section>

      {/* DANGER ZONE */}
      <Section title="Zona de peligro">
        <div className="space-y-1 rounded-lg border border-destructive/40 p-1">
          <button
            onClick={() => onSelectSectionSetting("delete")}
            className="flex w-full items-center justify-between rounded-md px-3 py-3 text-left transition-colors hover:bg-destructive/5"
          >
            <div className="flex items-center gap-3">
              <Trash2 className="h-5 w-5 text-destructive" />
              <div>
                <p className="font-medium text-destructive">Eliminar cuenta</p>
                <p className="text-sm text-muted-foreground">
                  Elimina permanentemente tu cuenta
                </p>
              </div>
            </div>
            <ChevronLeft className="h-5 w-5 rotate-180 text-muted-foreground" />
          </button>
        </div>
      </Section>
    </div>
  );

  const renderEditProfile = () => {
    // Firestore es fuente de verdad; customClaims puede estar desactualizado (JWT stale)
    const rawType = (user?.profile?.professionalType as string | undefined)
      ?? (user?.customClaims?.professionalType as string | undefined);
    const professionalType = isProfessionalType(rawType) ? rawType : null;
    const isOrganizer = professionalType === "organizer";
    const isBusiness = professionalType === "business";
    const isGovernment = professionalType === "government";

    const organizerDetails = isOrganizer
      ? (user?.profile?.professionalDetails as OrganizerDetails | undefined)
      : null;
    const businessDetails = isBusiness
      ? (user?.profile?.professionalDetails as BusinessDetails | undefined)
      : null;
    const governmentDetails = isGovernment
      ? (user?.profile?.professionalDetails as GovernmentDetails | undefined)
      : null;

    const nit = organizerDetails?.nit ?? businessDetails?.nit ?? governmentDetails?.nit ?? null;
    const professionalTypeLabel = professionalType
      ? PROFESSIONAL_TYPE_LABEL[professionalType]
      : "Profesional";
    const professionalDescriptionLabel = isBusiness
      ? "Descripción del negocio"
      : isGovernment
        ? "Descripción institucional"
        : "Descripción profesional";

    const ProfTypeIcon = isOrganizer ? Award : isBusiness ? Briefcase : Landmark;

    // Summaries shown when each accordion is closed
    const personalSummary =
      [editedUser.firstName.trim(), editedUser.lastName.trim()].filter(Boolean).join(" ") ||
      "Sin datos";
    const professionalSummary =
      isProfessional && professionalType
        ? `${professionalTypeLabel}${editedUser.brandName.trim() ? ` · ${editedUser.brandName.trim()}` : ""}`
        : "";
    const digitalParts: string[] = [];
    if (editedUser.website.trim()) {
      try {
        digitalParts.push(new URL(editedUser.website.trim()).hostname);
      } catch {
        digitalParts.push("sitio web");
      }
    }
    if (editedUser.socialLinks.length > 0) {
      digitalParts.push(
        `${editedUser.socialLinks.length} red${editedUser.socialLinks.length !== 1 ? "es" : ""}`,
      );
    }
    const digitalSummary = digitalParts.join(" · ") || "Sin configurar";

    return (
      <div className="space-y-3 pb-2">
        {/* Indicador de perfil incompleto */}
        {hasIncompleteProfile && (
          <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
              <div>
                <p className="font-medium text-amber-900 dark:text-amber-300">
                  Tu perfil está incompleto
                </p>
                <p className="mt-1 text-sm text-amber-800 dark:text-amber-400">
                  Completa los campos marcados para mejorar tu visibilidad.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── 1. PERFIL PERSONAL ── */}
        <EditAccordionSection
          id="personal"
          icon={User}
          title="Perfil personal"
          summary={personalSummary}
          isOpen={openEditSections.has("personal")}
          onToggle={() => toggleEditSection("personal")}
        >
          {/* Avatar */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <ProfileAvatar
                src={editedUser.avatarUrl}
                alt="Foto de perfil"
                sizes="96px"
                firstName={editedUser.firstName}
                lastName={editedUser.lastName}
                loading="eager"
                className="h-24 w-24 border border-border bg-muted"
                textClassName="text-2xl"
              />
              <button
                type="button"
                aria-label="Cambiar foto de perfil"
                onClick={() => avatarInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="absolute bottom-0 right-0 z-10 flex h-9 w-9 items-center justify-center rounded-full border-2 border-background bg-foreground text-background shadow-md transition-transform hover:scale-105"
              >
                <Camera className="h-4 w-4" />
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  void handleAvatarFileChange(event);
                }}
              />
            </div>
            <p className="text-center text-sm text-muted-foreground">
              {isUploadingAvatar ? "Subiendo foto..." : "Toca para cambiar (máx. 5 MB)"}
            </p>
          </div>

          <Field
            label="Nombre"
            value={editedUser.firstName}
            onChange={(v) => setEditedUser({ ...editedUser, firstName: v })}
            isIncomplete={incompleteFields.includes("firstName")}
          />
          <Field
            label="Apellidos"
            value={editedUser.lastName}
            onChange={(v) => setEditedUser({ ...editedUser, lastName: v })}
            isIncomplete={incompleteFields.includes("lastName")}
          />
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-sm font-medium">Bio</label>
              {incompleteFields.includes("bio") && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                  <AlertCircle className="h-3 w-3" />
                  Completar
                </span>
              )}
            </div>
            <textarea
              value={editedUser.bio}
              onChange={(e) => setEditedUser({ ...editedUser, bio: e.target.value })}
              rows={3}
              className={cn(
                "w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition-colors",
                incompleteFields.includes("bio")
                  ? "border-amber-300 bg-amber-50/50 focus:border-amber-400 dark:border-amber-600/50 dark:bg-amber-950/20"
                  : "border-border bg-background focus:border-primary",
              )}
              placeholder="Cuéntanos sobre ti"
            />
          </div>
          <Field
            label="Teléfono"
            type="tel"
            value={editedUser.phone}
            onChange={(v) => setEditedUser({ ...editedUser, phone: v })}
            isIncomplete={incompleteFields.includes("phone")}
            placeholder="+57 300 0000000"
          />
          <Field
            label="Correo electrónico"
            type="email"
            value={editedUser.email}
            onChange={() => {}}
            disabled
          />
        </EditAccordionSection>

        {/* ── 2. CUENTA PROFESIONAL ── */}
        {isProfessional && (
          <EditAccordionSection
            id="professional"
            icon={ProfTypeIcon}
            title="Cuenta profesional"
            summary={professionalSummary}
            isOpen={openEditSections.has("professional")}
            onToggle={() => toggleEditSection("professional")}
          >
            {/* Type badge */}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/8 px-2.5 py-0.5 text-xs font-semibold text-primary">
                <ProfTypeIcon className="h-3 w-3" aria-hidden />
                {professionalTypeLabel}
              </span>
            </div>

            {/* Nombre / identidad profesional → genera @username */}
            <Field
              label={
                isBusiness
                  ? "Nombre comercial"
                  : isGovernment
                    ? "Nombre oficial de la entidad"
                    : "Nombre / identidad profesional"
              }
              value={editedUser.brandName}
              onChange={(v) => {
                const newUsername = generateUsername(v.trim());
                setEditedUser({
                  ...editedUser,
                  brandName: v,
                  username: newUsername,
                  isUsernameCustomized: false,
                });
              }}
              placeholder={
                isBusiness
                  ? "Nombre público de tu negocio"
                  : isGovernment
                    ? "Ej. Alcaldía de Ibagué"
                    : "Tu nombre como organizador"
              }
            />

            {/* Preview de @identificador derivado */}
            {editedUser.brandName.trim() && (
              <div
                className={cn(
                  "flex items-start gap-3 rounded-xl border px-4 py-3 transition-colors",
                  usernameCheckStatus === "taken"
                    ? "border-destructive/40 bg-destructive/[0.03]"
                    : usernameCheckStatus === "available"
                      ? "border-emerald-300/60 bg-emerald-50/30"
                      : "border-border bg-muted/30",
                )}
              >
                <AtSign
                  className={cn(
                    "mt-0.5 h-4 w-4 shrink-0",
                    usernameCheckStatus === "taken"
                      ? "text-destructive"
                      : usernameCheckStatus === "available"
                        ? "text-emerald-600"
                        : "text-muted-foreground",
                  )}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-foreground" aria-label="Identificador público generado">
                      @{editedUser.username || generateUsername(editedUser.brandName.trim())}
                    </span>
                    {usernameCheckStatus === "checking" && (
                      <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" aria-hidden />
                    )}
                    {usernameCheckStatus === "available" && (
                      <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-emerald-600">
                        <CheckCircle className="h-3 w-3" aria-hidden />
                        Disponible
                      </span>
                    )}
                    {usernameCheckStatus === "taken" && (
                      <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-destructive">
                        <AlertCircle className="h-3 w-3" aria-hidden />
                        No disponible
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Identificador público generado automáticamente.
                  </p>
                  {usernameCheckStatus === "taken" && (
                    <p className="mt-1 text-xs font-medium text-destructive">
                      Este identificador ya está en uso. Modifica el nombre para generar uno diferente.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Descripción profesional */}
            <div>
              <label className="mb-1 block text-sm font-medium">
                {professionalDescriptionLabel}
              </label>
              <p className="mb-1.5 text-xs text-muted-foreground">
                Aparece en tu perfil público
                {!editedUser.professionalDescription
                  ? " — si está vacío, se mostrará tu bio."
                  : "."}
              </p>
              <textarea
                value={editedUser.professionalDescription}
                onChange={(e) =>
                  setEditedUser({ ...editedUser, professionalDescription: e.target.value })
                }
                rows={3}
                maxLength={500}
                className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary"
                placeholder="Describe tu actividad profesional..."
              />
            </div>

            {/* Categoría del negocio (read-only) */}
            {isBusiness && businessDetails?.businessCategory && (
              <VerifiedField
                label="Categoría del negocio"
                value={BUSINESS_CATEGORY_LABEL[businessDetails.businessCategory]}
                note="Categoría definida durante la verificación de tu cuenta."
              />
            )}

            {/* Tipo de organizador (read-only) */}
            {isOrganizer && organizerDetails?.organizerType && (
              <VerifiedField
                label="Tipo de organizador"
                value={
                  organizerDetails.organizerType === "organization"
                    ? "Empresa u organización"
                    : "Persona natural"
                }
                note="Para modificar este dato, gestiona tu cuenta profesional."
              />
            )}

            {/* Categorías del organizador (informativo) */}
            {isOrganizer &&
              organizerDetails?.eventCategories &&
              organizerDetails.eventCategories.length > 0 && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-muted-foreground">
                    Categorías de eventos
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {organizerDetails.eventCategories.map((cat) => (
                      <span
                        key={cat}
                        className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
              )}

            {/* Nombre oficial verificado (government) */}
            {isGovernment && governmentDetails?.entityName && governmentDetails.entityName !== editedUser.brandName.trim() && (
              <VerifiedField
                label="Nombre registrado en verificación"
                value={governmentDetails.entityName}
                note="Nombre original registrado al momento de la verificación."
              />
            )}

            {/* Dependencia editable (government) */}
            {isGovernment && (
              <Field
                label="Dependencia / área"
                value={editedUser.governmentDepartment}
                onChange={(v) => setEditedUser({ ...editedUser, governmentDepartment: v })}
                placeholder="Ej. Secretaría de Cultura"
                helperText="Dependencia o área responsable de esta cuenta."
              />
            )}

            {/* Contacto institucional editable (government) */}
            {isGovernment && (
              <>
                <Field
                  label="Correo institucional"
                  type="email"
                  value={editedUser.governmentEmail}
                  onChange={(v) => setEditedUser({ ...editedUser, governmentEmail: v })}
                  placeholder="contacto@entidad.gov.co"
                  helperText="Correo oficial de la entidad, visible en el perfil público."
                />
                <Field
                  label="Teléfono institucional"
                  type="tel"
                  value={editedUser.governmentPhone}
                  onChange={(v) => setEditedUser({ ...editedUser, governmentPhone: v })}
                  placeholder="+57 608 000 0000"
                  helperText="Teléfono oficial de la entidad."
                />
              </>
            )}

            {/* NIT — government y business: editable; organizer: verificado enmascarado */}
            {isGovernment ? (
              <Field
                label="NIT de la entidad"
                value={editedUser.governmentNit}
                onChange={(v) => setEditedUser({ ...editedUser, governmentNit: v })}
                placeholder="900.123.456-7"
                helperText="Número de identificación tributaria de la entidad (opcional)."
              />
            ) : isBusiness ? (
              <>
                <Field
                  label="NIT del negocio"
                  value={editedUser.businessNit}
                  onChange={(v) => setEditedUser({ ...editedUser, businessNit: v })}
                  placeholder="900.123.456-7"
                  helperText="Identificación tributaria del negocio (opcional)."
                />
                <Field
                  label="Teléfono comercial"
                  type="tel"
                  value={editedUser.businessPhone}
                  onChange={(v) => setEditedUser({ ...editedUser, businessPhone: v })}
                  placeholder="+57 310 000 0000"
                  helperText="Teléfono público del negocio. Opcional — distinto del teléfono personal."
                />
              </>
            ) : (
              nit && (
                <VerifiedField
                  label="NIT / Identificación fiscal"
                  value="••••••••••"
                  note="Asociado a la verificación de tu cuenta. No modificable directamente."
                />
              )
            )}
          </EditAccordionSection>
        )}

        {/* ── 4. PRESENCIA DIGITAL ── */}
        <EditAccordionSection
          id="digital"
          icon={Globe}
          title="Presencia digital"
          summary={digitalSummary}
          isOpen={openEditSections.has("digital")}
          onToggle={() => toggleEditSection("digital")}
        >
          <Field
            label="Sitio web"
            type="url"
            value={editedUser.website}
            onChange={(v) => setEditedUser({ ...editedUser, website: v })}
            placeholder="https://tuweb.com"
            helperText="Aparece como enlace de contacto en tu perfil público."
          />

          {isProfessional && (
            <Field
              label="Enlace de ubicación (Google Maps)"
              type="url"
              value={editedUser.mapsLink}
              onChange={(v) => setEditedUser({ ...editedUser, mapsLink: v })}
              placeholder="https://maps.app.goo.gl/..."
              helperText="Aparece como tile de mapa en tu perfil público."
            />
          )}

          <div>
            <label className="mb-2 block text-sm font-medium">Redes sociales</label>

            {editedUser.socialLinks.length > 0 && (
              <div className="mb-3 divide-y divide-border overflow-hidden rounded-xl border border-border">
                {editedUser.socialLinks.map((link, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-foreground">
                        {PLATFORM_LABEL[link.platform] ?? link.platform}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{link.url}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setEditedUser({
                          ...editedUser,
                          socialLinks: editedUser.socialLinks.filter((_, j) => j !== i),
                        })
                      }
                      className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      aria-label={`Eliminar ${PLATFORM_LABEL[link.platform] ?? link.platform}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {!addingSocialLink ? (
              <button
                type="button"
                onClick={() => setAddingSocialLink({ platform: "instagram", url: "" })}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Plus className="h-4 w-4" aria-hidden />
                Agregar red social
              </button>
            ) : (
              <div className="space-y-3 rounded-xl border border-primary/25 bg-primary/[0.02] p-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Plataforma</label>
                  <select
                    value={addingSocialLink.platform}
                    onChange={(e) =>
                      setAddingSocialLink({ ...addingSocialLink, platform: e.target.value })
                    }
                    className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition-colors focus:border-primary"
                  >
                    {SOCIAL_PLATFORMS.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
                <Field
                  label="URL"
                  type="url"
                  value={addingSocialLink.url}
                  onChange={(url) => setAddingSocialLink({ ...addingSocialLink, url })}
                  placeholder="https://..."
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    disabled={!addingSocialLink.url.trim()}
                    onClick={() => {
                      if (!addingSocialLink.url.trim()) return;
                      setEditedUser({
                        ...editedUser,
                        socialLinks: [
                          ...editedUser.socialLinks,
                          addingSocialLink as SocialLinkEntry,
                        ],
                      });
                      setAddingSocialLink(null);
                    }}
                    className="h-9 flex-1 text-sm"
                  >
                    Agregar
                  </Button>
                  <button
                    type="button"
                    onClick={() => setAddingSocialLink(null)}
                    className="h-9 rounded-lg border border-border px-3 text-sm text-muted-foreground transition-colors hover:bg-muted/40"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        </EditAccordionSection>

        {/* Footer */}
        <div className="sticky bottom-0 z-10 -mx-4 mt-2 border-t border-border bg-background/95 px-4 pb-1 pt-3 backdrop-blur">
          <Button
            onClick={() => void handleSaveProfile()}
            disabled={isSavingProfile || !hasProfileChanges || usernameCheckStatus === "taken"}
            className="h-11 w-full font-semibold"
          >
            {isSavingProfile ? "Aplicando cambios..." : "Aplicar cambios"}
          </Button>
          {!hasProfileChanges && !isSavingProfile && (
            <p className="mt-2 text-center text-xs text-muted-foreground">
              No hay cambios pendientes
            </p>
          )}
          {saveProfileMessage && (
            <p
              className={cn(
                "mt-2 text-center text-sm font-medium",
                saveProfileMessage.type === "success" ? "text-emerald-600" : "text-destructive",
              )}
            >
              {saveProfileMessage.message}
            </p>
          )}
        </div>
      </div>
    );
  };

  const renderChangePassword = () => {
    const newPassword = watchPassword("new");
    const confirmPassword = watchPassword("confirm");
    const passwordsMatch = newPassword === confirmPassword;
    const isPasswordValid = newPassword && newPassword.length >= 8 && /[a-zA-Z]/.test(newPassword) && /[0-9]/.test(newPassword);

    return (
      <form onSubmit={handleSubmitPassword(handleChangePassword)} className="space-y-6">
        <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-900/50 dark:bg-blue-950/20">
          <div className="flex items-start gap-3">
            <Lock className="h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900 dark:text-blue-300">
                Mantén tu cuenta segura
              </p>
              <p className="mt-1 text-sm text-blue-800 dark:text-blue-400">
                Usa una contraseña fuerte con al menos 8 caracteres, letras y números
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Contraseña actual</label>
            <input
              type="password"
              placeholder="Ingresa tu contraseña actual"
              {...registerPassword("current", {
                required: "La contraseña actual es requerida",
              })}
              className={`h-11 w-full rounded-lg border px-4 text-sm outline-none transition-colors ${
                passwordErrors.current
                  ? "border-destructive bg-destructive/5 focus:border-destructive"
                  : "border-border bg-background focus:border-brand-violet"
              }`}
            />
            {passwordErrors.current && (
              <p className="mt-1.5 text-sm text-destructive">{passwordErrors.current.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">Nueva contraseña</label>
            <div className="space-y-2">
              <input
                type="password"
                placeholder="Ingresa tu nueva contraseña"
                {...registerPassword("new", {
                  required: "La nueva contraseña es requerida",
                  minLength: { value: 8, message: "Mínimo 8 caracteres" },
                  validate: {
                    hasLetters: (value) => /[a-zA-Z]/.test(value) || "Debe incluir letras",
                    hasNumbers: (value) => /[0-9]/.test(value) || "Debe incluir números",
                  },
                })}
                className={`h-11 w-full rounded-lg border px-4 text-sm outline-none transition-colors ${
                  passwordErrors.new
                    ? "border-destructive bg-destructive/5 focus:border-destructive"
                    : "border-border bg-background focus:border-brand-violet"
                }`}
              />
              {/* Indicador de fortaleza */}
              {newPassword && (
                <div className="space-y-2">
                  <div className="flex gap-1">
                    <div className={`h-1 flex-1 rounded-full ${newPassword.length >= 8 ? "bg-emerald-500" : "bg-muted"}`} />
                    <div className={`h-1 flex-1 rounded-full ${newPassword.length >= 12 ? "bg-emerald-500" : "bg-muted"}`} />
                    <div className={`h-1 flex-1 rounded-full ${/[!@#$%^&*]/.test(newPassword) ? "bg-emerald-500" : "bg-muted"}`} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {newPassword.length < 8
                      ? "Contraseña débil"
                      : newPassword.length >= 12
                        ? "Contraseña fuerte"
                        : "Contraseña moderada"}
                  </p>
                </div>
              )}
            </div>
            {passwordErrors.new && (
              <p className="mt-1.5 text-sm text-destructive">{passwordErrors.new.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">Confirmar nueva contraseña</label>
            <div className="relative">
              <input
                type="password"
                placeholder="Confirma tu nueva contraseña"
                {...registerPassword("confirm", {
                  required: "Debes confirmar tu contraseña",
                  validate: (value) => value === newPassword || "Las contraseñas no coinciden",
                })}
                className={`h-11 w-full rounded-lg border px-4 pr-10 text-sm outline-none transition-colors ${
                  passwordErrors.confirm
                    ? "border-destructive bg-destructive/5 focus:border-destructive"
                    : confirmPassword && passwordsMatch
                      ? "border-emerald-300 bg-emerald-50/30 focus:border-emerald-400 dark:border-emerald-600/50 dark:bg-emerald-950/20"
                      : "border-border bg-background focus:border-brand-violet"
                }`}
              />
              {confirmPassword && passwordsMatch && !passwordErrors.confirm && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle className="h-4 w-4" />
                </div>
              )}
            </div>
            {passwordErrors.confirm && (
              <p className="mt-1.5 text-sm text-destructive">{passwordErrors.confirm.message}</p>
            )}
          </div>
        </div>

        {changePasswordMessage && (
          <div
            className={`rounded-lg p-3 text-sm font-medium ${
              changePasswordMessage.type === "success"
                ? "bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
                : "bg-destructive/10 text-destructive"
            }`}
          >
            {changePasswordMessage.message}
          </div>
        )}

        <Button
          type="submit"
          disabled={isSubmittingPassword || !isPasswordValid || !passwordsMatch}
          className="h-11 w-full font-semibold"
        >
          {isSubmittingPassword ? "Actualizando contraseña..." : "Actualizar contraseña"}
        </Button>
      </form>
    );
  };

  const renderProfessional = () => {
    if (!user?.uid) {
      return null;
    }

    return (
      <ProfessionalRequestSection
        uid={user.uid}
        defaultUsername={editedUser.username}
        defaultPhone={editedUser.phone}
        defaultWebsite={user.profile?.website ?? ""}
      />
    );
  };

  const renderDelete = () => (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-4 py-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-destructive/40">
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold">Eliminar cuenta</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Esta acción es permanente e irreversible. Todos tus datos, eventos y
            configuraciones serán eliminados.
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-destructive/40 p-4">
        <h4 className="font-medium text-destructive">Atención:</h4>
        <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
          <li>Todos tus eventos serán eliminados</li>
          <li>Tu historial se perderá permanentemente</li>
          <li>No podrás recuperar esta cuenta</li>
        </ul>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">
          Escribe &quot;ELIMINAR&quot; para confirmar
        </label>
        <input
          type="text"
          value={deleteConfirm}
          onChange={(e) => setDeleteConfirm(e.target.value)}
          placeholder="ELIMINAR"
          className="h-11 w-full rounded-lg border border-destructive/40 bg-background px-4 text-sm outline-none transition-colors focus:border-destructive"
        />
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => {
            setDeleteConfirm("");
            onSelectSectionSetting("main");
          }}
          disabled={isDeletingAccount}
          className="h-11 flex-1 rounded-lg border border-border font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          onClick={async () => {
            if (!user?.uid) {
              notify.error("No hay sesión activa.");
              return;
            }

            if (deleteConfirm !== "ELIMINAR") {
              notify.error("Debes escribir 'ELIMINAR' para confirmar.");
              return;
            }

            setIsDeletingAccount(true);
            try {
              const result = await deleteAccountAction({ uid: user.uid });
              if (result.success) {
                notify.success(result.message || "Cuenta eliminada correctamente.");
                // Redirigir después de un tiempo
                await new Promise(resolve => setTimeout(resolve, 1500));
                window.location.href = "/";
              } else {
                notify.error(result.error || "Error al eliminar la cuenta.");
              }
            } catch {
              notify.error("Error al eliminar la cuenta.");
            } finally {
              setIsDeletingAccount(false);
            }
          }}
          disabled={deleteConfirm !== "ELIMINAR" || isDeletingAccount}
          className="h-11 flex-1 rounded-lg bg-destructive font-medium text-destructive-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isDeletingAccount ? "Eliminando..." : "Eliminar cuenta"}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {!hideTrigger && (
        <Button
          aria-label="Abrir configuración"
          variant="outline"
          className="inline-flex h-9 items-center gap-2 rounded-full border-zinc-300 px-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-violet dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
          onClick={() => {
            const nextOpen = !openSettings;
            if (nextOpen) {
              syncUserData();
            }
            onOpenSettings(nextOpen);
          }}
        >
          <Settings className="size-5 shrink-0" />
          <span className="truncate">Ajustes</span>
        </Button>
      )}
      <Drawer
        direction={drawerDirection}
        open={openSettings}
        onOpenChange={handleDrawerOpenChange}
      >
        <DrawerContent className={drawerContentClassName}>
          <DrawerTitle className="sr-only">
            {getSectionTitle(selectedSectionSetting)}
          </DrawerTitle>
          <DrawerDescription className="sr-only">
            Panel de ajustes
          </DrawerDescription>

          {/* Header personalizado */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              {selectedSectionSetting !== "main" && (
                <Button
                  onClick={() => onSelectSectionSetting("main")}
                  variant="ghost"
                  className="flex h-9 w-9 items-center justify-center rounded-full"
                >
                  <ChevronLeft className="h-5 w-5" />
                  <span className="sr-only">Volver</span>
                </Button>
              )}
              <span className="text-base font-medium text-foreground">
                {getSectionTitle(selectedSectionSetting)}
              </span>
            </div>

            <Button
              variant="ghost"
              className="flex h-9 w-9 items-center justify-center rounded-full"
              onClick={() => handleDrawerOpenChange(false)}
            >
              <X className="h-5 w-5" />
              <span className="sr-only">Cerrar</span>
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {selectedSectionSetting === "main" && renderMainMenu()}
            {selectedSectionSetting === "edit-profile" && renderEditProfile()}
            {selectedSectionSetting === "change-password" && renderChangePassword()}
            {selectedSectionSetting === "professional" && renderProfessional()}
            {selectedSectionSetting === "delete" && renderDelete()}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
};

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <h3 className="px-1 text-xs font-bold uppercase tracking-wider text-brand-violet">
        {title}
      </h3>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function MenuRow({
  icon: Icon,
  title,
  description,
  onClick,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-left transition-colors hover:bg-muted"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="font-medium">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <ChevronLeft className="h-5 w-5 rotate-180 text-muted-foreground" />
    </button>
  );
}

function ToggleRow({
  icon: Icon,
  title,
  description,
  checked,
  onChange,
  disabled = false,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg px-3 py-3">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="font-medium">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} />
    </div>
  );
}

function EditAccordionSection({
  id,
  icon: Icon,
  title,
  summary,
  isOpen,
  onToggle,
  children,
}: {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  summary?: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("rounded-xl border transition-colors", isOpen ? "border-primary/25" : "border-border")}>
      <button
        type="button"
        id={`edit-section-btn-${id}`}
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={`edit-section-${id}`}
        className={cn(
          "flex w-full items-center gap-3 rounded-xl p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          isOpen ? "rounded-b-none bg-primary/[0.02] hover:bg-primary/[0.04]" : "hover:bg-muted/40",
        )}
      >
        <div
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors",
            isOpen ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
          )}
          aria-hidden
        >
          <Icon className="size-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          {!isOpen && summary && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{summary}</p>
          )}
        </div>
        <ChevronDown
          className={cn("size-4 shrink-0 text-muted-foreground transition-transform duration-200", isOpen && "rotate-180")}
          aria-hidden
        />
      </button>
      {isOpen && (
        <div
          id={`edit-section-${id}`}
          role="region"
          aria-labelledby={`edit-section-btn-${id}`}
          className="space-y-4 rounded-b-xl border-t border-border p-4"
        >
          {children}
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  disabled = false,
  isIncomplete = false,
  placeholder,
  helperText,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  disabled?: boolean;
  isIncomplete?: boolean;
  placeholder?: string;
  helperText?: string;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label className="text-sm font-medium">{label}</label>
        {isIncomplete && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
            <AlertCircle className="h-3 w-3" />
            Completar
          </span>
        )}
      </div>
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          className={`h-11 w-full rounded-lg border px-4 pr-10 text-sm outline-none transition-colors disabled:cursor-not-allowed disabled:bg-muted/50 disabled:text-muted-foreground ${
            isIncomplete
              ? "border-amber-300 bg-amber-50/50 focus:border-amber-400 dark:border-amber-600/50 dark:bg-amber-950/20"
              : "border-border bg-background focus:border-primary"
          }`}
        />
        {isIncomplete && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-600 dark:text-amber-400">
            <AlertCircle className="h-4 w-4" />
          </div>
        )}
      </div>
      {helperText && (
        <p className="mt-1 text-xs text-muted-foreground">{helperText}</p>
      )}
    </div>
  );
}

function ProfileSectionDivider({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 pb-1 pt-4">
      <span className="shrink-0 text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {title}
      </span>
      <div className="h-px flex-1 bg-border/60" />
    </div>
  );
}

function VerifiedField({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-2">
        <label className="text-sm font-medium">{label}</label>
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
          <ShieldCheck className="h-2.5 w-2.5" aria-hidden />
          Verificado
        </span>
      </div>
      <input
        type="text"
        value={value}
        disabled
        readOnly
        className="h-11 w-full cursor-not-allowed rounded-lg border border-border bg-muted/40 px-4 text-sm text-muted-foreground"
      />
      {note && <p className="mt-1 text-xs text-muted-foreground/80">{note}</p>}
    </div>
  );
}

