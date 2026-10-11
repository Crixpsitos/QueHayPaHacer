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
  Plus,
  // Bell, // reactivar junto con la sección de Notificaciones
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle } from "lucide-react";
import { ProfileAvatar } from "./ProfileAvatar";
import { useProfileConfigStore } from "@/app/store/profile/profileConfig.store";
import { useMediaQuery } from "@/app/lib/hooks/useMediaQuery";
import { useAuth } from "@/app/store/auth/AuthContext";
import { updateProfileAction } from "@/app/actions/profile/update-profile.action";
import { checkUsernameAvailabilityAction } from "@/app/actions/profile/check-username-availability.action";
import { generateUsername } from "@/app/lib/utils/generateUsername";
import { cn } from "@/app/lib/utils/cn";
import type { SocialLinkEntry } from "@/domain/entities/user/User";
import { updateProfileVisibilityAction } from "@/app/actions/profile/update-profile-visibility.action";
import { updateAvatarAction } from "@/app/actions/profile/update-avatar.action";
import { changePasswordAction } from "@/app/actions/auth/change-password.action";
import { deleteAccountAction } from "@/app/actions/auth/delete-account.action";
import { uploadToGoogleStorage } from "@/presentation/events/lib/upload/uploadToGoogleStorage";
import { notify } from "@/presentation/shared/lib/notify";
import { EmailAuthProvider, reauthenticateWithCredential, signInWithEmailAndPassword } from "firebase/auth";
import { loginAction } from "@/app/actions/auth/login.action";
import { getFirebaseAuth } from "@/infraestructure/firebase/config/client/firebase";
import { MembershipSection } from "./MembershipSection";

type selectedSectionSetting =
  | "main"
  | "edit-profile"
  | "change-password"
  | "membership"
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
  website: string;
  socialLinks: SocialLinkEntry[];
}

const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024;

const getSectionTitle = (section: selectedSectionSetting) => {
  switch (section) {
    case "main":
      return "General";
    case "edit-profile":
      return "Editar perfil";
    case "change-password":
      return "Actualizar contraseña";
    case "membership":
      return "Membresía";
    case "delete":
      return "Eliminar cuenta";
    default:
      return "General";
  }
};

