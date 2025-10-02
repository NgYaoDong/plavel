import { auth } from "@/auth";
import NewLocationClient from "@/components/trips/NewLocation";
import InvalidSession from "@/lib/invalidSession";

export default async function NewLocation({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const session = await auth();
  if (!session || !session?.user || !session.user?.id) {
    return <InvalidSession />;
  }
  const { tripId } = await params;

  return <NewLocationClient tripId={tripId} />;
}
