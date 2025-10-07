import { auth } from "@/auth";
import GlobePage from "@/components/GlobePage";
import InvalidSession from "@/lib/invalidSession";

export const revalidate = 60;

export default async function NewTrip() {
  const session = await auth();
  if (!session || !session?.user || !session.user?.id) {
    return <InvalidSession />;
  }
  return <GlobePage />;
}
