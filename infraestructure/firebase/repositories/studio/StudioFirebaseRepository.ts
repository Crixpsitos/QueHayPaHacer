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
  Collaborator,
  CollaboratorInvitation,
  AudienceSummary,
  SupportTicket,
  SupportTicketDetail,
  CreateSupportTicketInput,
} from "@/domain/entities/studio/Studio";
import { Pipelines, FieldValue } from "@google-cloud/firestore";
import { Timestamp } from "firebase-admin/firestore";

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
      date: toDate(row.date),
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

      // 1) Metadatos del evento (tipo de registro, formulario, externo).
      const eventSnap = await this.db.collection("events").doc(eventId).get();
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
        .collection(`events/${eventId}/registrations`);

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

      if (isPrev) rawRows = rawRows.reverse();

      const hasMore = rawRows.length > limit;
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

  async getEventStats(eventId: string): Promise<EventStats | null> {
    const result = await this.db.collection("events").doc(eventId).get();
    if (!result.exists) return null;

    const data = result.data() as {
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
        ? await this.getRegistrationRamp(eventId, startDate, endDate)
        : { rampUnit: "day" as RampUnit, points: [] };

    return {
      eventId,
      name: data.name ?? "",
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
    eventId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{ rampUnit: RampUnit; points: EventStats["registrationRamp"] }> {
    const startSeconds = Math.floor(startDate.getTime() / 1000);
    const HOURS_THRESHOLD = 48; // ventana máx. para usar eje por horas

    const result = await this.db
      .pipeline()
      .collection(`events/${eventId}/registrations`)
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
  async confirmAttendance(eventId: string, userId: string): Promise<void> {
    const regRef = this.db
      .collection(`events/${eventId}/registrations`)
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
  async removeParticipant(eventId: string, userId: string): Promise<void> {
    const regRef = this.db
      .collection(`events/${eventId}/registrations`)
      .doc(userId);
    const eventRef = this.db.collection("events").doc(eventId);

    await this.db.runTransaction(async (tx) => {
      const regSnap = await tx.get(regRef);
      if (!regSnap.exists) return; // ya removido → no-op

      const eventSnap = await tx.get(eventRef);
      const current = Number(eventSnap.get("analytics.registrations") ?? 0);

      tx.delete(regRef);
      tx.update(eventRef, {
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

  async getSiteAnalytics(siteId: string): Promise<SiteAnalytics | null> {
    // TODO: implementación del repositorio (la hago yo)
    void siteId;
    return null;
  }

  async getEventsBySite(siteId: string): Promise<SiteEvent[]> {
    // TODO: implementación del repositorio (la hago yo)
    void siteId;
    return [];
  }

  async getCollaborators(uid: string): Promise<Collaborator[]> {
    // TODO: implementación del repositorio (la hago yo)
    void uid;
    return [];
  }

  async getMemberEntities(uid: string): Promise<Collaborator[]> {
    // TODO: implementación del repositorio (la hago yo)
    void uid;
    return [];
  }

  async getReceivedInvitations(uid: string): Promise<CollaboratorInvitation[]> {
    // TODO: implementación del repositorio (la hago yo)
    void uid;
    return [];
  }

  async inviteCollaborator(uid: string, email: string): Promise<void> {
    // TODO: implementación del repositorio (la hago yo)
    void uid;
    void email;
  }

  async respondCollaboratorInvitation(
    invitationId: string,
    accept: boolean,
  ): Promise<void> {
    // TODO: implementación del repositorio (la hago yo)
    void invitationId;
    void accept;
  }

  async removeCollaborator(
    uid: string,
    collaboratorUid: string,
  ): Promise<void> {
    // TODO: implementación del repositorio (la hago yo)
    void uid;
    void collaboratorUid;
  }

  async leaveEntity(uid: string, entityUid: string): Promise<void> {
    // TODO: implementación del repositorio (la hago yo)
    void uid;
    void entityUid;
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
