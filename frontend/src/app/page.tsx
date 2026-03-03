import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#FAFAF8]">
      <h1 className="mb-6 text-2xl font-medium text-gray-800">
        Arkitekta Studio
      </h1>
      <Link
        href="/studio"
        className="rounded-lg bg-[#2A5FE6] px-6 py-3 text-sm font-medium uppercase text-white"
      >
        Open Studio
      </Link>
    </div>
  );
}

