import { auth } from "@/auth";
import SignIn from "@/components/auth/sign-in";
import { SignOut } from "@/components/auth/sign-out";
import Image from "next/image";

export default async function HomePage() {
  const session = await auth();

  return (
    <div>
      <h1>Home Page</h1>
      <Image
        className="dark:invert"
        src="/logo.png"
        alt="Next.js logo"
        width={100}
        height={100}
        priority
      />
      {session?.user ? (
        <>
          <p>Hello {session?.user?.name}</p>
          <SignOut />
        </>
      ) : (
        <SignIn />
      )}
    </div>
  );
}
