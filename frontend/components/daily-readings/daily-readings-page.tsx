import Image from "next/image";

export default function DailyReadingsPage() {
  return (
    <div>
      <h1>Daily Readings Page</h1>
      <Image
        className="dark:invert"
        src="/logo.png"
        alt="Next.js logo"
        width={100}
        height={20}
        priority
      />
    </div>
  );
}
