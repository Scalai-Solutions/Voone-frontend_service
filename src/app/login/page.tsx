import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,#f0d6ad,transparent_34%),linear-gradient(135deg,#fbfaf7,#efe7dc)] px-4 py-12">
      <Card className="w-full max-w-md rounded-lg">
        <CardHeader>
          <CardTitle>Sign in to Voone</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>Authentication is scaffolded and currently disabled for local product testing.</p>
          <p>When `AUTH_ENABLED=true`, connect the final sign-in provider in `src/lib/auth.ts` before using this page with real accounts.</p>
        </CardContent>
      </Card>
    </main>
  );
}