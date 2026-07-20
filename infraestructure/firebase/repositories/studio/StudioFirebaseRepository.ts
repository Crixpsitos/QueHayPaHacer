import type { Firestore } from "firebase-admin/firestore";
import type { IStudioRepository } from "@/domain/repository/studio/IStudioRepository";
import type {
  OrganizerOverview,
  OrganizerKpis,
  EventComparisonPoint,
  RegistrationTimelinePoint,
  TopEvent,
  InteractivityPoint,
  GetOrganizerEventsParams,
  OrganizerEventsPage,
  OrganizerEventListItem,
  EventRegistration,
  EventRegistrationsResult,
  GetEventRegistrationsParams,
  EventStats,
  RampUnit,
  FormResponseAnswer,
  SiteAnalytics,
  SiteEvent,
  SiteEventsPage,
  GetSiteEventsParams,
  OrganizerSiteListItem,
  GetStudioListParams,
  Collaborator,
  CollaboratorInvitation,
  SentInvitation,
  UserSearchItem,
  InviteeInput,
  ExternalProfile,
  ExternalProfileInput,
  ExternalProfileType,
  ExternalSocialLinks,
  CollaboratorKind,
  CollaboratorRole,
  AudienceSummary,
  SupportTicket,
  SupportTicketDetail,
  CreateSupportTicketInput,
  MultiDateEventStats,
  MultiDateSessionStats,
} from "@/domain/entities/studio/Studio";
import type { ProfessionalType } from "@/domain/entities/professional/ProfessionalRequest";
import { Pipelines, FieldValue } from "@google-cloud/firestore";
import { Timestamp } from "firebase-admin/firestore";
import { buildWeeklyInteractions, WEEK_SECONDS } from "./weeklyInteractions";

const {
  field,
  sum,
  countAll,
  constant,
  subcollection,
  documentMatches,
  score,
  variable,
} = Pipelines;

/** Datos básicos de un usuario usados para nombrar inscritos en la tabla. */
interface RegistrationUserInfo {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  photoURL?: string;
  /** "personal" | "professional" — determina el "@handle" y el chulito. */
  accountType?: string;
}

/** Mapa `analytics` tal como llega del pipeline: cualquier clave puede faltar. */
interface PipelineAnalytics {
  likes?: number;
  views?: number;
  registrations?: number;
  shares?: number;
  clicks?: number;
  score?: number;
}

/** Fila de sesión del `toArrayExpression()` del join events → sessions. */
interface PipelineSessionRow {
  sessionId?: unknown;
  title?: string;
  status?: string;
  startDate?: unknown;
  analytics?: PipelineAnalytics;
  /** "own" | "parent" | { sessionId } — de dónde toma la portada. */
  coverSource?: "own" | "parent" | { sessionId?: string };
  /** Portada propia (solo cuando `coverSource === "own"`). */
  ownCoverUrl?: string;
}

/**
 * Cada inscripción tal como llega del pipeline-join: campos del documento de
 * `registrations` + `userData` (el usuario unido desde la colección `users`).
 */
interface PipelineRegistrationRow {
  userId?: string;
  name?: string;
  registeredAt?: unknown;
  status?: string;
  checkedInAt?: unknown;
  formData?: Record<string, unknown>;
  userData?: RegistrationUserInfo | null;
}

/**
 * Repositorio Firebase del Estudio del Organizador.
 *
 * STUBS: las firmas están listas pero el cuerpo NO está implementado.
 * El desarrollador implementará aquí la conexión real a Firestore.
 * La UI funciona por ahora con datos MOCK en los ViewModels.
 */
export class StudioFirebaseRepository implements IStudioRepository {
  private readonly now = new Date();
  private readonly startOfCurrentMonth = new Date(
    this.now.getFullYear(),
    this.now.getMonth(),
    1,
  );
  private readonly startOfNextMonth = new Date(
    this.now.getFullYear(),
    this.now.getMonth() + 1,
    1,
  );
  private readonly startOfPreviousMonth = new Date(
    this.now.getFullYear(),
    this.now.getMonth() - 1,
    1,
  );

  constructor(private readonly db: Firestore) {}

  async getOrganizerOverview(uid: string): Promise<OrganizerOverview | null> {
    // Batch 1: KPIs (views, registrations, likes, activeEvents)
    const [
      viewsKpiResult,
      registrationsKpiResult,
      likesKpiResult,
      activeEventsKpiResult,
    ] = await Promise.allSettled([
      this.getViewsKpi(uid),
      this.getRegistrationsKpi(uid),
      this.getLikesKpi(uid),
      this.getActiveEventsKpi(uid),
    ]);

    this.logSettledError("getViewsKpi", viewsKpiResult);
    this.logSettledError("getRegistrationsKpi", registrationsKpiResult);
    this.logSettledError("getLikesKpi", likesKpiResult);
    this.logSettledError("getActiveEventsKpi", activeEventsKpiResult);

    const viewsKpi = this.unwrapSettled(viewsKpiResult, {
      totalViews: 0,
      previousMonthViews: 0,
      viewsChangePct: 0,
    });
    const registrationsKpi = this.unwrapSettled(registrationsKpiResult, {
      totalRegistrations: 0,
      previousMonthRegistrations: 0,
      registrationsChangePct: 0,
    });
    const likesKpi = this.unwrapSettled(likesKpiResult, {
      totalLikes: 0,
      previousMonthLikes: 0,
      likesChangePct: 0,
    });
    const activeEventsKpi = this.unwrapSettled(activeEventsKpiResult, {
      activeEvents: 0,
      previousMonthActiveEvents: 0,
      activeEventsChangePct: 0,
    });

    const kpis: OrganizerKpis = {
      ...viewsKpi,
      ...registrationsKpi,
      ...likesKpi,
      ...activeEventsKpi,
    };

    // Batch 2: Charts (viewsVsRegistrations, registrationsTimeline)
    const [viewsVsRegistrationsResult, registrationsTimelineResult] =
      await Promise.allSettled([
        this.getViewsVsRegistrations(uid),
        this.getRegistrationsTimeline(uid),
      ]);

    this.logSettledError("getViewsVsRegistrations", viewsVsRegistrationsResult);
    this.logSettledError(
      "getRegistrationsTimeline",
      registrationsTimelineResult,
    );

    // Batch 3: Rankings (topEvents, interactivity)
    const [topEventsResult, interactivityResult] = await Promise.allSettled([
      this.getTopEvents(uid),
      this.getInteractivity(uid),
    ]);

    this.logSettledError("getTopEvents", topEventsResult);
    this.logSettledError("getInteractivity", interactivityResult);

    return {
      kpis,
      viewsVsRegistrations: this.unwrapSettled(viewsVsRegistrationsResult, []),
      registrationsTimeline: this.unwrapSettled(
        registrationsTimelineResult,
        [],
      ),
      topEvents: this.unwrapSettled(topEventsResult, []),
      interactivity: this.unwrapSettled(interactivityResult, []),
    };
  }

  private unwrapSettled<T>(result: PromiseSettledResult<T>, fallback: T): T {
    return result.status === "fulfilled" ? result.value : fallback;
  }

  private logSettledError<T>(
    label: string,
    result: PromiseSettledResult<T>,
  ): void {
    if (result.status === "rejected") {
      console.error(`[StudioOverview] ${label} rejected`, result.reason);
    }
  }

  private calculateChangePct(
    currentValue: number,
    previousValue: number,
  ): number {
    if (previousValue <= 0) {
      return currentValue > 0 ? 100 : 0;
    }
    return ((currentValue - previousValue) / previousValue) * 100;
  }

  /**
   * `field("__name__")` devuelve un DocumentReference (con refs internas
   * circulares), no un string. Si se pasa tal cual a un Client Component, la
   * serialización RSC entra en recursión infinita ("Maximum call stack size
   * exceeded"). Convertimos a string (id del documento) para evitarlo.
   */
  private toDocId(value: unknown): string {
    if (typeof value === "string") return value;
    if (value && typeof value === "object") {
      const ref = value as { id?: unknown; path?: unknown };
      if (typeof ref.id === "string") return ref.id;
      if (typeof ref.path === "string")
        return ref.path.split("/").pop() ?? ref.path;
    }
    return String(value ?? "");
  }

  private async getViewsKpi(uid: string): Promise<{
    totalViews: number;
    previousMonthViews: number;
    viewsChangePct: number;
  }> {
    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const startOfPreviousMonth = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1,
    );

    const memoryDebugEnabled = process.env.STUDIO_PIPELINE_MEM_DEBUG === "1";
    const heapBefore = memoryDebugEnabled ? process.memoryUsage().heapUsed : 0;

    let viewsData: { results: Array<{ data: () => unknown }> };
    try {
      viewsData = await this.db
        .pipeline()
        .collection("events")
        .addFields(
          field("createdAt")
            .greaterThanOrEqual(startOfCurrentMonth)
            .as("isCurrentMonth"),
        )
        .where(field("author.id").equal(uid))
        .where(field("createdAt").greaterThanOrEqual(startOfPreviousMonth))
        .where(field("createdAt").lessThan(startOfNextMonth))
        .aggregate({
          accumulators: [sum(field("analytics.views")).as("totalViews")],
          groups: ["isCurrentMonth"],
        })
        .execute();
    } catch (error) {
      console.error("[StudioOverview] getViewsKpi pipeline failed", {
        uid,
        startOfPreviousMonth,
        startOfCurrentMonth,
        startOfNextMonth,
        error,
      });
      throw error;
    }

