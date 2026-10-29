import { getFirestore } from "firebase/firestore";
import { getFirebaseApp } from "./firebase";

/** Aparte de firebase.ts: el AuthProvider del layout raíz importa firebase.ts y no debe cargar todo Firestore. */
export const getFirebaseFirestore = () =>
  getFirestore(getFirebaseApp(), "quehaypahacer-db");
