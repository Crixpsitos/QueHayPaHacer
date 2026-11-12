import { isQhpaAdmin } from "@/app/lib/sites/qhpaAdmin";

import { UserAdapter } from "@/infraestructure/adapters/user/UserAdapter";
import { UserFirebaseRepository } from "@/infraestructure/firebase/repositories/user/UserFirebaseRepository";
import { CampaignFirebaseRepository } from "@/infraestructure/firebase/repositories/campaign/CampaignFirebaseRepository";
import { CampaignAdapter } from "@/infraestructure/adapters/campaign/CampaignAdapter";
import { UserService } from "@/application/services/user/UserService";
import { CampaignService } from "@/application/services/campaign/CampaignService";

import { getFirebaseFirestore, getEnterpriseFirestore } from "../firebase/config/admin/firebase";
import { CampaignFirebaseMapper } from "../firebase/mappers/campaing/CampaignFirebaseMapper";
import { UserFirebaseMapper } from "../firebase/mappers/user/UserFirebaseMapper";
import { CategoriesFirebaseRepository } from "../firebase/repositories/categories/CategoriesFirebaseRepository";
import { CategoriesAdapter } from "../adapters/categories/CategoriesAdapter";
import { CategoriesFirebaseMapper } from "../firebase/mappers/categories/CategoriesFirebaseMapper";
import { CategoriesService } from "@/application/services/categories/CategoriesService";
import { EventsFirebaseRepository } from "../firebase/repositories/events/EventsFirebaseRepository";
import { EventsAdapter } from "../adapters/events/EventsAdapter";
import { EventsFirebaseMapper } from "../firebase/mappers/events/EventsFirebaseMapper";
import { EventsService } from "@/application/services/events/EventsService";
import { EventInteractionsFirebaseRepository } from "../firebase/repositories/EventInteraction/EventInteractionsFirebaseRepository";
import { EventInteractionsAdapter } from "../adapters/EventInteraction/EventInteractionsAdapter";
import { EventInteractionsFirebaseMapper } from "../firebase/mappers/EventInteraction/EventInteractionsFirebaseMapper";
import { EventInteractionsService } from "@/application/services/events/EventInteractionsService";
import { UserEventInteractionsProjectionFirebaseRepository } from "../firebase/repositories/EventInteraction/UserEventInteractionsProjectionFirebaseRepository";
import { EventRegistrationFirebaseRepository } from "../firebase/repositories/EventRegistration/EventRegistrationFirebaseRepository";
import { EventRegistrationAdapter } from "../adapters/EventRegistration/EventRegistrationAdapter";
import { EventRegistrationFirebaseMapper } from "../firebase/mappers/EventRegistration/EventRegistrationFirebaseMapper";
import { EventRegistrationService } from "@/application/services/events/EventRegistrationService";
import { EventFeed } from "@/application/aggregations/EventFeed/EventFeed";
import { UserPreferencesAdapter } from "../adapters/UserPreferences/UserPreferencesAdapter";
import { UserPreferencesService } from "@/application/services/user/UserPreferencesService";
import { StorageService } from "../storage/firebase/FirebaseStorageService";
import { UserPreferencesFirebaseRepository } from "../firebase/repositories/UserPreferences/UserPreferencesFirebaseRepository";
import { UserPreferencesFirebaseMapper } from "../firebase/mappers/UserPreferences/UserPreferencesFirebaseMapper";
import { ProfileFirebaseRepository } from "../firebase/repositories/profile/ProfileFirebaseRepository";
import { ProfileAdapter } from "../adapters/profile/ProfileAdapter";
import { ProfileFirebaseMapper } from "../firebase/mappers/profile/ProfileFirebaseMapper";
import { ProfileService } from "@/application/services/profile/ProfileService";
import { BadgeFirebaseRepository } from "../firebase/repositories/user/BadgeFirebaseRepository";
import { BadgeAdapter } from "../adapters/user/BadgeAdapter";
import { BadgeFirebaseMapper } from "../firebase/mappers/user/BadgeFirebaseMapper";
import { BadgeService } from "@/application/services/user/BadgeService";
import { StudioFirebaseRepository } from "../firebase/repositories/studio/StudioFirebaseRepository";
import { StudioAdapter } from "../adapters/studio/StudioAdapter";
import { StudioFirebaseMapper } from "../firebase/mappers/studio/StudioFirebaseMapper";
import { StudioService } from "@/application/services/studio/StudioService";
import { SitesFirebaseRepository } from "../firebase/repositories/sites/SitesFirebaseRepository";
import { SitesAdapter } from "../adapters/sites/SitesAdapter";
import { SiteFirebaseMapper } from "../firebase/mappers/sites/SiteFirebaseMapper";
import { SitesService } from "@/application/services/sites/SitesService";
import { ActivityService } from "@/application/services/activities/ActivityService";
import { HostIdentityService } from "@/application/services/activities/HostIdentityService";
import { ActivityPublishService } from "@/application/services/activities/ActivityPublishService";
import { ActivityReminderService } from "@/application/services/activities/ActivityReminderService";
import { holdsSpot } from "@/domain/entities/activities/activityJoin";
import { ActivityPlansService } from "@/application/services/activities/ActivityPlansService";
import { ActivityJoinService } from "@/application/services/activities/ActivityJoinService";
import { ActivityJoinFirebaseRepository } from "../firebase/repositories/activities/ActivityJoinFirebaseRepository";
import { LEGAL_VERSION } from "@/app/lib/legal/version";
import { reviewKey } from "@/domain/entities/activities/review/reviewIdentity";
import { ActivityReviewService } from "@/application/services/activities/ActivityReviewService";
import { ActivityReviewFirebaseRepository } from "../firebase/repositories/activities/ActivityReviewFirebaseRepository";
import { activityBadgesFor, EXPLORER_MIN_VISITS } from "@/domain/entities/activities/badges";
import { isRestricted } from "@/domain/entities/activities/moderation/reviewModeration";
import { ReviewModerationService } from "@/application/services/activities/ReviewModerationService";
import { ActivitySanctionFirebaseRepository } from "../firebase/repositories/activities/ActivitySanctionFirebaseRepository";
import { RateLimitFirebaseRepository } from "../firebase/repositories/rateLimit/RateLimitFirebaseRepository";
import { getAccountCreatedAt } from "@/app/actions/_accountCreatedAt";
import { PushService } from "@/application/services/push/PushService";
import { PushTokenFirebaseRepository } from "../firebase/repositories/push/PushTokenFirebaseRepository";
import { FcmPushSender } from "../push/FcmPushSender";
import { TransactionalEmailBridge } from "@/application/services/email/TransactionalEmailBridge";
import { ValueEmailRunner } from "@/application/services/email/ValueEmailRunner";
import { buildPool } from "@/domain/entities/email/selection";
import { EmailEventsService } from "@/application/services/email/EmailEventsService";
import { OrganizerEmailRunner } from "@/application/services/email/OrganizerEmailRunner";
import { EmailQueueService } from "@/application/services/email/EmailQueueService";
import { EmailOutboxFirebaseRepository } from "../firebase/repositories/email/EmailOutboxFirebaseRepository";
import { ResendEmailService } from "../email/ResendEmailService";
import { renderEmailHtml } from "../email/renderEmail";
import { NotificationPrefsService } from "@/application/services/notificationPrefs/NotificationPrefsService";
import { NotificationPrefsFirebaseRepository } from "../firebase/repositories/notificationPrefs/NotificationPrefsFirebaseRepository";
import { ActivityStampService } from "@/application/services/activities/ActivityStampService";
import { ActivityStampFirebaseRepository } from "../firebase/repositories/activities/ActivityStampFirebaseRepository";
import { ActivityAppealService } from "@/application/services/activities/ActivityAppealService";
import { ActivityAppealFirebaseRepository } from "../firebase/repositories/activities/ActivityAppealFirebaseRepository";
import { ActivityEngagementService } from "@/application/services/activities/ActivityEngagementService";
import { ActivityEngagementFirebaseRepository } from "../firebase/repositories/activities/ActivityEngagementFirebaseRepository";
import { ActivityAccountFirebaseRepository } from "../firebase/repositories/activities/ActivityAccountFirebaseRepository";
import { HostIdentityFirebaseRepository } from "../firebase/repositories/activities/HostIdentityFirebaseRepository";
import { createIpLimiter } from "@/app/api/_lib/ipRateLimit";
import { ActivityFirebaseRepository } from "../firebase/repositories/activities/ActivityFirebaseRepository";
import { DailyStatsFirebaseRepository } from "@/infraestructure/firebase/repositories/analytics/DailyStatsFirebaseRepository";
import { LinksService } from "@/application/services/links/LinksService";
import { LinksFirebaseRepository } from "@/infraestructure/firebase/repositories/links/LinksFirebaseRepository";
import { EventSessionFirebaseRepository } from "../firebase/repositories/events/EventSessionFirebaseRepository";
import { EventSessionAdapter } from "../adapters/events/EventSessionAdapter";
import { EventSessionFirebaseMapper } from "../firebase/mappers/events/EventSessionFirebaseMapper";
import { EventSessionService } from "@/application/services/events/EventSessionService";
import { ContactFirebaseRepository } from "../firebase/repositories/contact/ContactFirebaseRepository";
import { ContactAdapter } from "../adapters/contact/ContactAdapter";
import { ContactFirebaseMapper } from "../firebase/mappers/contact/ContactFirebaseMapper";
import { ContactService } from "@/application/services/contact/ContactService";
import { SiteInteractionFirebaseRepository } from "../firebase/repositories/SiteInteraction/SiteInteractionFirebaseRepository";
import { SiteInteractionAdapter } from "../adapters/SiteInteraction/SiteInteractionAdapter";
import { SiteInteractionFirebaseMapper } from "../firebase/mappers/SiteInteraction/SiteInteractionFirebaseMapper";
import { ReportFirebaseRepository } from "../firebase/repositories/report/ReportFirebaseRepository";
import { ReportService } from "@/application/services/report/ReportService";
import { ContentDeclarationFirebaseRepository } from "../firebase/repositories/contentDeclaration/ContentDeclarationFirebaseRepository";
import { SiteClaimFirebaseRepository } from "../firebase/repositories/siteClaim/SiteClaimFirebaseRepository";
import { SiteClaimService } from "@/application/services/siteClaim/SiteClaimService";
import { SiteSuggestionFirebaseRepository } from "../firebase/repositories/siteSuggestion/SiteSuggestionFirebaseRepository";
import { SiteSuggestionService } from "@/application/services/siteSuggestion/SiteSuggestionService";
import { NotificationFirebaseRepository } from "../firebase/repositories/notification/NotificationFirebaseRepository";
import { NotificationService } from "@/application/services/notification/NotificationService";
import { ConfigFirebaseRepository } from "../firebase/repositories/config/ConfigFirebaseRepository";
import { TransitRouteService } from "@/application/services/config/TransitRouteService";
import { SiteTransitService } from "@/application/services/sites/SiteTransitService";
import { SiteTransitReportFirebaseRepository } from "../firebase/repositories/siteTransit/SiteTransitReportFirebaseRepository";
import { HolidayService } from "@/application/services/config/HolidayService";
import { ContentDeclarationService } from "@/application/services/contentDeclaration/ContentDeclarationService";
import { SiteInteractionService } from "@/application/services/sites/SiteInteractionService";


