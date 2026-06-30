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
import { updateProfileVisibilityAction } from "@/app/actions/profile/update-profile-visibility.action";
import { updateAvatarAction } from "@/app/actions/profile/update-avatar.action";
import { changePasswordAction } from "@/app/actions/auth/change-password.action";
import { deleteAccountAction } from "@/app/actions/auth/delete-account.action";
import { uploadToGoogleStorage } from "@/presentation/events/lib/upload/uploadToGoogleStorage";
import { notify } from "@/presentation/shared/lib/notify";
import { ProfessionalRequestSection } from "./professional/ProfessionalRequestSection";

type selectedSectionSetting =
  | "main"
  | "edit-profile"
  | "change-password"
  | "professional"
  | "delete";

interface UserData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  bio: string;
  username: string;
  avatarUrl: string;
  imagePath: string;
  isProfessional: boolean;
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

export const SettingsCenter = () => {
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
    avatarUrl: "",
    imagePath: "",
    isProfessional: false,
  });
  const [initialProfileData, setInitialProfileData] = useState<UserData | null>(null);

  const getUserDataFromAuth = useCallback((): UserData => {
    if (!user) {
      return {
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        bio: "",
        username: "",
        avatarUrl: "",
        imagePath: "",
        isProfessional: false,
      };
    }

    const fullName = user.displayName?.trim() ?? "";
    const [first = "", ...rest] = fullName.split(" ");
    const last = rest.join(" ");

    return {
      firstName: user.profile?.firstName ?? first,
      lastName: user.profile?.lastName ?? last,
      email: user.email ?? "",
      phone: user.phoneNumber ?? user.profile?.phoneNumber ?? "",
      bio: user.profile?.bio ?? "",
      username: user.profile?.username ?? fullName.toLowerCase().replace(/\s+/g, "") ?? "",
      avatarUrl: user.profile?.photoURL ?? user.photoURL ?? "",
      imagePath: user.profile?.imagePath ?? "",
      isProfessional: Boolean(user.customClaims?.isProfessional),
    };
  }, [user]);

  const syncUserData = useCallback(() => {
    if (!user) {
      return;
    }

    const userData = getUserDataFromAuth();
    setEditedUser(userData);
    setInitialProfileData(userData);
    setIsProfessional(Boolean(user.customClaims?.isProfessional));
    // Obtener isPublic del usuario (por defecto true si no existe)
    setIsPublic(user.profile?.isPublic !== false);
  }, [getUserDataFromAuth, user]);

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
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      bio: data.bio.trim(),
      phoneNumber: normalizePhoneToColombia(data.phone) ?? "",
      avatarUrl: data.avatarUrl,
    }),
    [],
  );

  // Función para identificar campos incompletos
  const getIncompleteFields = useCallback((data: UserData): string[] => {
    const incomplete: string[] = [];
    
    if (!data.firstName.trim()) incomplete.push("firstName");
    if (!data.lastName.trim()) incomplete.push("lastName");
    if (!data.username.trim()) incomplete.push("username");
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

    const result = await updateProfileAction({
      uid: user.uid,
      username: editedUser.username.trim(),
      firstName: editedUser.firstName.trim(),
      lastName: editedUser.lastName.trim(),
      bio: editedUser.bio.trim(),
      phoneNumber: editedUser.phone,
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
      firstName: editedUser.firstName.trim(),
      lastName: editedUser.lastName.trim(),
      bio: editedUser.bio.trim(),
      phone: normalizedPhone ?? "",
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

  const renderEditProfile = () => (
    <div className="space-y-6">
      {/* Indicador de perfil incompleto */}
      {hasIncompleteProfile && (
        <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div>
              <p className="font-medium text-amber-900 dark:text-amber-300">
                Tu perfil está incompleto
              </p>
              <p className="mt-1 text-sm text-amber-800 dark:text-amber-400">
                Completa los siguientes campos para tener un perfil más visible en la comunidad
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col items-center gap-4">
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
        <p className="text-sm text-muted-foreground">
          {isUploadingAvatar ? "Subiendo foto..." : "Toca para cambiar la foto (máximo 5MB)"}
        </p>
      </div>

      <div className="space-y-4">
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
            <label className="text-sm font-medium">Nombre de usuario</label>
            {incompleteFields.includes("username") && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                <AlertCircle className="h-3 w-3" />
                Completar
              </span>
            )}
          </div>
          <div className="relative">
            <span className={`absolute left-4 top-1/2 -translate-y-1/2 ${incompleteFields.includes("username") ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`}>
              @
            </span>
            <input
              type="text"
              value={editedUser.username}
              onChange={(e) =>
                setEditedUser({ ...editedUser, username: e.target.value })
              }
              className={`h-11 w-full rounded-lg border pl-8 pr-10 text-sm outline-none transition-colors ${
                incompleteFields.includes("username")
                  ? "border-amber-300 bg-amber-50/50 focus:border-amber-400 dark:border-amber-600/50 dark:bg-amber-950/20"
                  : "border-border bg-background focus:border-brand-violet"
              }`}
            />
            {incompleteFields.includes("username") && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-600 dark:text-amber-400">
                <AlertCircle className="h-4 w-4" />
              </div>
            )}
          </div>
        </div>
        <Field
          label="Correo electrónico"
          type="email"
          value={editedUser.email}
          onChange={(v) => setEditedUser({ ...editedUser, email: v })}
          disabled
        />
        <Field
          label="Teléfono"
          type="tel"
          value={editedUser.phone}
          onChange={(v) => setEditedUser({ ...editedUser, phone: v })}
          isIncomplete={incompleteFields.includes("phone")}
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
            rows={4}
            className={`w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition-colors ${
              incompleteFields.includes("bio")
                ? "border-amber-300 bg-amber-50/50 focus:border-amber-400 dark:border-amber-600/50 dark:bg-amber-950/20"
                : "border-border bg-background focus:border-brand-violet"
            }`}
            placeholder="Cuéntanos sobre ti"
          />
        </div>
      </div>

      <div className="sticky bottom-0 z-10 -mx-4 mt-2 border-t border-border bg-background/95 px-4 pb-1 pt-3 backdrop-blur">
        <Button
          onClick={() => void handleSaveProfile()}
          disabled={isSavingProfile || !hasProfileChanges}
          className="h-11 w-full font-semibold"
        >
          {isSavingProfile ? "Aplicando cambios..." : "Aplicar cambios"}
        </Button>
        {!hasProfileChanges && !isSavingProfile && (
          <p className="mt-2 text-center text-xs text-muted-foreground">No hay cambios pendientes</p>
        )}
        {saveProfileMessage && (
          <p
            className={`mt-2 text-center text-sm font-medium ${
              saveProfileMessage.type === "success" ? "text-green-600" : "text-destructive"
            }`}
          >
            {saveProfileMessage.message}
          </p>
        )}
      </div>
    </div>
  );

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

function Field({
  label,
  value,
  onChange,
  type = "text",
  disabled = false,
  isIncomplete = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  disabled?: boolean;
  isIncomplete?: boolean;
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
          className={`h-11 w-full rounded-lg border px-4 pr-10 text-sm outline-none transition-colors disabled:cursor-not-allowed disabled:bg-muted/50 disabled:text-muted-foreground ${
            isIncomplete
              ? "border-amber-300 bg-amber-50/50 focus:border-amber-400 dark:border-amber-600/50 dark:bg-amber-950/20"
              : "border-border bg-background focus:border-brand-violet"
          }`}
        />
        {isIncomplete && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-600 dark:text-amber-400">
            <AlertCircle className="h-4 w-4" />
          </div>
        )}
      </div>
    </div>
  );
}

