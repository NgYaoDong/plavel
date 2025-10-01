import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

export default async function TripsPage() {
  const session = await auth();
  if (!session) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <h1 className="text-4xl font-bold">
          You must be logged in to view this page...
        </h1>
        <Image src="/crying_penguin.svg" alt="Error" width={400} height={400} />
      </main>
    );
  }

  return (
    <main className="space-y-6 container mx-auto px-4 py-8">
      <div>
        <h1 className="text-4xl font-bold">Dashboard</h1>
        <Link href="/trips/new" className="mt-4 inline-block">
          <Button>New Trip</Button>
        </Link>
      </div>
    </main>
  );
}
