import { SignalsPageClient } from "./SignalsPageClient";

interface SignalsPageProps {
  searchParams?: Promise<{
    debug?: string;
  }>;
}

export default async function SignalsPage({
  searchParams,
}: SignalsPageProps) {
  const params = searchParams ? await searchParams : undefined;

  return <SignalsPageClient debugMode={params?.debug === "1"} />;
}
