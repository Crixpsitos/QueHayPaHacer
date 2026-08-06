import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getTokens } from "next-firebase-auth-edge";
import { authConfig } from "@/infraestructure/firebase/config/admin/firebase";
import {
  getUserPreferences,
  getPreferenceEventIds,
  fetchPreferenceEventDetail,
} from "@/presentation/events/lib/preferenceEvents";
import { EventViewModelMapper } from "@/presentation/events/mapper/EventViewModelMapper";
import type { Events } from "@/domain/entities/events/Events";

export async function GET() {
  const tokens = await getTokens(await cookies(), authConfig);
  const userId = tokens?.decodedToken?.uid;

  const preferences = await getUserPreferences(userId);
  if (!preferences) return NextResponse.json([]);

  const eventIds = await getPreferenceEventIds(preferences);
  const eventsData = await Promise.all(eventIds.map(fetchPreferenceEventDetail));
  const events = eventsData.filter(Boolean) as Events[];

  const viewModels = events.map((e) => EventViewModelMapper.toViewModel(e));
  return NextResponse.json(viewModels);
}
