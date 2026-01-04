import Image from "next/image";

export default function SettingsPage() {
  return (
    <div>
      <h1>Settings Page</h1>
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
