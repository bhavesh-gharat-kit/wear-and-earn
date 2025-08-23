import { redirect } from 'next/navigation'

export default function RootPage() {
  // Redirect root to the main home route
  redirect('/home')
}
