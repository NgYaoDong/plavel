import Image from "next/image";

export default function InvalidSession() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold">
        You must be logged in to view this page...
      </h1>
      <Image src="/crying_penguin.svg" alt="Error" width={400} height={400} />
    </main>
  );
}