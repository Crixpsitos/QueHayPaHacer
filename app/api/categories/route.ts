import { createServerContainer } from "@/infraestructure/di/container";
import { cacheTag } from "next/cache";
import { cacheLife } from "next/cache";
import { NextResponse } from "next/server";

const getCategories = async () => {
  "use cache";
  cacheLife("days");
  cacheTag("categories");
  const { categoriesService } = createServerContainer();
  return categoriesService.getActiveCategories();
};

export async function GET() {
  const categories = await getCategories();

  return NextResponse.json(categories);
}