/** Consultas de datos de oferentes para quejas: 5 por minuto por persona, en memoria de la instancia. */
const complaintLimiter = createIpLimiter(5);

export const createServerContainer = () => {

  //storage service
  const storageService = new StorageService();
  
  const userFirebaseRepository = new UserFirebaseRepository(getFirebaseFirestore());
  const userRepository = new UserAdapter(userFirebaseRepository, new UserFirebaseMapper());
  const userService = new UserService(userRepository);

  const campaignFirebaseRepository = new CampaignFirebaseRepository(getFirebaseFirestore());
  const campaignRepository = new CampaignAdapter(campaignFirebaseRepository, new CampaignFirebaseMapper());
  const campaignService = new CampaignService(campaignRepository);

  // categories
  const categoriesFirebaseRepository = new CategoriesFirebaseRepository(getFirebaseFirestore());
  const categoriesRepository = new CategoriesAdapter(categoriesFirebaseRepository, new CategoriesFirebaseMapper());
  const categoriesService = new CategoriesService(categoriesRepository);

  // events
  const eventsFirebaseRepository = new EventsFirebaseRepository(getFirebaseFirestore());
  const eventsRepository = new EventsAdapter(eventsFirebaseRepository, new EventsFirebaseMapper());
  const eventsService = new EventsService(eventsRepository, storageService);

  // event sessions (solo para eventos multi-date)
  const eventSessionFirebaseRepository = new EventSessionFirebaseRepository(getFirebaseFirestore());
  const eventSessionRepository = new EventSessionAdapter(
    eventSessionFirebaseRepository,
    new EventSessionFirebaseMapper(),
  );
  const eventSessionService = new EventSessionService(eventSessionRepository);

  // event interactions
  const eventInteractionsFirebaseRepository = new EventInteractionsFirebaseRepository(getFirebaseFirestore());
  const eventInteractionsRepository = new EventInteractionsAdapter(
    eventInteractionsFirebaseRepository,
    new EventInteractionsFirebaseMapper(),
  );
  const userEventInteractionsProjectionRepository =
    new UserEventInteractionsProjectionFirebaseRepository(getFirebaseFirestore());
  const eventInteractionsService = new EventInteractionsService(
    eventInteractionsRepository,
    userEventInteractionsProjectionRepository,
    eventsRepository,
    eventSessionRepository,
  );

  // event registrations
  const eventRegistrationFirebaseRepository = new EventRegistrationFirebaseRepository(getFirebaseFirestore());
  const eventRegistrationRepository = new EventRegistrationAdapter(
    eventRegistrationFirebaseRepository,
    new EventRegistrationFirebaseMapper(),
  );
  const eventRegistrationService = new EventRegistrationService(eventRegistrationRepository);

  const eventFeed = new EventFeed(
    eventsService,
    eventInteractionsService,
  );

  // user preferences
  const userPreferencesFirebaseRepository = new UserPreferencesFirebaseRepository(getFirebaseFirestore());
  const userPreferencesRepository = new UserPreferencesAdapter(userPreferencesFirebaseRepository, new UserPreferencesFirebaseMapper());
  const userPreferencesService = new UserPreferencesService(userPreferencesRepository);

  // profile
  const profileFirebaseRepository = new ProfileFirebaseRepository(getFirebaseFirestore(), getEnterpriseFirestore());
  const profileRepository = new ProfileAdapter(profileFirebaseRepository, new ProfileFirebaseMapper());
  const profileService = new ProfileService(profileRepository);

  // badges
  const badgeFirebaseRepository = new BadgeFirebaseRepository(getFirebaseFirestore());
  const badgeRepository = new BadgeAdapter(badgeFirebaseRepository, new BadgeFirebaseMapper());
  const badgeService = new BadgeService(badgeRepository);

  // sites
  const sitesFirebaseRepository = new SitesFirebaseRepository(getFirebaseFirestore());
  const sitesAdapter = new SitesAdapter(sitesFirebaseRepository, new SiteFirebaseMapper());
  const sitesService = new SitesService(sitesAdapter);

  // actividades (el estado del sitio vinculado decide la visibilidad de las actividades de sitio)
  const activityService = new ActivityService(new ActivityFirebaseRepository(getFirebaseFirestore()), async (siteId) => {
    const s = await sitesService.getActivityLinkSnapshot(siteId);
    return s ? { published: s.published, active: s.active } : null;
  });

  // registro de oferentes (Ley 1480 art. 53); el límite vive a nivel de módulo (createServerContainer se ejecuta en cada llamada)
  const hostIdentityService = new HostIdentityService(new HostIdentityFirebaseRepository(getFirebaseFirestore()), () => new Date(), complaintLimiter);

  // estadísticas diarias por ficha (solo lectura)
  const dailyStatsRepository = new DailyStatsFirebaseRepository(getFirebaseFirestore());

  // enlaces de campaña (/r/<código>)
  const linksService = new LinksService(new LinksFirebaseRepository(getFirebaseFirestore()));

  // studio (Estudio del Organizador)
  const studioFirebaseRepository = new StudioFirebaseRepository(getEnterpriseFirestore());
  const studioRepository = new StudioAdapter(studioFirebaseRepository, new StudioFirebaseMapper());
  const studioService = new StudioService(studioRepository);

  // site interactions
  const siteInteractionFirebaseRepository = new SiteInteractionFirebaseRepository(getFirebaseFirestore());
  const siteInteractionAdapter = new SiteInteractionAdapter(
    siteInteractionFirebaseRepository,
    new SiteInteractionFirebaseMapper(),
  );
  const siteInteractionService = new SiteInteractionService(siteInteractionAdapter);

  // contact
  const contactFirebaseRepository = new ContactFirebaseRepository(getFirebaseFirestore());
  const contactAdapter = new ContactAdapter(contactFirebaseRepository, new ContactFirebaseMapper());
  const contactService = new ContactService(contactAdapter);

  // reports (moderación de contenido)
  const reviewRepoEarly = new ActivityReviewFirebaseRepository(getFirebaseFirestore());
  const reportService = new ReportService(
    new ReportFirebaseRepository(getFirebaseFirestore()),
    eventsService,
    eventSessionService,
    sitesService,
    {
      activity: async (id) => { const a = await activityService.getPublicById(id); return a ? { title: a.title, authorId: a.ownerUid } : null; },
      review: async (compound) => {
        const i = compound.lastIndexOf("_");
        const activityId = compound.slice(0, i), key = compound.slice(i + 1);
        const a = await activityService.getPublicById(activityId);
        const r = a ? (await reviewRepoEarly.listByActivity(activityId, 500)).find((x) => reviewKey(x.activityId, x.uid) === key) : null;
        return a && r ? { title: `${a.title} (reseña)`, authorId: r.uid, reviewId: r.id } : null;
      },
      hideReview: async (reviewId) => { await reviewRepoEarly.setFlag(reviewId, { by: "system", reason: "reports", note: "", at: new Date() }); },
    },
  );

  // declaración del autor al publicar (evidencia legal)
  const contentDeclarationService = new ContentDeclarationService(
    new ContentDeclarationFirebaseRepository(getFirebaseFirestore()),
  );

  // publicar/editar actividades (propiedad del sitio, moderación por confianza, registro de oferente)
  const activityRepository = new ActivityFirebaseRepository(getFirebaseFirestore());
  const activityPublishService = new ActivityPublishService({
    repo: activityRepository,
    accounts: new ActivityAccountFirebaseRepository(getFirebaseFirestore()),
    siteSnapshot: (siteId) => sitesService.getActivityLinkSnapshot(siteId),
    hostGate: (uid) => hostIdentityService.gate(uid),
    declare: (uid, activityId) => contentDeclarationService.record(uid, "activity", activityId),
    markCreator: async (uid) => {
      await userService.markAsCreator(uid);
    },
    hostProfile: async (uid) => {
      const u = await userService.getUserById(uid);
      return { displayName: u?.displayName ?? "", photoURL: u?.photoURL ?? "" };
    },
    clock: () => new Date(),
    log: (entry) => console.log(JSON.stringify(entry)),
  });

  // guardar y "Yo fui" de actividades (solo sobre públicas)
  const engagementRepoForBadges = new ActivityEngagementFirebaseRepository(getFirebaseFirestore());
  const activityEngagementRepoForBadges = () => engagementRepoForBadges;
  const activityEngagementService = new ActivityEngagementService(
    engagementRepoForBadges,
    async (id) => (await activityService.getPublicById(id)) !== null,
    async (uid) => {
      // «Explorador de Ibagué»: 5 actividades distintas con «Yo fui».
      const visits = (await engagementRepoForBadges.listVisitedIds(uid, EXPLORER_MIN_VISITS)).length;
      for (const b of activityBadgesFor({ reviews: 0, visits })) await badgeService.awardBadgeToUser(uid, b, "Yo fui en 5 actividades");
    },
  );

  // reclamos de sitios (dueños que piden verificación)
  const siteClaimService = new SiteClaimService(
    new SiteClaimFirebaseRepository(getFirebaseFirestore()),
    sitesService,
  );

  // sugerencias de cambio de sitios (las revisa el administrador)
  const siteSuggestionService = new SiteSuggestionService(
    new SiteSuggestionFirebaseRepository(getFirebaseFirestore()),
    sitesService,
  );

  // campanita de avisos (invitaciones, moderación, sugerencias)
  const notificationService = new NotificationService(
    new NotificationFirebaseRepository(getFirebaseFirestore()),
  );

  // límites compartidos entre instancias (cooldowns y cuotas diarias), en la base
  const rateLimitRepo = new RateLimitFirebaseRepository(getFirebaseFirestore());

  // correo transaccional de una reserva: el mismo aviso de la campanita, por correo, solo si la persona no lo apagó
  const siteUrlForEmail = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const transactionalEmailBridge = new TransactionalEmailBridge({
    allows: (uid) => notificationPrefsService.allows(uid, "email", "transactional"),
    getEmail: async (uid) => (await userService.getUserById(uid))?.email ?? null,
    enqueue: (item) => emailQueueService.enqueue(item),
    siteUrl: siteUrlForEmail,
    secret: process.env.EMAIL_UNSUBSCRIBE_SECRET,
    clock: () => new Date(),
    render: renderEmailHtml,
  });
  // push web (FCM): solo con la clave VAPID pública configurada; a quien lo autorizó, con tope diario
  const pushService = new PushService({
    tokens: new PushTokenFirebaseRepository(getFirebaseFirestore()),
    sender: new FcmPushSender(),
    rateLimit: rateLimitRepo,
    allows: (uid) => notificationPrefsService.allows(uid, "push", "transactional"),
    clock: () => new Date(),
    enabled: Boolean(process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY),
  });
  const PUSHED = new Set(["activity_join", "activity_join_confirmed", "activity_reminder", "activity_last_spot"]);
  const notifyAndEmail = async (uid: string, n: Parameters<typeof notificationService.notify>[1], id?: string) => {
    await notificationService.notify(uid, n, id);
    await transactionalEmailBridge.fromNotification(uid, n, id);
    if (PUSHED.has(n.type)) await pushService.notify(uid, { title: n.title, body: n.body ?? "", href: n.href ?? "/" });
  };

  // unirse a una salida (cupo opcional) con avisos por la campanita
  const activityJoinService = new ActivityJoinService({
    repo: new ActivityJoinFirebaseRepository(getFirebaseFirestore()),
    getPublic: (id) => activityService.getPublicById(id),
    getForManager: (id, viewer) => activityService.getForManager(id, viewer),
    displayName: async (uid) => (await userService.getUserById(uid))?.displayName ?? "",
    notify: (uid, n, id) => notifyAndEmail(uid, n, id),
    clock: () => new Date(),
    legalVersion: LEGAL_VERSION,
  });

  // reseñas de actividades (una por persona, agregado en la misma transacción)
  const sanctionRepo = new ActivitySanctionFirebaseRepository(getFirebaseFirestore());
  const activityReviewService = new ActivityReviewService({
    repo: new ActivityReviewFirebaseRepository(getFirebaseFirestore()),
    getActivity: async (id) => {
      const a = await activityService.getPublicById(id);
      if (!a) return null;
      const site = a.siteId ? await sitesService.getActivityLinkSnapshot(a.siteId) : null;
      return { id: a.id, slug: a.slug, title: a.title, ownerUid: a.ownerUid, siteOwnerUid: site?.authorId ?? null };
    },
    getAccount: async (uid) => {
      const u = await userService.getUserById(uid);
      // Fecha real de la cuenta según Firebase Auth; si no se puede leer, se trata como NUEVA (el freno de 10 min no se salta).
      const created = await getAccountCreatedAt(uid);
      return u ? { displayName: u.displayName ?? "", photoURL: u.photoURL ?? "", createdAt: new Date(created ?? Date.now()) } : null;
    },
    notify: (uid, n, id) => notificationService.notify(uid, n, id),
    clock: () => new Date(),
    legalVersion: LEGAL_VERSION,
    rateLimit: rateLimitRepo,
    afterCreate: async (uid) => { for (const b of activityBadgesFor({ reviews: 1, visits: 0 })) await badgeService.awardBadgeToUser(uid, b, "Tu primera reseña"); },
    deleteFile: (path) => storageService.delete(path),
    isRestricted: async (uid) => isRestricted(await sanctionRepo.listByUid(uid), uid, "reviewer", new Date()),
  });

  // cuestionar reseñas, responderlas y resolverlas (QHPA)
  const reviewRepo = new ActivityReviewFirebaseRepository(getFirebaseFirestore());
  const reviewModerationService = new ReviewModerationService({
    reviews: reviewRepo,
    sanctions: sanctionRepo,
    getActivity: async (id) => {
      const a = await activityService.getPublicById(id);
      if (!a) return null;
      const site = a.siteId ? await sitesService.getActivityLinkSnapshot(a.siteId) : null;
      return { id: a.id, slug: a.slug, title: a.title, ownerUid: a.ownerUid, siteOwnerUid: site?.authorId ?? null };
    },
    notify: (uid, n, id) => notificationService.notify(uid, n, id),
    clock: () => new Date(),
    log: (m) => console.warn(`[review-moderation] ${m}`),
    rateLimit: rateLimitRepo,
  });

  // preferencias de avisos (correo y push): por defecto todo apagado salvo lo transaccional propio
  const notificationPrefsService = new NotificationPrefsService(new NotificationPrefsFirebaseRepository(getFirebaseFirestore()), LEGAL_VERSION);

  // correo con Resend (desactivado sin RESEND_API_KEY y EMAIL_FROM) y su cola con tope diario
  const emailService = new ResendEmailService(process.env.RESEND_API_KEY, process.env.EMAIL_FROM);
  const emailOutboxRepo = new EmailOutboxFirebaseRepository(getFirebaseFirestore());
  const emailQueueService = new EmailQueueService({
    repo: emailOutboxRepo,
    email: emailService,
    rateLimit: rateLimitRepo,
    cap: Number(process.env.EMAIL_DAILY_CAP) > 0 ? Number(process.env.EMAIL_DAILY_CAP) : 100,
    clock: () => new Date(),
    log: (m) => console.warn(`[email] ${m}`),
  });

  // rebotes y quejas que avisa Resend (webhook firmado)
  const emailEventsService = new EmailEventsService({
    uidByEmailId: (id) => emailOutboxRepo.uidByProviderId(id),
    unsubscribe: (uid) => notificationPrefsService.unsubscribe(uid),
    record: async (id, data) => {
      try { await getFirebaseFirestore().collection("emailEvents").doc(id).create({ ...data, expireAt: new Date(Date.now() + 365 * 86_400_000) }); return true } catch (e) { if ((e as { code?: number }).code === 6) return false; throw e }
    },
    clock: () => new Date(),
    log: (m) => console.warn(`[email] ${m}`),
  });

  // correos de valor («Para ti» diario y resumen semanal), solo a quien los autorizó
  const valueEmailRunner = new ValueEmailRunner({
    optIns: (kind) => notificationPrefsService.uidsWith(kind),
    allows: (uid, kind) => notificationPrefsService.allows(uid, "email", kind),
    getEmail: async (uid) => (await userService.getUserById(uid))?.email ?? null,
    signals: async (uid) => {
      const [saved, visited] = await Promise.all([engagementRepoForBadges.listSavedIds(uid, 50), engagementRepoForBadges.listVisitedIds(uid, 50)]);
      const ids = [...new Set([...saved, ...visited])];
      const byId = new Map((await activityService.listPublic(500)).map((a) => [a.id, a.category]));
      return { categories: ids.map((id) => byId.get(id)).filter((c): c is NonNullable<typeof c> => !!c), excludeIds: ids };
    },
    pool: async () => buildPool(await activityService.listPublic(300), new Date()),
    enqueue: (item) => emailQueueService.enqueue(item),
    siteUrl: siteUrlForEmail,
    secret: process.env.EMAIL_UNSUBSCRIBE_SECRET,
    clock: () => new Date(),
    render: renderEmailHtml,
  });

  // correos para quien organiza: salida sin inscritos y resumen del lunes
  const organizerJoinRepo = new ActivityJoinFirebaseRepository(getFirebaseFirestore());
  const organizerEmailRunner = new OrganizerEmailRunner({
    activities: async () => (await activityService.listPublic(300)).filter((a) => a.join).map((a) => ({ id: a.id, title: a.title, slug: a.slug, ownerUid: a.ownerUid, schedule: a.schedule })),
    counts: (id, keys) => organizerJoinRepo.counts(id, keys),
    joinDates: async (id) => (await organizerJoinRepo.list(id, 500)).map((r) => r.createdAt),
    allows: (uid) => notificationPrefsService.allows(uid, "email", "transactional"),
    getEmail: async (uid) => (await userService.getUserById(uid))?.email ?? null,
    enqueue: (item) => emailQueueService.enqueue(item),
    siteUrl: siteUrlForEmail,
    secret: process.env.EMAIL_UNSUBSCRIBE_SECRET,
    clock: () => new Date(),
    render: renderEmailHtml,
  });

  // pasaporte: sellos por el QR del local (visita verificada)
  const activityStampService = new ActivityStampService({
    repo: new ActivityStampFirebaseRepository(getFirebaseFirestore()),
    isPublic: async (id) => (await activityService.getPublicById(id)) !== null,
    canManage: async (uid, id) => (await activityService.getForManager(id, { uid, isAdmin: isQhpaAdmin(uid) })) !== null,
    markVisited: (uid, id) => activityEngagementService.markVisited(uid, id),
    award: (uid, badge) => badgeService.awardBadgeToUser(uid, badge, "Sellos del pasaporte"),
    newToken: () => crypto.randomUUID().replace(/-/g, ""),
    clock: () => new Date(),
  });

  // apelar una reseña retirada (una sola vez)
  const activityAppealRepo = new ActivityAppealFirebaseRepository(getFirebaseFirestore());
  const activityAppealService = new ActivityAppealService({
    appeals: activityAppealRepo,
    getReview: (id) => reviewRepo.getById(id),
    restore: async (id) => (await reviewRepo.restoreRemoved(id)) !== null,
    clock: () => new Date(),
  });

  // "Mis planes": reservas, guardados y «Yo fui» de la propia cuenta
  const activityEngagementRepo = new ActivityEngagementFirebaseRepository(getFirebaseFirestore());
  const activityJoinRepo = new ActivityJoinFirebaseRepository(getFirebaseFirestore());
  const activityPlansService = new ActivityPlansService({
    savedIds: (uid, n) => activityEngagementRepo.listSavedIds(uid, n),
    visitedIds: (uid, n) => activityEngagementRepo.listVisitedIds(uid, n),
    joins: (uid) => activityJoinRepo.listByUser(uid, 300),
    getPublic: (id) => activityService.getPublicById(id),
    clock: () => new Date(),
  });

  // barrido diario: avisos de «mañana sale» a quien reservó o guardó (lo llama una Cloud Function programada)
  const activityReminderService = new ActivityReminderService({
    listPublic: () => activityService.listPublic(500),
    reservedFor: async (id, key) => (await activityJoinRepo.list(id, 2000)).filter((r) => r.key === key && holdsSpot(r.status)).map((r) => r.uid),
    taken: async (id, key) => (await activityJoinRepo.counts(id, [key]))[key] ?? 0,
    savers: (id) => activityEngagementRepo.listSaverIds(id, 2000),
    notify: (uid, n, id) => notifyAndEmail(uid, n, id),
    clock: () => new Date(),
  });

  // configuración editable por el administrador (festivos; luego rutas de bus)
  const appConfigRepo = new ConfigFirebaseRepository(getFirebaseFirestore());
  const holidayService = new HolidayService(appConfigRepo);
  const transitRouteService = new TransitRouteService(new ConfigFirebaseRepository(getFirebaseFirestore()));
  const siteTransitService = new SiteTransitService(
    new SiteTransitReportFirebaseRepository(getFirebaseFirestore()),
    sitesService,
    transitRouteService,
  );

  return {
    dailyStatsRepository,
    linksService,
    userService,
    campaignService,
    categoriesService,
    eventsService,
    eventSessionService,
    eventInteractionsService,
    eventRegistrationService,
    eventFeed,
    userPreferencesService,
    sitesService,
    activityService,
    activityPublishService,
    activityEngagementService,
    activityReviewService,
    reviewModerationService,
    activityAppealService,
    activityReviewRepo: reviewRepo,
    activityAppealRepoGet: (id: string) => activityAppealRepo.get(id),
    activityJoinService,
    activityPlansService,
    activityReminderService,
    hostIdentityService,
    siteInteractionService,
    storageService,
    profileService,
    badgeService,
    studioService,
    contactService,
    reportService,
    contentDeclarationService,
    siteClaimService,
    siteSuggestionService,
    notificationService,
    holidayService,
    transitRouteService,
    siteTransitService,
    appConfigRepo,
    activityStampService,
    rateLimitRepo,
    notificationPrefsService,
    emailService,
    emailQueueService,
    valueEmailRunner,
    organizerEmailRunner,
    pushService,
    emailEventsService,
  };
};

export const createContainer = createServerContainer;

export type AppContainer = ReturnType<typeof createContainer>;

