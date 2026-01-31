import { auth } from "@/auth";
import SignIn from "@/components/auth/sign-in";
import { SignOut } from "@/components/auth/sign-out";
import Image from "next/image";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function HomePage() {
  const session = await auth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center text-center space-y-8">
          <Image
            className="dark:invert"
            src="/logo.png"
            alt="Project Desert Logo"
            width={120}
            height={120}
            priority
          />

          <div className="space-y-4 max-w-3xl">
            <h1 className="text-5xl font-bold tracking-tight">
              Welcome to Project Desert
            </h1>
            <p className="text-xl text-muted-foreground">
              Your personal journey towards spiritual growth through intentional
              practices
            </p>
          </div>

          {/* Auth Section */}
          <div className="flex flex-col items-center space-y-4">
            {session?.user ? (
              <div className="flex flex-col items-center space-y-3">
                <div className="flex items-center space-x-2">
                  <p className="text-lg">
                    Welcome back,{" "}
                    <span className="font-semibold">{session.user.name}</span>
                  </p>
                  <Badge variant="secondary">Signed In</Badge>
                </div>
                <SignOut />
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-muted-foreground">
                  Sign in to start your journey
                </p>
                <SignIn />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">How It Works</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Three powerful features to help you build meaningful spiritual
            practices
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Asceticisms Feature */}
          <Link href="/asceticisms">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <div className="mb-2">
                  <span className="text-4xl">🎯</span>
                </div>
                <CardTitle>Asceticisms</CardTitle>
                <CardDescription>
                  Personal spiritual practices and disciplines
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start space-x-2">
                    <Badge variant="outline" className="mt-1">
                      Browse
                    </Badge>
                    <p className="text-sm text-muted-foreground">
                      Explore and discover various spiritual practices
                    </p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Badge variant="outline" className="mt-1">
                      Progress
                    </Badge>
                    <p className="text-sm text-muted-foreground">
                      Track your journey and see your growth over time
                    </p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Badge variant="outline" className="mt-1">
                      Create
                    </Badge>
                    <p className="text-sm text-muted-foreground">
                      Design custom practices tailored to your spiritual path
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Packages Feature */}
          <Link href="/packages">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mb-2">
                  <span className="text-4xl">📦</span>
                </div>
                <CardTitle>Packages</CardTitle>
                <CardDescription>
                  Curated collections of practices
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Discover thoughtfully assembled packages that combine multiple
                  asceticisms into cohesive spiritual programs.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">✓</span>
                    <p className="text-sm text-muted-foreground">
                      Pre-built spiritual programs
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">✓</span>
                    <p className="text-sm text-muted-foreground">
                      Structured learning paths
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">✓</span>
                    <p className="text-sm text-muted-foreground">
                      Community-shared collections
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Daily Readings Feature */}
          <Link href="/daily-readings">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mb-2">
                  <span className="text-4xl">📖</span>
                </div>
                <CardTitle>Daily Readings</CardTitle>
                <CardDescription>
                  Spiritual nourishment every day
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Start each day with inspiring readings, reflections, and
                  meditations to guide your spiritual practice.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">✓</span>
                    <p className="text-sm text-muted-foreground">
                      Daily inspiration and guidance
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">✓</span>
                    <p className="text-sm text-muted-foreground">
                      Scripture and wisdom
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">✓</span>
                    <p className="text-sm text-muted-foreground">
                      Reflection prompts
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {/* CTA Section */}
      {!session?.user && (
        <div className="container mx-auto px-4 py-16">
          <Card className="max-w-2xl mx-auto bg-primary text-primary-foreground">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Ready to Begin?</CardTitle>
              <CardDescription className="text-primary-foreground/80">
                Join us today and start your spiritual journey
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <SignIn />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
