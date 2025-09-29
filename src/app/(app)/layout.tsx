import { redirect } from "next/navigation";
import { getToken } from "#/lib/auth-server";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await getToken();

  if (!auth) {
    redirect("/");
  }

  return <div>{children}</div>;
}
