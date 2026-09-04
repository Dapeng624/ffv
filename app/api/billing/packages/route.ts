import { creditPackages } from "@/lib/credits";

export async function GET() {
  return Response.json({ packages: creditPackages() });
}
