export class SiteAnalytics {
    constructor(
        clicks: number,
        shares: number,
        likes: number,
        eventCount: number,
    ) {
        if (clicks < 0) {
            throw new Error("Clicks inválidos")
        }
        if (shares < 0) {
            throw new Error("Shares inválidos")
        }
        if (likes < 0) {
            throw new Error("Likes inválidos")
        }
        if (eventCount < 0) {
            throw new Error("EventCount inválidos")
        }
    }
}