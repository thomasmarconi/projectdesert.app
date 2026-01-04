import Image from "next/image";

export default function AsceticismsPage() {
  return (
    <div>
      <h1>Asceticisms Page</h1>
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
