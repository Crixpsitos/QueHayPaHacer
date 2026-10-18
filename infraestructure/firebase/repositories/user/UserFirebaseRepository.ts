import type { Firestore } from "firebase-admin/firestore";
import type { FirebaseUserDto } from "@/infraestructure/firebase/dto/FirebaseUserDto";
import { FirebaseBaseRepository } from "@/infraestructure/firebase/repositories/FirebaseBaseRepository";
import type { IUserFirebaseRepository } from "@/infraestructure/firebase/repositories/user/IUserFirebaseRepository";

export class UserFirebaseRepository extends FirebaseBaseRepository implements IUserFirebaseRepository {
  protected readonly collectionName = "users";

  constructor(db: Firestore) {
    super(db);
  }

  async findById(id: string): Promise<FirebaseUserDto | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;
    return { uid: doc.id, ...doc.data() } as FirebaseUserDto;
  }

  async findAll(): Promise<FirebaseUserDto[]> {
    const snapshot = await this.collection.get();
    return snapshot.docs.map((doc) => ({ uid: doc.id, ...doc.data() } as FirebaseUserDto));
  }

  async findByEmail(email: string): Promise<FirebaseUserDto | null> {
    const snapshot = await this.collection.where("email", "==", email).limit(1).get();
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { uid: doc.id, ...doc.data() } as FirebaseUserDto;
  }

  async findByUsername(username: string): Promise<FirebaseUserDto | null> {
    // Usernames se guardan normalizados; el valor exacto cubre perfiles legados
    // (displayName sin normalizar) a los que apuntan links viejos. Sin scans.
    for (const candidate of new Set([username.toLowerCase(), username])) {
      const snapshot = await this.collection.where("displayName", "==", candidate).limit(1).get();
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return { uid: doc.id, ...doc.data() } as FirebaseUserDto;
      }
    }
    return null;
  }

  async findVerifiedCreators(limit: number): Promise<FirebaseUserDto[]> {
    const snapshot = await this.collection
      .where("isPublic", "==", true)
      .where("participation", "==", "creator")
      .where("creatorVerified", "==", true)
      .limit(limit)
      .get();
    return snapshot.docs.map((doc) => ({ uid: doc.id, ...doc.data() } as FirebaseUserDto));
  }

  async create(dto: FirebaseUserDto): Promise<FirebaseUserDto> {
    const userRef = this.collection.doc(dto.uid);
    const usernameRef = this.db.collection("usernames").doc(dto.displayName);

    await this.db.runTransaction(async (transaction) => {
      const usernameQuery = this.collection.where("displayName", "==", dto.displayName).limit(1);
      const [username, existingUser] = await Promise.all([
        transaction.get(usernameRef),
        transaction.get(usernameQuery),
      ]);
      if (username.exists || !existingUser.empty) throw new Error("Username already in use");

      transaction.create(usernameRef, { uid: dto.uid });
      transaction.create(userRef, dto);
    });
    return dto;
  }

  async update(id: string, dto: Partial<FirebaseUserDto>): Promise<FirebaseUserDto> {
    const userRef = this.collection.doc(id);

    await this.db.runTransaction(async (transaction) => {
      const currentUser = await transaction.get(userRef);
      if (!currentUser.exists) throw new Error("User not found");

      const currentUsername = String(currentUser.data()?.displayName ?? "");
      const nextUsername = dto.displayName;

      if (nextUsername && nextUsername !== currentUsername) {
        const nextUsernameRef = this.db.collection("usernames").doc(nextUsername);
        const usernameQuery = this.collection.where("displayName", "==", nextUsername).limit(1);
        const [nextUsernameReservation, existingUser] = await Promise.all([
          transaction.get(nextUsernameRef),
          transaction.get(usernameQuery),
        ]);
        const usernameBelongsToAnotherUser =
          !existingUser.empty && existingUser.docs[0].id !== id;
        if (
          usernameBelongsToAnotherUser ||
          (nextUsernameReservation.exists && nextUsernameReservation.data()?.uid !== id)
        ) {
          throw new Error("Username already in use");
        }

        transaction.set(nextUsernameRef, { uid: id });
        if (currentUsername) {
          transaction.delete(this.db.collection("usernames").doc(currentUsername));
        }
      }

      transaction.update(userRef, dto as { [key: string]: unknown });
    });
    const updated = await this.findById(id);
    return updated!;
  }

  async delete(id: string): Promise<void> {
    const userRef = this.collection.doc(id);
    await this.db.runTransaction(async (transaction) => {
      const user = await transaction.get(userRef);
      if (!user.exists) return;

      const username = String(user.data()?.displayName ?? "");
      transaction.delete(userRef);
      if (username) {
        transaction.delete(this.db.collection("usernames").doc(username));
      }
    });
  }
}
