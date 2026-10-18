import { FieldValue, type Firestore } from "firebase-admin/firestore";
import { FirebaseBaseRepository } from "../FirebaseBaseRepository";
import type { IReportRepository } from "@/domain/repository/report/IReportRepository";
import { reportId, type Report } from "@/domain/entities/report/Report";

const ALREADY_EXISTS = 6;

// ponytail: sin adapter/mapper/dto, el doc es el mismo objeto de dominio + createdAt.
export class ReportFirebaseRepository extends FirebaseBaseRepository implements IReportRepository {
  protected readonly collectionName = "reports";

  constructor(db: Firestore) {
    super(db);
  }

  async create(report: Report): Promise<boolean> {
    // create() falla si el doc existe: deduplicación atómica por id.
    const { sessionId, ...rest } = report;
    try {
      await this.collection.doc(reportId(report)).create({
        ...rest,
        ...(sessionId ? { sessionId } : {}),
        createdAt: FieldValue.serverTimestamp(),
      });
      return true;
    } catch (e) {
      if ((e as { code?: number }).code === ALREADY_EXISTS) return false;
      throw e;
    }
  }
}