export const SettingsCenter = ({ hideTrigger = false }: { hideTrigger?: boolean } = {}) => {
  const { user, refreshUser } = useAuth();
  const { openSettings, onOpenSettings, selectedSectionSetting, onSelectSectionSetting } = useProfileConfigStore();
  const searchParams = useSearchParams();
  const closeResetTimeoutRef = useRef<number | null>(null);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  // const [categoryNotifications, setCategoryNotifications] = useState(true); // reactivar con la sección de Notificaciones
  const [isPublic, setIsPublic] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUpdatingVisibility, setIsUpdatingVisibility] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const isMobile = useMediaQuery("(max-width: 640px)");
  const drawerDirection = isMobile ? "bottom" : "right";
  const drawerContentClassName = isMobile
    ? "!h-dvh !max-h-dvh overflow-hidden !p-0 before:inset-0 before:rounded-none"
    : "h-dvh max-h-dvh w-full overflow-hidden sm:w-[480px] sm:max-w-[480px] !p-0 before:inset-0 before:rounded-none before:border-y-0 before:border-r-0 before:border-l";

  useEffect(() => {
    return () => {
      if (closeResetTimeoutRef.current !== null) {
        window.clearTimeout(closeResetTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (searchParams.get("ajustes") === "1" && !openSettings) {
      onOpenSettings(true);
    }
  }, [onOpenSettings, openSettings, searchParams]);

  useEffect(() => {
    const hasSettingsQuery = searchParams.get("ajustes") === "1";
    if (hasSettingsQuery && !openSettings) return;
    if (hasSettingsQuery === openSettings) return;

    const url = new URL(window.location.href);
    if (openSettings) {
      url.searchParams.set("ajustes", "1");
    } else {
      url.searchParams.delete("ajustes");
    }
    window.history.replaceState(null, "", url.pathname + (url.search || ""));
  }, [openSettings, searchParams]);

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
    website: "",
    socialLinks: [],
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
        website: "",
        socialLinks: emptySocialLinks,
      };
    }
    const fullName = user.displayName ?? "";
    const [first = "", ...rest] = fullName.split(" ");
    const last = rest.join(" ");

    const resolvedSocialLinks = user.profile?.socialLinks ?? [];

    return {
      firstName: user.profile?.firstName ?? first,
      lastName: user.profile?.lastName ?? last,
      email: user.email ?? "",
      phone: user.phoneNumber ?? user.profile?.phoneNumber ?? "",
      bio: user.profile?.bio ?? "",
      username: user.profile?.username ?? generateUsername(fullName),
      isUsernameCustomized: (user.profile?.isUsernameCustomized as boolean | undefined) ?? false,
      avatarUrl: user.profile?.photoURL ?? user.photoURL ?? "",
      imagePath: user.profile?.imagePath ?? "",
      website: user.profile?.website ?? "",
      socialLinks: resolvedSocialLinks,
    };
  }, [user]);

  const syncUserData = useCallback(() => {
    if (!user) {
      return;
    }

    const userData = getUserDataFromAuth();
    setEditedUser(userData);
    setInitialProfileData(userData);
    setIsPremium(user.profile?.plan === "premium");
    setIsPublic(
      user.profile?.participation === "creator" && user.profile.isPublic,
    );
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
      socialLinks: data.socialLinks,
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

    const result = await updateProfileAction({
      uid: user.uid,
      username: editedUser.username.trim(),
      firstName: editedUser.firstName.trim(),
      lastName: editedUser.lastName.trim(),
      bio: editedUser.bio.trim(),
      phoneNumber: editedUser.phone,
      website: editedUser.website.trim(),
      socialLinks: editedUser.socialLinks,
      isUsernameCustomized: isUsernameChanged ? true : editedUser.isUsernameCustomized,
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
      socialLinks: editedUser.socialLinks,
    };
    setEditedUser(updatedUserData);
    setInitialProfileData(updatedUserData);
    setSaveProfileMessage({ type: "success", message: "Perfil actualizado correctamente." });
    setIsSavingProfile(false);
    onSelectSectionSetting("main");
  };

  // Solo cuentas con proveedor email/contraseña (no solo-Google) pueden cambiarla.
  const hasPasswordProvider = useMemo(
    () => Boolean(user && getFirebaseAuth().currentUser?.providerData.some((p) => p.providerId === "password")),
    [user],
  );

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

    // Verifica la contraseña actual; el servidor exige un token con login reciente.
    const authUser = getFirebaseAuth().currentUser;
    if (!authUser?.email) {
      setChangePasswordMessage({ type: "error", message: "No hay sesión activa." });
      return;
    }
    let idToken: string;
    try {
      const cred = await reauthenticateWithCredential(
        authUser,
        EmailAuthProvider.credential(authUser.email, data.current),
      );
      idToken = await cred.user.getIdToken(true);
    } catch {
      setChangePasswordMessage({ type: "error", message: "La contraseña actual no es correcta." });
      return;
    }

    const result = await changePasswordAction({
      uid: user.uid,
      newPassword: data.new,
      idToken,
    });

    if (!result.success) {
      setChangePasswordMessage({
        type: "error",
        message: result.error ?? "No se pudo cambiar la contraseña.",
      });
      return;
    }

    // Firebase revoca las sesiones previas al cambiar la contraseña: se reabre con la
    // nueva (SDK cliente + cookies) para no dejar una cookie que ya no se puede refrescar.
    await signInWithEmailAndPassword(getFirebaseAuth(), authUser.email, data.new).catch(() => {});
    await loginAction(authUser.email, data.new).catch(() => {});

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
      void checkUsernameAvailabilityAction(trimmed).then((res) => {
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
            <p className="truncate text-xs text-muted-foreground">{editedUser.phone || "Sin teléfono"}</p>
          </div>
        </div>
      </div>

      {/* ACCOUNT */}
      <Section title="Cuenta">
        <MenuRow
          icon={User}
          title="Editar perfil"
          description="Nombre, apellido, usuario, correo, teléfono y foto"
          onClick={() => {
            syncUserData();
            onSelectSectionSetting("edit-profile");
          }}
        />
        {hasPasswordProvider && (
          <MenuRow
            icon={Lock}
            title="Actualizar contraseña"
            description="Actualiza tu contraseña de acceso"
            onClick={() => onSelectSectionSetting("change-password")}
          />
        )}
      </Section>

      {/* PRIVACY */}
      <Section title="Privacidad">
        <ToggleRow
          icon={isPublic ? Globe : EyeOff}
          title="Visibilidad del perfil"
          description={
            user?.profile?.participation === "consumer"
              ? "Los perfiles consumidores siempre son privados"
              : isPublic
                ? "Tu perfil es público"
                : "Tu perfil es privado"
          }
          checked={isPublic}
          onChange={handleToggleVisibility}
          disabled={isUpdatingVisibility || user?.profile?.participation === "consumer"}
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

      {/* MEMBERSHIP */}
      <Section title="Membresía">
        <button
          onClick={() => onSelectSectionSetting("membership")}
          className="flex w-full items-center justify-between rounded-lg border border-border px-4 py-3 text-left transition-colors hover:bg-muted"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium">
                Gestionar membresía
              </p>
              <p className="text-sm text-muted-foreground">
                Consulta tu plan {isPremium ? "Premium" : "Básico"}.
              </p>
            </div>
          </div>
          {isPremium ? (
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
    // Summaries shown when each accordion is closed
    const personalSummary =
      [editedUser.firstName.trim(), editedUser.lastName.trim()].filter(Boolean).join(" ") ||
      "Sin datos";
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
          title="Información personal"
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
          <Field
            label="Username"
            value={editedUser.username}
            onChange={(value) => {
              setEditedUser({
                ...editedUser,
                username: generateUsername(value),
                isUsernameCustomized: true,
              });
            }}
            placeholder="username"
            helperText={
              usernameCheckStatus === "available"
                ? "Disponible"
                : usernameCheckStatus === "taken"
                  ? "No disponible"
                  : "Es tu identificador público dentro de QHPA."
            }
          />
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-sm font-medium">Biografía</label>
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

        {/* ── 2. PRESENCIA DIGITAL ── */}
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
            helperText="Aparece como enlace de contacto en tu perfil."
          />

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
              <div className="space-y-3 rounded-xl border border-primary/25 bg-primary/2 p-3">
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
                  : "border-border bg-background focus:border-primary"
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
                    : "border-border bg-background focus:border-primary"
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
                      : "border-border bg-background focus:border-primary"
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

  const renderMembership = () => {
    if (!user) {
      return null;
    }

    return (
      <MembershipSection
        currentPlan={user.profile?.plan}
        planExpiresAt={user.profile?.planExpiresAt ?? undefined}
        participation={user.profile?.participation}
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
          className="inline-flex h-9 items-center gap-2 rounded-full border-zinc-300 px-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
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
          <div className="no-scrollbar min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-4">
            {selectedSectionSetting === "main" && renderMainMenu()}
            {selectedSectionSetting === "edit-profile" && renderEditProfile()}
            {selectedSectionSetting === "change-password" && hasPasswordProvider && renderChangePassword()}
            {selectedSectionSetting === "membership" && renderMembership()}
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
      <h3 className="px-1 text-sm font-semibold text-foreground">
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
          isOpen ? "rounded-b-none bg-primary/2 hover:bg-primary/4" : "hover:bg-muted/40",
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

