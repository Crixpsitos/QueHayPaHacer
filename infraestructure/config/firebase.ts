import { initializeApp, apps } from "firebase-admin";
import { cert } from "firebase-admin/app";
import * as serviceAccount from "@/quehaypahacerAccountService.json";
import type { ServiceAccount, App } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { getAuth } from "firebase-admin/auth";



let app: App;

if (!apps.length) {
    app = initializeApp({
        credential: cert(serviceAccount as ServiceAccount)
    });
} else {
    app = apps[0]!;
}


const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export  {
    app,
    db,
    auth,
    storage

}