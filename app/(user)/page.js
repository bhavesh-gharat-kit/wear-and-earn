

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import HomePage from "@/app/navigations/user/Home-Page/HomePage";
export default function Home() {


  return (
    <>
      <HomePage />

    </>
  );
}
