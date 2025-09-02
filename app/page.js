import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import HomePage from "@/app/navigations/user/Home-Page/HomePage";
import LayoutPage from "@/components/layout/LayoutPage";

export default async function RootHome() {
  const session = await getServerSession(authOptions);
  
  return (
    <LayoutPage>
      <HomePage />
    </LayoutPage>
  );
}
