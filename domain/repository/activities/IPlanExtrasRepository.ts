/** Eventos con «Voy a ir» y sitios que la persona quiere visitar: lo que «Mis planes» suma a las actividades. */
export interface IPlanExtrasRepository {
  likedEventIds(uid: string, limit: number): Promise<string[]>
  likedSiteIds(uid: string, limit: number): Promise<string[]>
}