    if (memoryDebugEnabled) {
      const heapAfter = process.memoryUsage().heapUsed;
      console.log("[StudioOverview] getViewsKpi pipeline memory", {
        uid,
        heapBefore,
        heapAfter,
        heapDelta: heapAfter - heapBefore,
      });
    }

    let currentMonthViews = 0;
    let previousMonthViews = 0;

    viewsData.results.forEach((result) => {
      const row = result.data() as {
        isCurrentMonth?: boolean;
        totalViews?: number;
      };

      const totalViews = Number(row.totalViews ?? 0);
      if (row.isCurrentMonth) {
        currentMonthViews = totalViews;
      } else {
        previousMonthViews = totalViews;
      }
    });

    return {
      totalViews: currentMonthViews,
      previousMonthViews,
      viewsChangePct: this.calculateChangePct(
        currentMonthViews,
        previousMonthViews,
      ),
    };
  }

  private async getRegistrationsKpi(uid: string): Promise<{
    totalRegistrations: number;
    previousMonthRegistrations: number;
    registrationsChangePct: number;
  }> {
    const data = await this.db
      .pipeline()
      .collection("events")
      .where(field("author.id").equal(uid))
      .where(field("createdAt").greaterThanOrEqual(this.startOfPreviousMonth))
      .where(field("createdAt").lessThan(this.startOfNextMonth))
      .where(field("registrationType").notEqual("none"))
      .addFields(
        field("createdAt")
          .greaterThanOrEqual(this.startOfCurrentMonth)
          .as("isCurrentMonth"),
      )
      .aggregate({
        accumulators: [sum(field("analytics.registrations")).as("total")],
        groups: [field("isCurrentMonth").as("isCurrentMonth")],
      })
      .execute();

    let totalRegistrations = 0;
    let previousMonthRegistrations = 0;

    data.results.forEach((result) => {
      const row = result.data() as {
        isCurrentMonth?: boolean;
        total?: number;
      };

      const total = Number(row.total ?? 0);
      if (row.isCurrentMonth) {
        totalRegistrations += total;
      } else {
        previousMonthRegistrations += total;
      }
    });

    return {
      totalRegistrations,
      previousMonthRegistrations,
      registrationsChangePct: this.calculateChangePct(
        totalRegistrations,
        previousMonthRegistrations,
      ),
    };
  }

  private async getLikesKpi(uid: string): Promise<{
    totalLikes: number;
    previousMonthLikes: number;
    likesChangePct: number;
  }> {
    // TODO: implementar lógica real de likes
    const data = await this.db
      .pipeline()
      .collection("events")
      .where(field("author.id").equal(uid))
      .where(field("createdAt").greaterThanOrEqual(this.startOfPreviousMonth))
      .where(field("createdAt").lessThan(this.startOfNextMonth))
      .addFields(
        field("createdAt")
          .greaterThanOrEqual(this.startOfCurrentMonth)
          .as("isCurrentMonth"),
      )
      .aggregate({
        accumulators: [sum(field("analytics.likes")).as("total")],
        groups: [field("isCurrentMonth").as("isCurrentMonth")],
      })
      .execute();

    let totalLikes = 0;
    let previousMonthLikes = 0;
    data.results.forEach((result) => {
      const row = result.data() as {
        isCurrentMonth?: boolean;
        total?: number;
      };

      const total = Number(row.total ?? 0);
      if (row.isCurrentMonth) {
        totalLikes += total;
      } else {
        previousMonthLikes += total;
      }
    });

    return {
      totalLikes,
      previousMonthLikes,
      likesChangePct: this.calculateChangePct(totalLikes, previousMonthLikes),
    };
  }

  private async getActiveEventsKpi(uid: string): Promise<{
    activeEvents: number;
    previousMonthActiveEvents: number;
    activeEventsChangePct: number;
  }> {
    // TODO: implementar lógica real de eventos activos

    const data = await this.db
      .pipeline()
      .collectionGroup("events")
      .where(field("author.id").equal(uid))
      .where(field("createdAt").greaterThanOrEqual(this.startOfPreviousMonth))
      .where(field("createdAt").lessThan(this.startOfNextMonth))
      .where(field("status").equal("published"))
      .addFields(
        field("createdAt")
          .greaterThanOrEqual(this.startOfCurrentMonth)
          .as("isCurrentMonth"),
      )
      .aggregate({
        accumulators: [countAll().as("total")],
        groups: [field("id").as("eventId")],
      })
      .execute();

    let activeEvents = 0;
    let previousMonthActiveEvents = 0;
    data.results.forEach((result) => {
      const row = result.data() as {
        eventId?: string;
        total?: number;
      };

      const total = Number(row.total ?? 0);
      if (row.eventId) {
        activeEvents += total;
      } else {
        previousMonthActiveEvents += total;
      }
    });

    return {
      activeEvents,
      previousMonthActiveEvents,
      activeEventsChangePct: this.calculateChangePct(
        activeEvents,
        previousMonthActiveEvents,
      ),
    };
  }

  private async getViewsVsRegistrations(
    uid: string,
  ): Promise<EventComparisonPoint[]> {
    const result = await this.db
      .pipeline()
      .collection("events")
      .where(field("author.id").equal(uid))
      .select(
        field("__name__").as("eventId"),
        field("title").as("eventName"),
        field("analytics.views").as("views"),
        field("analytics.registrations").as("registrations"),
      )
      .execute();

    return result.results.map((r) => {
      const row = r.data() as {
        eventId: unknown;
        eventName: string;
        views: number;
        registrations: number;
      };

      return {
        eventId: this.toDocId(row.eventId),
        eventName: row.eventName,
        views: Number(row.views ?? 0),
        registrations: Number(row.registrations ?? 0),
      };
    });
  }

  private async getRegistrationsTimeline(
    uid: string,
  ): Promise<RegistrationTimelinePoint[]> {
    const startOfMonthSeconds = Math.floor(
      this.startOfCurrentMonth.getTime() / 1000,
    );

    console.log("startOfMonthSeconds", startOfMonthSeconds);
    console.log("uid", uid);

    const result = await this.db
      .pipeline()
      .collection("events")
      .where(field("author.id").equal(uid))
      .where(field("createdAt").greaterThanOrEqual(this.startOfCurrentMonth))
      .addFields(
        subcollection("registrations")
          .where(
            field("registeredAt").greaterThanOrEqual(this.startOfCurrentMonth),
          )
          .addFields(
            field("registeredAt")
              .timestampToUnixSeconds()
              .subtract(constant(startOfMonthSeconds))
              .divide(constant(86400))
              .floor()
              .add(constant(1))
              .as("day"),
          )
          .aggregate({
            accumulators: [countAll().as("total")],
            groups: [field("day").as("day")],
          })
          .toArrayExpression()
          .as("registrationsByDay"),
      )
      .execute();

    const dayMap = new Map<number, number>();

    result.results.forEach((r) => {
      const row = r.data() as {
        registrationsByDay: { day: number; total: number }[];
      };

      console.log("row.registrationsByDay", row.registrationsByDay);

      row.registrationsByDay?.forEach(({ day, total }) => {
        dayMap.set(day, (dayMap.get(day) ?? 0) + Number(total));
      });
    });

    const daysInMonth = new Date(this.startOfNextMonth.getTime() - 1).getDate();

    return Array.from({ length: daysInMonth }, (_, i) => ({
      date: new Date(this.startOfCurrentMonth.getTime() + 86400 * i * 1000)
        .toISOString()
        .split("T")[0],
      registrations: dayMap.get(i + 1) ?? 0,
    }));
  }

  private async getTopEvents(uid: string): Promise<TopEvent[]> {
    const topEvents = await this.db
      .pipeline()
      .collection("events")
      .where(field("author.id").equal(uid))
      .where(field("createdAt").greaterThanOrEqual(this.startOfPreviousMonth))
      .where(field("createdAt").lessThan(this.startOfNextMonth))
      .sort(field("analytics.score").descending())
      .limit(5)
      .select(
        field("__name__").as("eventId"),
        field("title").as("name"),
        field("analytics.views").as("views"),
        field("analytics.score").as("score"),
      )
      .execute();

    return topEvents.results.map((r) => {
      const row = r.data() as {
        eventId: unknown;
        name: string;
        views: number;
        score: number;
      };

      return {
        eventId: this.toDocId(row.eventId),
        name: row.name,
        views: Number(row.views ?? 0),
        score: Number(row.score ?? 0),
      };
    });
  }

  private async getInteractivity(uid: string): Promise<InteractivityPoint[]> {
    // TODO: implementar lógica real de interactividad
    const interactivityData = await this.db
      .pipeline()
      .collection("events")
      .where(field("author.id").equal(uid))
      .where(field("createdAt").greaterThanOrEqual(this.startOfPreviousMonth))
      .where(field("createdAt").lessThan(this.startOfNextMonth))
      .where(field("status").equal("published"))
      .select(
        field("__name__").as("eventId"),
        field("title").as("eventName"),
        field("analytics.views").as("views"),
        field("analytics.likes").as("likes"),
        field("analytics.shares").as("shares"),
      )
      .limit(4)
      .execute();

    return interactivityData.results.map((r) => {
      const row = r.data() as {
        eventId: unknown;
        eventName: string;
        views: number;
        likes: number;
        shares: number;
      };

      return {
        eventName: row.eventName,
        views: Number(row.views ?? 0),
        likes: Number(row.likes ?? 0),
        shares: Number(row.shares ?? 0),
      };
    });
  }

  /**
   * Lista paginada de "Mis eventos" (tabla del organizador), ordenada por
   * `createdAt` descendente (más reciente primero).
   *
   * Se intentó construir la query con `db.pipeline().createFrom(query)` a
   * partir de una `Query` clásica (con `startAfter`/`endBefore`/`limitToLast`
   * reales) para evitar reimplementar cursores a mano, pero el cursor no se
   * estaba propagando bien al convertir a Pipeline (la página 2 volvía
   * vacía). Se revierte a filtrar/ordenar directamente con el DSL de
   * Pipelines, que sí trae datos reales en todas las páginas.
   *
   * Paginación por cursor (no por offset): el cursor es el `createdAt` (ISO)
   * del evento límite de la página actual. `direction: "next"` pide eventos
   * más viejos que el cursor; `"prev"` pide eventos más nuevos. Se pide
   * `limit + 1` para saber si hay una página siguiente sin una segunda query.
   *
   * Simplificación a propósito: el desempate usa solo `createdAt`, sin
   * `__name__` como segundo criterio. Los IDs autogenerados de Firestore no
   * están ordenados cronológicamente, así que no sirven como criterio
   * principal de orden; como desempate sí ayudarían, pero con timestamps de
   * creación (no fechas redondas) la probabilidad de colisión es marginal
   * para un MVP.
   */
  async getOrganizerEvents(
    uid: string,
    { limit, cursor, direction = "next", search }: GetOrganizerEventsParams,
  ): Promise<OrganizerEventsPage> {
    const isPrev = Boolean(cursor) && direction === "prev";
    const cursorDate = cursor ? new Date(cursor) : undefined;

    const collection = this.db.pipeline().collection("events");

    // `search()` debe ser el PRIMER stage tras `collection()`; los `where` van
    // después. Sin búsqueda, arrancamos directo con el filtro por organizador.
    let stage = search
      ? collection
          .search({
            query: documentMatches(search),
            sort: score().descending(),
          })
          .where(field("author.id").equal(uid))
      : collection.where(field("author.id").equal(uid));

    if (cursorDate) {
      stage = stage.where(
        isPrev
          ? field("createdAt").greaterThan(cursorDate)
          : field("createdAt").lessThan(cursorDate),
      );
    }

    const result = await stage
      .sort(
        isPrev
          ? field("createdAt").ascending()
          : field("createdAt").descending(),
      )
      .limit(limit + 1)
      .select(
        field("__name__").as("eventId"),
        field("title").as("name"),
        field("status").as("status"),
        field("startDate").as("date"),
        field("mainImage.url").as("image"),
        field("analytics.views").as("views"),
        field("analytics.registrations").as("registrations"),
        field("registrationType").as("registrationType"),
        field("createdAt").as("createdAt"),
      )
      .execute();

    let rows = result.results.map(
      (r) =>
        r.data() as {
          eventId: unknown;
          name: string;
          status: string;
          date: unknown;
          image?: string;
          views?: number;
          registrations?: number;
          registrationType: OrganizerEventListItem["registrationType"];
          createdAt: unknown;
        },
    );

    // En "prev" se consultó ascendente (para poder usar el mismo cursor de
    // frontera); se revierte para devolver siempre el orden de despliegue (desc).
    if (isPrev) rows = rows.reverse();

    const hasMore = rows.length > limit;
    // En "next" el extra (si lo hay) queda al final del array (es el más
    // viejo del lote). En "prev", tras revertir a orden desc, el extra queda
    // al INICIO (es el más nuevo del lote, el más alejado del cursor).
    const pageRows = hasMore
      ? isPrev
        ? rows.slice(1)
        : rows.slice(0, limit)
      : rows;

    /**
     * Los timestamps que devuelve `Pipeline.execute()` NO son instancias de
     * `Timestamp` (a diferencia de `.get()` clásico): llegan como el objeto
     * "proto" `{ _seconds, _nanoseconds }`. Por eso no basta con `instanceof`.
     */
    const toDate = (value: unknown): Date => {
      if (value instanceof Date) return value;
      if (value instanceof Timestamp) return value.toDate();
      if (value && typeof value === "object" && "_seconds" in value) {
        const { _seconds, _nanoseconds } = value as {
          _seconds: number;
          _nanoseconds: number;
        };
        return new Date(
          _seconds * 1000 + Math.floor((_nanoseconds ?? 0) / 1e6),
        );
      }
      return new Date(value as string | number);
    };

    const events: OrganizerEventListItem[] = pageRows.map((row) => ({
      eventId: this.toDocId(row.eventId),
      name: row.name,
      status: row.status,
      date: row.date ? toDate(row.date) : null,
      image: row.image,
      views: Number(row.views ?? 0),
      registrations: Number(row.registrations ?? 0),
      registrationType: row.registrationType,
      createdAt: toDate(row.createdAt),
    }));

    // Ojo: `hasMore` solo dice si hay más en la dirección consultada. La
    // dirección contraria está garantizada por construcción: si llegaste con
    // un cursor, siempre puedes volver hacia donde estabas. El bug anterior
    // era usar el mismo `hasMore` para las dos direcciones sin distinguir.
    const nextCursor = isPrev
      ? events.length > 0
        ? events[events.length - 1].createdAt.toISOString()
        : null
      : hasMore
        ? events[events.length - 1].createdAt.toISOString()
        : null;

    const prevCursor = isPrev
      ? hasMore
        ? events[0].createdAt.toISOString()
        : null
      : cursorDate && events.length > 0
        ? events[0].createdAt.toISOString()
        : null;

    return { events, nextCursor, prevCursor };
  }

  /**
   * Página de inscritos con paginación por CURSOR (next/prev), búsqueda y orden,
   * mismo patrón que `getOrganizerEvents`. El cursor es el valor del campo de
   * orden (ISO de `registeredAt`, o el `name` guardado) de la fila límite.
   *
   * Nota: la paginación por cursor exige ordenar/cursorear por un campo del
   * documento de la inscripción. Por eso el orden por nombre usa el `name`
   * DENORMALIZADO de la inscripción (no el `firstName` del perfil, que viene del
   * join y no se puede cursorear de forma fiable).
   */
  async getEventRegistrations(
    eventId: string,
    params: GetEventRegistrationsParams = {},
    sessionId?: string,
  ): Promise<EventRegistrationsResult | null> {
    try {
      const {
        sortBy = "registeredAt",
        sortDir = "desc",
        limit = 10,
        cursor,
        direction = "next",
        search,
      } = params;

      const EMPTY = { registrations: [], nextCursor: null, prevCursor: null };

      // 1) Metadatos del evento o de la sesión (tipo de registro, formulario,
      // externo): una sesión define los suyos propios, no hereda los del padre.
      const basePath = this.docPath(eventId, sessionId);
      const eventSnap = await this.db.doc(basePath).get();
      if (!eventSnap.exists) return null;

      const event = eventSnap.data() as {
        registrationType?: EventStats["registrationType"];
        externalUrl?: string;
        requiresAttendance?: boolean;
        registrationEventForm?: { fields?: { id: string; label: string }[] };
        analytics?: { clicks?: number };
      };
      const registrationType = event.registrationType ?? "none";
      const requiresAttendance = event.requiresAttendance ?? false;

      // "external": no hay inscritos, solo clicks al botón externo.
      if (registrationType === "external") {
        return {
          registrationType: "external",
          ...EMPTY,
          requiresAttendance,
          externalClicks: Number(event.analytics?.clicks ?? 0),
          externalUrl: event.externalUrl,
        };
      }

      // "none": no se recolectan inscripciones.
      if (registrationType === "none") {
        return { registrationType: "none", ...EMPTY, requiresAttendance };
      }

      // 2) Página de inscritos sobre la subcolección, con JOIN a `users`.
      const fieldLabels = new Map<string, string>(
        (event.registrationEventForm?.fields ?? []).map((f) => [f.id, f.label]),
      );

      const sortField =
        sortBy === "name" ? field("name") : field("registeredAt");

      const displayAsc = sortDir === "asc";
      const isPrev = Boolean(cursor) && direction === "prev";
      const queryAsc = isPrev ? !displayAsc : displayAsc;

      const cursorValue =
        cursor != null
          ? sortBy === "name"
            ? cursor
            : new Date(cursor)
          : undefined;

      const collection = this.db
        .pipeline()
        .collection(`${basePath}/registrations`);

      // Búsqueda por texto sobre el índice tokenizado (`name` + `email`). Es la
      // única opción realmente indexada en Firestore Enterprise: el plan usa
      // `StIndexSearch` (lee solo los documentos que matchean), con costo
      // constante sin importar cuántos inscritos tenga el evento. Las
      // alternativas de substring/prefijo (`stringContains`, rangos) hacen
      // `TableScan` de toda la subcolección, costoso a escala.
      //
      // Contrapartida: matchea por TOKENS (palabras completas), no por prefijo.
      // "cristian" encuentra "cristian.montealegre" (el tokenizador parte en el
      // "."), pero "cri" no filtra hasta completar la palabra.
      let stage = search
        ? collection.search({
            query: documentMatches(search),
            sort: score().descending(),
          })
        : collection;

      if (cursorValue !== undefined) {
        stage = stage.where(
          queryAsc
            ? sortField.greaterThan(cursorValue)
            : sortField.lessThan(cursorValue),
        );
      }

      // limit + 1 para saber si hay página siguiente sin una segunda query.
      const result = await stage
        .sort(queryAsc ? sortField.ascending() : sortField.descending())
        .limit(limit + 1)
        .define(field("userId").as("userId"))
        .addFields(
          this.db
            .pipeline()
            .collection("users")
            .where(field("uid").equal(variable("userId")))
            // `accountType` decide el "@handle" y el chulito de verificado.
            .select(
              "firstName",
              "lastName",
              "displayName",
              "photoURL",
              "accountType",
            )
            .toScalarExpression()
            .as("userData"),
        )
        .select(
          "userId",
          "name",
          "registeredAt",
          "status",
          "checkedInAt",
          "formData",
          "userData",
        )
        .execute();

      let rawRows = result.results.map(
        (r) => r.data() as PipelineRegistrationRow,
      );

      // En "prev" se consultó al revés; se revierte al orden de despliegue.
      if (isPrev) rawRows = rawRows.reverse();

      const hasMore = rawRows.length > limit;
      // El extra (la fila limit+1) marca que hay más en esa dirección: en "next"
      // queda al final; en "prev" (tras revertir) queda al inicio.
      const pageRows = hasMore
        ? isPrev
          ? rawRows.slice(1)
          : rawRows.slice(0, limit)
        : rawRows;

      // Valor de cursor de una fila según el campo de orden.
      const cursorOf = (rrow: PipelineRegistrationRow): string =>
        sortBy === "name"
          ? (rrow.name ?? "")
          : (this.toDateOrNull(rrow.registeredAt)?.toISOString() ?? "");

      const nextCursor = isPrev
        ? pageRows.length > 0
          ? cursorOf(pageRows[pageRows.length - 1])
          : null
        : hasMore
          ? cursorOf(pageRows[pageRows.length - 1])
          : null;

      const prevCursor = isPrev
        ? hasMore
          ? cursorOf(pageRows[0])
          : null
        : cursor && pageRows.length > 0
          ? cursorOf(pageRows[0])
          : null;

      const registrations = pageRows.map((entry) =>
        this.mapRegistrationEntry(entry, fieldLabels),
      );

      return { registrationType, registrations, requiresAttendance, nextCursor, prevCursor };
    } catch (error) {
      console.log("getEventRegistrations error", { eventId, params, error });
      throw error;
    }
  }

  /** Inscripción del pipeline (con `userData` ya unido) → dominio. */
  private mapRegistrationEntry(
    entry: PipelineRegistrationRow,
    fieldLabels: Map<string, string>,
  ): EventRegistration {
    const user = entry.userData ?? undefined;
    const hasRealName = Boolean(user?.firstName || user?.lastName);

    // Si el usuario no tiene firstName/lastName, usamos el `name` denormalizado
    // que se guardó al registrarse (una sola cadena con el nombre completo).
    const firstName = hasRealName
      ? (user?.firstName ?? "")
      : (entry.name ?? "");
    const lastName = hasRealName ? (user?.lastName ?? "") : "";

    const registeredAt = this.toDateOrNull(entry.registeredAt) ?? new Date(0);

    // Asistencia: confirmada si quedó "accepted" o si tiene check-in.
    const attendanceConfirmed =
      entry.status === "accepted" || Boolean(entry.checkedInAt);

    const formResponses = entry.formData
      ? Object.entries(entry.formData).map(([fieldId, value]) => ({
          fieldId,
          label: fieldLabels.get(fieldId) ?? fieldId,
          value: this.stringifyAnswer(value),
        }))
      : undefined;

    return {
      userId: entry.userId ?? "",
      firstName,
      lastName,
      displayName: user?.displayName,
      photoURL: user?.photoURL,
      isProfessional: user?.accountType === "professional",
      registeredAt,
      attendanceConfirmed,
      formResponses,
    };
  }

  /** Normaliza una respuesta de formulario (array/objeto/escalar) a string. */
  private stringifyAnswer(value: unknown): string {
    if (value == null) return "";
    if (Array.isArray(value)) return value.map((v) => String(v)).join(", ");
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  }

  /**
   * Path del documento cuyas métricas se piden: el evento, o una sesión suya.
   *
   * Una sesión tiene la MISMA forma que un evento para el Estudio (fecha,
   * `registrationType`, `registrationEventForm`, `analytics` y su propia
   * subcolección `registrations`), así que todo el pipeline de stats/registros
   * funciona igual apuntando a otro path. Por eso se parametriza en vez de
   * duplicar los métodos.
   */
  private docPath(eventId: string, sessionId?: string): string {
    return sessionId
      ? `events/${eventId}/sessions/${sessionId}`
      : `events/${eventId}`;
  }

  async getEventStats(
    eventId: string,
    sessionId?: string,
  ): Promise<EventStats | null> {
    const path = this.docPath(eventId, sessionId);
    const result = await this.db.doc(path).get();
    if (!result.exists) return null;

    const data = result.data() as {
      title?: string;
      name?: string;
      status?: string;
      startDate?: unknown;
      endDate?: unknown;
      registrationType?: EventStats["registrationType"];
      analytics?: {
        views?: number;
        registrations?: number;
        clicks?: number;
        likes?: number;
        shares?: number;
        score?: number;
      };
    };

    const startDate = this.toDateOrNull(data.startDate);
    const endDate = this.toDateOrNull(data.endDate);

    const { rampUnit, points: registrationRamp } =
      startDate && endDate
        ? await this.getRegistrationRamp(path, startDate, endDate)
        : { rampUnit: "day" as RampUnit, points: [] };

    return {
      eventId: sessionId ?? eventId,
      // Eventos y sesiones guardan `title`; `name` queda como respaldo (el resto
      // del repo ya hace `field("title").as("name")` por lo mismo).
      name: data.title ?? data.name ?? "",
      status: data.status ?? "draft",
      date: startDate ?? new Date(0),
      registrationType: data.registrationType ?? "none",
      views: Number(data.analytics?.views ?? 0),
      registrations: Number(data.analytics?.registrations ?? 0),
      clicks: Number(data.analytics?.clicks ?? 0),
      likes: Number(data.analytics?.likes ?? 0),
      shares: Number(data.analytics?.shares ?? 0),
      score: Number(data.analytics?.score ?? 0),
      rampUnit,
      registrationRamp,
    };
  }

  /**
   * Analíticas de un evento multi-date en UNA sola query: el doc del evento
   * unido con su subcolección `sessions` vía `toArrayExpression()`.
   *
   * Devuelve dos campos aliaseados: `analyticsEvents` (el mapa `analytics` del
   * padre) y `analyticsSessions` (un array con los datos de cada sesión). El
   * acumulado (padre + sesiones) se calcula aquí, no en Firestore, porque el
   * array ya viene en memoria y sumarlo es trivial.
   *
   * Ojo con dos cosas verificadas contra la base real:
   *  - Los campos ausentes se OMITEN del resultado (una sesión sin likes no
   *    trae `analytics`, un draft solo trae `analytics.score`) → todo con `?? 0`.
   *  - `__name__` llega como DocumentReference (con refs circulares internas);
   *    hay que pasarlo por `toDocId` o la serialización RSC entra en recursión.
   */
  async getMultiDateEventStats(
    eventId: string,
  ): Promise<MultiDateEventStats | null> {
    const result = await this.db
      .pipeline()
      .documents([`/events/${eventId}`])
      .select(
        field("__name__").as("eventId"),
        field("title").as("name"),
        field("status").as("status"),
        field("eventType").as("eventType"),
        field("mainImage.url").as("parentCoverUrl"),
        field("analytics").as("analyticsEvents"),
        subcollection("sessions")
          .sort(field("startDate").ascending())
          .select(
            field("__name__").as("sessionId"),
            field("title").as("title"),
            field("status").as("status"),
            field("startDate").as("startDate"),
            field("coverSource").as("coverSource"),
            field("mainImage.url").as("ownCoverUrl"),
            field("analytics").as("analytics"),
          )
          .toArrayExpression()
          .as("analyticsSessions"),
      )
      .execute();

    const row = result.results[0]?.data() as
      | {
          eventId?: unknown;
          name?: string;
          status?: string;
          eventType?: string;
          parentCoverUrl?: string;
          analyticsEvents?: PipelineAnalytics;
          analyticsSessions?: PipelineSessionRow[];
        }
      | undefined;

    if (!row) return null;

    const eventAnalytics = row.analyticsEvents ?? {};
    const rawSessions = row.analyticsSessions ?? [];

    const sessions: MultiDateSessionStats[] = rawSessions.map((s) => ({
      sessionId: this.toDocId(s.sessionId),
      title: s.title ?? "Sesión sin título",
      status: s.status ?? "draft",
      startDate: this.toDateOrNull(s.startDate),
      image: this.resolveSessionCover(s, row.parentCoverUrl, rawSessions),
      views: Number(s.analytics?.views ?? 0),
      registrations: Number(s.analytics?.registrations ?? 0),
      shares: Number(s.analytics?.shares ?? 0),
    }));

    const event = {
      likes: Number(eventAnalytics.likes ?? 0),
      views: Number(eventAnalytics.views ?? 0),
      registrations: Number(eventAnalytics.registrations ?? 0),
      shares: Number(eventAnalytics.shares ?? 0),
      score: Number(eventAnalytics.score ?? 0),
    };

    const sum = (pick: (s: MultiDateSessionStats) => number) =>
      sessions.reduce((acc, s) => acc + pick(s), 0);

    return {
      eventId: this.toDocId(row.eventId),
      name: row.name ?? "Evento sin título",
      status: row.status ?? "draft",
      image: row.parentCoverUrl,
      event,
      sessions,
      // Sin `likes`: sumarlos contaría dos veces al mismo uid (like al evento +
      // like a una fecha). Los likes salen tal cual en `event.likes`.
      totals: {
        views: event.views + sum((s) => s.views),
        registrations: event.registrations + sum((s) => s.registrations),
        shares: event.shares + sum((s) => s.shares),
      },
    };
  }

  /**
   * Portada de una sesión según su `coverSource`: propia, heredada del evento
   * padre, o tomada de otra sesión. Misma lógica que `SessionViewModelMapper`
   * del lado público (allí se resuelve sobre entidades; aquí sobre las filas
   * del pipeline, que no pasan por el mapper).
   */
  private resolveSessionCover(
    session: PipelineSessionRow,
    parentCoverUrl: string | undefined,
    allSessions: PipelineSessionRow[],
  ): string | undefined {
    const source = session.coverSource;
    if (source === "parent") return parentCoverUrl;
    if (source === "own") return session.ownCoverUrl;
    if (source && typeof source === "object" && source.sessionId) {
      const refId = source.sessionId;
      const ref = allSessions.find((s) => this.toDocId(s.sessionId) === refId);
      return ref?.ownCoverUrl;
    }
    // Sin `coverSource` (sesiones viejas): cae a la portada del evento.
    return parentCoverUrl;
  }

  /** Convierte un Timestamp/Date de Firestore a Date, o null si no es válido. */
  private toDateOrNull(value: unknown): Date | null {
    if (value instanceof Date) return value;
    if (value && typeof value === "object") {
      // `.get()` clásico: Timestamp con método toDate().
      if (
        "toDate" in value &&
        typeof (value as { toDate: unknown }).toDate === "function"
      ) {
        return (value as { toDate: () => Date }).toDate();
      }
      // Pipeline `execute()`: el proto `{ _seconds, _nanoseconds }`.
      if ("_seconds" in value) {
        const { _seconds, _nanoseconds } = value as {
          _seconds: number;
          _nanoseconds?: number;
        };
        return new Date(_seconds * 1000 + Math.floor((_nanoseconds ?? 0) / 1e6));
      }
    }
    return null;
  }

  /**
   * Curva de inscripciones acumuladas según las unidades previas al inicio del
   * evento (`startDate`). Se cuentan los registros hasta `endDate`.
   *
   * La unidad del eje es ADAPTATIVA según el horizonte del evento:
   *   - ventana ≤ 48 h (desde la primera inscripción) → eje por HORAS,
   *   - ventana > 48 h → eje por DÍAS.
   * Así la curva es útil tanto para eventos de varios días como para los de
   * corto plazo (mismo día, un día después), donde un eje en días se degenera
   * a un solo punto.
   *
   * Se agrega siempre por hora en Firestore y se decide/colapsa la unidad en
   * memoria (una sola query). `unitsBeforeEvent`:
   *   - valores grandes = inscripciones tempranas (lejos del evento),
   *   - 0 = la hora/día del evento (o después, ya clamp-eado a 0).
   * El resultado va ordenado de mayor a menor para que la línea suba de
   * izquierda (lejos del evento) a derecha (inicio del evento).
   */
  private async getRegistrationRamp(
    docPath: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{ rampUnit: RampUnit; points: EventStats["registrationRamp"] }> {
    const startSeconds = Math.floor(startDate.getTime() / 1000);
    const HOURS_THRESHOLD = 48; // ventana máx. para usar eje por horas

    const result = await this.db
      .pipeline()
      .collection(`${docPath}/registrations`)
      .where(field("registeredAt").lessThanOrEqual(endDate))
      .addFields(
        constant(startSeconds)
          .subtract(field("registeredAt").timestampToUnixSeconds())
          .divide(constant(3600))
          .floor()
          .as("hoursBefore"),
      )
      .aggregate({
        accumulators: [countAll().as("total")],
        groups: [field("hoursBefore").as("hoursBefore")],
      })
      .execute();

    // Inscripciones nuevas por hora (clamp de negativos a 0 = hora del evento).
    const newByHour = new Map<number, number>();
    result.results.forEach((r) => {
      const row = r.data() as { hoursBefore: number; total: number };
      const hour = Math.max(0, Number(row.hoursBefore ?? 0));
      newByHour.set(hour, (newByHour.get(hour) ?? 0) + Number(row.total ?? 0));
    });

    if (newByHour.size === 0) return { rampUnit: "day", points: [] };

    const maxHour = Math.max(...newByHour.keys());

    // Densifica un mapa de "unidades antes del evento" → curva continua:
    // un punto por cada unidad desde la más lejana hasta 0, arrastrando el
    // acumulado aunque esa unidad no haya tenido altas.
    const densify = (
      newByUnit: Map<number, number>,
      maxUnit: number,
    ): EventStats["registrationRamp"] => {
      const points: EventStats["registrationRamp"] = [];
      let cumulative = 0;
      for (let unitsBeforeEvent = maxUnit; unitsBeforeEvent >= 0; unitsBeforeEvent--) {
        cumulative += newByUnit.get(unitsBeforeEvent) ?? 0;
        points.push({ unitsBeforeEvent, cumulativeRegistrations: cumulative });
      }
      return points;
    };

    // Horizonte corto → eje por horas.
    if (maxHour <= HOURS_THRESHOLD) {
      return { rampUnit: "hour", points: densify(newByHour, maxHour) };
    }

    // Horizonte largo → colapsar las horas a días.
    const newByDay = new Map<number, number>();
    newByHour.forEach((count, hour) => {
      const day = Math.floor(hour / 24);
      newByDay.set(day, (newByDay.get(day) ?? 0) + count);
    });
    const maxDay = Math.floor(maxHour / 24);
    return { rampUnit: "day", points: densify(newByDay, maxDay) };
  }

  /**
   * Marca la asistencia de un inscrito con un check-in (`checkedInAt`). El
   * lector deriva `attendanceConfirmed` de `status === "accepted" || checkedInAt`,
   * así que basta con sellar la marca de tiempo del servidor. Usa `update`, que
   * falla si la inscripción no existe (la UI solo ofrece el botón en filas reales).
   */
  async confirmAttendance(
    eventId: string,
    userId: string,
    sessionId?: string,
  ): Promise<void> {
    const regRef = this.db
      .collection(`${this.docPath(eventId, sessionId)}/registrations`)
      .doc(userId);
    await regRef.update({ checkedInAt: FieldValue.serverTimestamp() });
  }

  /**
   * Quita un inscrito del evento: borra su documento de la subcolección y
   * decrementa el contador denormalizado `analytics.registrations` (simétrico
   * al incremento que hace el registro). Transaccional para leer el contador y
   * escribir de forma consistente; idempotente: si la inscripción ya no existe,
   * no hace nada (ni decrementa de más). El contador nunca baja de 0.
   */
  async removeParticipant(
    eventId: string,
    userId: string,
    sessionId?: string,
  ): Promise<void> {
    // El contador a decrementar vive en el MISMO doc que la subcolección de
    // inscritos: si el registro fue a una sesión, el contador es el de la sesión.
    const targetRef = this.db.doc(this.docPath(eventId, sessionId));
    const regRef = targetRef.collection("registrations").doc(userId);

    await this.db.runTransaction(async (tx) => {
      const regSnap = await tx.get(regRef);
      if (!regSnap.exists) return; // ya removido → no-op

      const targetSnap = await tx.get(targetRef);
      const current = Number(targetSnap.get("analytics.registrations") ?? 0);

      tx.delete(regRef);
      tx.update(targetRef, {
        "analytics.registrations": Math.max(0, current - 1),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });
  }

  /**
   * Suma 1 al contador de clics del botón de registro externo (`analytics.clicks`).
   * Cuenta CADA clic, sin deduplicar por usuario ni exigir sesión: mide cuánta
   * gente fue enviada al sitio externo, no cuántos se registraron (eso no lo
   * controlamos). Por eso lo puede disparar cualquier visitante, logueado o no.
   */
  async incrementExternalRegistrationClick(eventId: string): Promise<void> {
    await this.db.collection("events").doc(eventId).update({
      "analytics.clicks": FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  async getFormResponses(
    eventId: string,
    userId: string,
  ): Promise<FormResponseAnswer[]> {
    // TODO: implementación del repositorio (la hago yo)
    void eventId;
    void userId;
    return [];
  }

  /**
   * Analíticas de un sitio: totales acumulados (de los contadores del doc) +
   * interactividad por SEMANA de la ventana reciente.
   *
   * El desglose temporal se obtiene del log `sites/{id}/interactions` (un doc
   * por interacción con `{ type, createdAt }`). Se bucketea EN el pipeline con
   * el mismo patrón que `getRegistrationsTimeline`, pero dividiendo por
   * `WEEK_SECONDS` (semana) y agrupando también por `type`. Los contadores
   * acumulados del doc (`analytics.*`) NO tienen historia, así que solo sirven
   * para los totales, no para la serie.
   */
  async getSiteAnalytics(siteId: string): Promise<SiteAnalytics | null> {
    const WEEKS = 8;

    // Ventana: últimas WEEKS semanas, alineada a medianoche de hoy. El bucket 0
    // es la semana más vieja; el bucket WEEKS-1 es la semana en curso. Como
    // `createdAt >= windowStart`, el índice de semana siempre cae en [0, WEEKS-1].
    const windowStart = new Date();
    windowStart.setHours(0, 0, 0, 0);
    windowStart.setDate(windowStart.getDate() - 7 * (WEEKS - 1));
    const windowStartSeconds = Math.floor(windowStart.getTime() / 1000);

    // El doc del sitio (contadores + meta) y el aggregate de interacciones son
    // independientes → en paralelo. Mismo costo de lecturas, menos latencia.
    const [snap, result] = await Promise.all([
      this.db.collection("sites").doc(siteId).get(),
      this.db
        .pipeline()
        .collection(`sites/${siteId}/interactions`)
        .where(field("createdAt").greaterThanOrEqual(windowStart))
        .addFields(
          field("createdAt")
            .timestampToUnixSeconds()
            .subtract(constant(windowStartSeconds))
            .divide(constant(WEEK_SECONDS))
            .floor()
            .as("week"),
        )
        .aggregate({
          accumulators: [countAll().as("total")],
          groups: [field("week").as("week"), field("type").as("type")],
        })
        .execute(),
    ]);

    if (!snap.exists) return null;

    const data = snap.data() as {
      name?: string;
      category?: string;
      media?: Array<{ type?: string; url?: string; isCover?: boolean }>;
      analytics?: { clicks?: number; likes?: number; shares?: number; eventCount?: number };
    };

    const media = Array.isArray(data.media) ? data.media : [];
    const cover =
      media.find((m) => m.type === "image" && m.isCover) ??
      media.find((m) => m.type === "image");
    const image = typeof cover?.url === "string" ? cover.url : undefined;
    const analytics = data.analytics ?? {};

    const rows = result.results.map((r) => {
      const row = r.data() as { week?: number; type?: string; total?: number };
      return {
        week: Number(row.week ?? 0),
        type: String(row.type ?? ""),
        total: Number(row.total ?? 0),
      };
    });

    return {
      siteId,
      name: data.name ?? "Sitio sin nombre",
      category: data.category ?? "",
      image,
      totalClicks: Number(analytics.clicks ?? 0),
      totalLikes: Number(analytics.likes ?? 0),
      totalShares: Number(analytics.shares ?? 0),
      interactionsOverTime: buildWeeklyInteractions(rows, windowStartSeconds, WEEKS),
      eventsCount: Number(analytics.eventCount ?? 0),
    };
  }

  /**
   * Grid de "Sitios" del organizador: pipeline sobre `sites` filtrando por
   * `author.id`, con búsqueda full-text opcional (`documentMatches`) y `limit`.
   * SIN paginación. Mismo patrón de búsqueda que `getOrganizerEvents`.
   */
  async getOrganizerSites(
    uid: string,
    { search, limit = 12 }: GetStudioListParams = {},
  ): Promise<OrganizerSiteListItem[]> {
    const collection = this.db.pipeline().collection("sites");

    // `search()` debe ser el PRIMER stage tras `collection()`; el filtro va después.
    const stage = search
      ? collection
          .search({ query: documentMatches(search), sort: score().descending() })
          .where(field("author.id").equal(uid))
      : collection.where(field("author.id").equal(uid));

    const result = await stage
      .limit(limit)
      .select(
        field("__name__").as("siteId"),
        field("name").as("name"),
        field("category").as("category"),
        field("media").as("media"),
        field("analytics.clicks").as("clicks"),
        field("analytics.likes").as("likes"),
        field("analytics.shares").as("shares"),
        field("analytics.eventCount").as("eventsCount"),
      )
      .execute();

    return result.results.map((r) => {
      const row = r.data() as {
        siteId: unknown;
        name?: string;
        category?: string;
        media?: Array<{ type?: string; url?: string; isCover?: boolean }>;
        clicks?: number;
        likes?: number;
        shares?: number;
        eventsCount?: number;
      };

      const media = Array.isArray(row.media) ? row.media : [];
      const cover =
        media.find((m) => m.type === "image" && m.isCover) ??
        media.find((m) => m.type === "image");
      const clicks = Number(row.clicks ?? 0);

      return {
        id: this.toDocId(row.siteId),
        name: row.name ?? "Sitio sin nombre",
        category: row.category ?? "",
        image: typeof cover?.url === "string" ? cover.url : undefined,
        clicks,
        likes: Number(row.likes ?? 0),
        shares: Number(row.shares ?? 0),
        eventsCount: Number(row.eventsCount ?? 0),
        // MOCK — tendencia semanal placeholder, determinista para pruebas de UI.
        // TODO: calcular real desde el log de interacciones (getSiteAnalytics).
        trend: (clicks % 40) - 15,
      };
    });
  }

  /**
   * Itinerario de eventos de un sitio: pipeline sobre `events` filtrando por la
   * FK `location.siteId` (la location del evento apunta a un sitio nuestro), con
   * búsqueda + paginación por CURSOR (mismo patrón que `getOrganizerEvents`).
   * Ordena/cursorea por `createdAt` (siempre presente) para no descartar eventos
   * sin `startDate`. Pide `limit + 1` para saber si hay página siguiente.
   */
  async getEventsBySite(
    siteId: string,
    { search, limit = 20, cursor, direction = "next" }: GetSiteEventsParams = {},
  ): Promise<SiteEventsPage> {
    const isPrev = Boolean(cursor) && direction === "prev";
    const cursorDate = cursor ? new Date(cursor) : undefined;

    const collection = this.db.pipeline().collection("events");

    let stage = search
      ? collection
          .search({ query: documentMatches(search), sort: score().descending() })
          .where(field("location.siteId").equal(siteId))
      : collection.where(field("location.siteId").equal(siteId));

    if (cursorDate) {
      stage = stage.where(
        isPrev
          ? field("createdAt").greaterThan(cursorDate)
          : field("createdAt").lessThan(cursorDate),
      );
    }

    const result = await stage
      .sort(isPrev ? field("createdAt").ascending() : field("createdAt").descending())
      .limit(limit + 1)
      .select(
        field("__name__").as("eventId"),
        field("title").as("name"),
        field("startDate").as("date"),
        field("status").as("status"),
        field("mainImage.url").as("image"),
        field("analytics.views").as("views"),
        field("analytics.registrations").as("registrations"),
        field("createdAt").as("createdAt"),
      )
      .execute();

    let rows = result.results.map(
      (r) =>
        r.data() as {
          eventId: unknown;
          name?: string;
          date?: unknown;
          status?: string;
          image?: string;
          views?: number;
          registrations?: number;
          createdAt: unknown;
        },
    );

    // En "prev" se consultó ascendente; se revierte al orden de despliegue (desc).
    if (isPrev) rows = rows.reverse();

    const hasMore = rows.length > limit;
    // "next": el extra queda al final (más viejo). "prev" (tras revertir): al inicio.
    const pageRows = hasMore ? (isPrev ? rows.slice(1) : rows.slice(0, limit)) : rows;

    const events: SiteEvent[] = pageRows.map((row) => ({
      eventId: this.toDocId(row.eventId),
      name: row.name ?? "Evento sin título",
      date: row.date ? this.toDateOrNull(row.date) : null,
      status: row.status ?? "draft",
      image: row.image,
      views: Number(row.views ?? 0),
      registrations: Number(row.registrations ?? 0),
    }));

    // Cursor de una fila = su `createdAt` (ISO). El proto `{_seconds}` lo maneja `toDateOrNull`.
    const cursorOf = (row: (typeof pageRows)[number]): string | null =>
      this.toDateOrNull(row.createdAt)?.toISOString() ?? null;

    const nextCursor = isPrev
      ? pageRows.length > 0
        ? cursorOf(pageRows[pageRows.length - 1])
        : null
      : hasMore
        ? cursorOf(pageRows[pageRows.length - 1])
        : null;

    const prevCursor = isPrev
      ? hasMore
        ? cursorOf(pageRows[0])
        : null
      : cursorDate && pageRows.length > 0
        ? cursorOf(pageRows[0])
        : null;

    return { events, nextCursor, prevCursor };
  }

  /**
   * Crea un perfil externo (cara sin login). La imagen ya viene subida a Storage
   * (`photoURL`); el upload lo hace la server action. No toca el evento: la action
   * embebe el `{refId, kind:"external"}` en el payload del evento al guardarlo.
   */
  /**
   * Busca usuarios para invitar (pipeline de búsqueda tokenizada sobre `users`,
   * mismo motor que `getEventRegistrations`). Excluye a uno mismo.
   * Requiere índice de búsqueda en `users` (Firestore Enterprise).
   */
  async searchPotentialCollaborators(
    uid: string,
    query: string,
    limit = 8,
  ): Promise<UserSearchItem[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];

    try {
      const result = await this.db
        .pipeline()
        .collection("users")
        .search({ query: documentMatches(trimmed), sort: score().descending() })
        // Solo cuentas profesionales pueden ser colaboradoras.
        .where(field("accountType").equal("professional"))
        .limit(limit + 1)
        .select(
          field("__name__").as("uid"),
          field("displayName").as("displayName"),
          field("photoURL").as("photoURL"),
          field("email").as("email"),
          field("professionalType").as("professionalType"),
        )
        .execute();

      return result.results
        .map((r) => {
          const row = r.data() as {
            uid: unknown;
            displayName?: string;
            photoURL?: string;
            email?: string;
            professionalType?: ProfessionalType;
          };
          return {
            uid: this.toDocId(row.uid),
            displayName: row.displayName || row.email || "Usuario",
            photoURL: row.photoURL ?? undefined,
            email: row.email ?? "",
            professionalType: row.professionalType ?? undefined,
          };
        })
        .filter((u) => u.uid !== uid)
        .slice(0, limit);
    } catch (error) {
      // Fallback sin índice de búsqueda (Firestore Enterprise): match EXACTO por
      // correo. Permite invitar por email aunque no exista el search index; la
      // búsqueda por nombre/tokens sí requiere el índice. Ver README/deuda.
      console.warn(
        "[searchPotentialCollaborators] búsqueda por índice falló; fallback a email exacto",
        error,
      );
      const email = trimmed.toLowerCase();
      if (!email.includes("@")) return [];
      const snap = await this.db
        .collection("users")
        .where("email", "==", email)
        .limit(1)
        .get();
      return snap.docs
        // Solo profesionales; se excluye a uno mismo.
        .filter((d) => {
          const u = d.data() as { accountType?: string };
          return d.id !== uid && u.accountType === "professional";
        })
        .map((d) => {
          const u = d.data() as {
            displayName?: string;
            photoURL?: string;
            email?: string;
            professionalType?: ProfessionalType;
          };
          return {
            uid: d.id,
            displayName: u.displayName || u.email || "Usuario",
            photoURL: u.photoURL ?? undefined,
            email: u.email ?? "",
            professionalType: u.professionalType ?? undefined,
          };
        });
    }
  }

  /**
   * Envía invitaciones (a mi red) a varios usuarios a la vez, en batch. Denormaliza
   * emisor e invitado en la invitación. Salta auto-invitación y duplicados
   * (pendientes o ya aceptados). Account-level: sin eventId.
   */
  async inviteCollaborators(fromUid: string, invitees: InviteeInput[]): Promise<void> {
    if (invitees.length === 0) return;

    const meSnap = await this.db.collection("users").doc(fromUid).get();
    const me = meSnap.exists
      ? (meSnap.data() as {
          displayName?: string;
          photoURL?: string;
          professionalType?: ProfessionalType;
        })
      : {};

    // Dedup: invitaciones ya existentes (pendientes o aceptadas) que yo envié.
    const existing = await this.db
      .collection("collaborationInvites")
      .where("fromUid", "==", fromUid)
      .get();
    const seen = new Set(
      existing.docs
        .filter((d) => ["pending", "accepted"].includes(d.data().status))
        .map((d) => d.data().toUid as string),
    );

    // Solo se puede invitar a cuentas profesionales (defensa: el buscador ya las
    // filtra, pero validamos server-side por si llega un uid crafteado).
    const inviteeSnaps = await Promise.all(
      invitees.map((inv) => this.db.collection("users").doc(inv.uid).get()),
    );
    const professionalUids = new Set(
      inviteeSnaps
        .filter(
          (s) => s.exists && (s.data() as { accountType?: string }).accountType === "professional",
        )
        .map((s) => s.id),
    );

    const batch = this.db.batch();
    let added = 0;
    for (const inv of invitees) {
      if (inv.uid === fromUid || seen.has(inv.uid) || !professionalUids.has(inv.uid)) continue;
      const ref = this.db.collection("collaborationInvites").doc();
      batch.set(ref, {
        fromUid,
        fromDisplayName: me.displayName ?? "",
        fromPhotoURL: me.photoURL ?? null,
        fromProfessionalType: me.professionalType ?? null,
        toUid: inv.uid,
        toEmail: inv.email.trim().toLowerCase(),
        toDisplayName: inv.displayName,
        toPhotoURL: inv.photoURL ?? null,
        toProfessionalType: inv.professionalType ?? null,
        status: "pending",
        createdAt: FieldValue.serverTimestamp(),
        respondedAt: null,
      });
      seen.add(inv.uid);
      added++;
    }
    if (added > 0) await batch.commit();
  }

  /** Invitaciones pendientes que YO recibí. Emisor ya denormalizado en el doc. */
  async getReceivedInvitations(uid: string): Promise<CollaboratorInvitation[]> {
    const snap = await this.db
      .collection("collaborationInvites")
      .where("toUid", "==", uid)
      .get();
    return snap.docs
      .filter((d) => d.data().status === "pending")
      .map((d) => {
        const inv = d.data() as {
          fromUid?: string;
          fromDisplayName?: string;
          fromPhotoURL?: string;
          fromProfessionalType?: ProfessionalType;
          createdAt?: unknown;
        };
        return {
          id: d.id,
          fromUid: inv.fromUid ?? "",
          fromDisplayName: inv.fromDisplayName || "Organizador",
          fromPhotoURL: inv.fromPhotoURL ?? undefined,
          fromProfessionalType: inv.fromProfessionalType ?? undefined,
          invitedAt: this.toDateOrNull(inv.createdAt) ?? new Date(0),
        };
      });
  }

  /** Invitaciones pendientes que YO envié (para cancelar). Invitado denormalizado. */
  async getSentInvitations(uid: string): Promise<SentInvitation[]> {
    const snap = await this.db
      .collection("collaborationInvites")
      .where("fromUid", "==", uid)
      .get();
    return snap.docs
      .filter((d) => d.data().status === "pending")
      .map((d) => {
        const inv = d.data() as {
          toUid?: string;
          toDisplayName?: string;
          toPhotoURL?: string;
          toEmail?: string;
          createdAt?: unknown;
        };
        return {
          id: d.id,
          toUid: inv.toUid ?? "",
          toDisplayName: inv.toDisplayName || inv.toEmail || "Usuario",
          toPhotoURL: inv.toPhotoURL ?? undefined,
          toEmail: inv.toEmail ?? "",
          invitedAt: this.toDateOrNull(inv.createdAt) ?? new Date(0),
        };
      });
  }

  /**
   * Mi red de colaboradores (BIDIRECCIONAL): usuarios que invité y aceptaron +
   * usuarios cuya invitación yo acepté (ellos me invitaron) + mis perfiles
   * externos. Denormalizado en la invitación, sin joins. Dedup por refId.
   */
  async getCollaborators(uid: string): Promise<Collaborator[]> {
    const [sentSnap, receivedSnap, externalsSnap] = await Promise.all([
      this.db.collection("collaborationInvites").where("fromUid", "==", uid).get(),
      this.db.collection("collaborationInvites").where("toUid", "==", uid).get(),
      this.db.collection("externalProfiles").where("managedBy", "==", uid).get(),
    ]);

    // Yo invité (aceptadas) → el invitado (to*).
    const asInviter: Collaborator[] = sentSnap.docs
      .filter((d) => d.data().status === "accepted")
      .map((d): Collaborator => {
        const inv = d.data() as {
          toUid?: string;
          toDisplayName?: string;
          toPhotoURL?: string;
          toProfessionalType?: ProfessionalType;
        };
        return {
          refId: inv.toUid ?? "",
          kind: "user",
          displayName: inv.toDisplayName || "Colaborador",
          photoURL: inv.toPhotoURL ?? undefined,
          professionalType: inv.toProfessionalType ?? undefined,
        };
      });

    // Me invitaron y acepté → quien invitó (from*). Hace la red bidireccional.
    const asInvitee: Collaborator[] = receivedSnap.docs
      .filter((d) => d.data().status === "accepted")
      .map((d): Collaborator => {
        const inv = d.data() as {
          fromUid?: string;
          fromDisplayName?: string;
          fromPhotoURL?: string;
          fromProfessionalType?: ProfessionalType;
        };
        return {
          refId: inv.fromUid ?? "",
          kind: "user",
          displayName: inv.fromDisplayName || "Colaborador",
          photoURL: inv.fromPhotoURL ?? undefined,
          professionalType: inv.fromProfessionalType ?? undefined,
        };
      });

    const externals: Collaborator[] = externalsSnap.docs.map((d): Collaborator => {
      const e = d.data() as { displayName?: string; photoURL?: string };
      return {
        refId: d.id,
        kind: "external",
        displayName: e.displayName || "Externo",
        photoURL: e.photoURL ?? undefined,
      };
    });

    const byId = new Map<string, Collaborator>();
    [...asInviter, ...asInvitee, ...externals].forEach((c) => {
      if (c.refId && !byId.has(c.refId)) byId.set(c.refId, c);
    });
    return [...byId.values()];
  }

  /**
   * Aceptar/rechazar una invitación recibida. `uid` DEBE ser el invitado
   * (`toUid`) — verificado en la transacción. Account-level: solo marca el estado,
   * no toca eventos (el crédito por evento se hace luego en el editor).
   * Idempotente: si ya no está pendiente, no hace nada.
   */
  async respondCollaboratorInvitation(
    inviteId: string,
    uid: string,
    accept: boolean,
  ): Promise<void> {
    const inviteRef = this.db.collection("collaborationInvites").doc(inviteId);
    await this.db.runTransaction(async (tx) => {
      const snap = await tx.get(inviteRef);
      if (!snap.exists) throw new Error("Invitación no encontrada.");
      const inv = snap.data() as { toUid?: string; status?: string };
      if (inv.toUid !== uid) throw new Error("No autorizado.");
      if (inv.status !== "pending") return; // ya respondida → no-op

      tx.update(inviteRef, {
        status: accept ? "accepted" : "declined",
        respondedAt: FieldValue.serverTimestamp(),
      });
    });
  }

  /** Cancelar una invitación pendiente que YO envié. Solo el emisor (`fromUid`). */
  async cancelInvitation(inviteId: string, uid: string): Promise<void> {
    const inviteRef = this.db.collection("collaborationInvites").doc(inviteId);
    const snap = await inviteRef.get();
    if (!snap.exists) return; // no-op
    const inv = snap.data() as { fromUid?: string; status?: string };
    if (inv.fromUid !== uid) throw new Error("No autorizado.");
    if (inv.status !== "pending") return; // aceptada → usar removeCollaborator
    await inviteRef.delete();
  }

  /**
   * Quita de mi red a un colaborador. Externo: borra el `externalProfiles`
   * (solo su `managedBy`). User: borra las invitaciones aceptadas que yo le envié.
   * No toca los eventos donde ya está acreditado (se quitan desde el editor).
   */
  async removeCollaborator(uid: string, refId: string, kind: CollaboratorKind): Promise<void> {
    if (kind === "external") {
      const ref = this.db.collection("externalProfiles").doc(refId);
      const snap = await ref.get();
      if (!snap.exists) return;
      if ((snap.data() as { managedBy?: string }).managedBy !== uid) {
        throw new Error("No autorizado.");
      }
      await ref.delete();
      return;
    }

    const snap = await this.db
      .collection("collaborationInvites")
      .where("fromUid", "==", uid)
      .get();
    const batch = this.db.batch();
    let n = 0;
    snap.docs.forEach((d) => {
      const x = d.data();
      if (x.toUid === refId && x.status === "accepted") {
        batch.delete(d.ref);
        n++;
      }
    });
    if (n > 0) await batch.commit();
  }

  async createExternalProfile(
    managedBy: string,
    input: ExternalProfileInput,
    photoURL: string | undefined,
  ): Promise<ExternalProfile> {
    const email = input.email ? input.email.trim().toLowerCase() : null;
    // Solo guarda las redes con valor.
    const socialLinks = Object.fromEntries(
      Object.entries(input.socialLinks ?? {}).filter(
        ([, v]) => typeof v === "string" && v.trim(),
      ),
    );

    const ref = await this.db.collection("externalProfiles").add({
      displayName: input.displayName,
      photoURL: photoURL ?? null,
      bio: input.bio ?? null,
      type: input.type,
      managedBy,
      email,
      socialLinks,
      linkedUserId: null,
      createdAt: FieldValue.serverTimestamp(),
    });

    return {
      id: ref.id,
      displayName: input.displayName,
      photoURL,
      bio: input.bio,
      type: input.type,
      managedBy,
      email,
      socialLinks,
      linkedUserId: null,
      createdAt: new Date(),
    };
  }

  async getExternalProfile(id: string): Promise<ExternalProfile | null> {
    const snap = await this.db.collection("externalProfiles").doc(id).get();
    if (!snap.exists) return null;
    const d = snap.data() as {
      displayName?: string;
      photoURL?: string | null;
      bio?: string | null;
      type?: ExternalProfileType;
      managedBy?: string;
      email?: string | null;
      socialLinks?: ExternalSocialLinks;
      createdAt?: unknown;
    };
    return {
      id: snap.id,
      displayName: d.displayName ?? "Externo",
      photoURL: d.photoURL ?? undefined,
      bio: d.bio ?? undefined,
      type: d.type ?? "person",
      managedBy: d.managedBy ?? "",
      email: d.email ?? null,
      socialLinks: d.socialLinks,
      linkedUserId: null,
      createdAt: this.toDateOrNull(d.createdAt) ?? new Date(0),
    };
  }

  /**
   * Acredita a un miembro de mi red en un evento (con rol). Op atómica
   * (arrayUnion + nested set), no pasa por el save del evento para no clobberear
   * el array. Solo el owner. Idempotente.
   */
  async addCollaboratorToEvent(
    eventId: string,
    member: {
      refId: string;
      kind: CollaboratorKind;
      displayName: string;
      photoURL?: string;
      role: CollaboratorRole;
    },
    actingUid: string,
  ): Promise<void> {
    const eventRef = this.db.collection("events").doc(eventId);
    const snap = await eventRef.get();
    if (!snap.exists) throw new Error("Evento no encontrado.");
    const event = snap.data() as {
      author?: { id?: string };
      collaborators?: { refId: string; kind: string }[];
    };
    if (event.author?.id !== actingUid) throw new Error("No autorizado.");
    if ((event.collaborators ?? []).some((c) => c.refId === member.refId)) return;

    await eventRef.update({
      collaborators: FieldValue.arrayUnion({ refId: member.refId, kind: member.kind }),
      [`collaboratorsData.${member.refId}`]: {
        displayName: member.displayName,
        photoURL: member.photoURL ?? null,
        role: member.role,
      },
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  /**
   * Quita un colaborador de un evento (solo el owner). Borra del array
   * `collaborators` y elimina su entrada de `collaboratorsData`. Idempotente.
   */
  async removeCollaboratorFromEvent(
    eventId: string,
    refId: string,
    actingUid: string,
  ): Promise<void> {
    const eventRef = this.db.collection("events").doc(eventId);
    await this.db.runTransaction(async (tx) => {
      const snap = await tx.get(eventRef);
      if (!snap.exists) return; // ya no existe → no-op
      const event = snap.data() as {
        author?: { id?: string };
        collaborators?: { refId: string; kind: string }[];
      };
      if (event.author?.id !== actingUid) throw new Error("No autorizado.");

      const next = (event.collaborators ?? []).filter((c) => c.refId !== refId);
      tx.update(eventRef, {
        collaborators: next,
        [`collaboratorsData.${refId}`]: FieldValue.delete(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });
  }

  async getAudienceSummary(uid: string): Promise<AudienceSummary | null> {
    // TODO: implementación del repositorio (la hago yo)
    void uid;
    return null;
  }

  async getSupportTickets(uid: string): Promise<SupportTicket[]> {
    // TODO: implementación del repositorio (la hago yo)
    void uid;
    return [];
  }

  async getSupportTicketDetail(
    ticketId: string,
  ): Promise<SupportTicketDetail | null> {
    // TODO: implementación del repositorio (la hago yo)
    void ticketId;
    return null;
  }

  async createSupportTicket(
    uid: string,
    input: CreateSupportTicketInput,
  ): Promise<void> {
    // TODO: implementación del repositorio (la hago yo)
    void uid;
    void input;
  }

  async closeSupportTicket(ticketId: string, reason: string): Promise<void> {
    // TODO: implementación del repositorio (la hago yo)
    void ticketId;
    void reason;
  }
}
