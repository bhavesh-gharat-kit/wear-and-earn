
import LayoutPage from "@/components/layout/LayoutPage";


export const metadata = {
  title: "User Dashboard",
  description: "user Dashboard",
};

export default function UserLayout({ children }) {
  return (

    <main>
      <LayoutPage>
        {children}
      </LayoutPage>
    </main>
  );
}
