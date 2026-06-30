import { NextResponse } from "next/server"
import { seedBadgesAction } from "@/app/actions/admin/seed-badges.action"

export async function GET() {
  try {
    const result = await seedBadgesAction()
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    )
  }
}
