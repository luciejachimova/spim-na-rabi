import { redirect } from "next/navigation"

// The manifest's start_url. Reservations are the screen this app is opened for;
// the "Dnes" overview and the calendar arrive in later phases and one of them
// will take this place.
export default function ManagerHomePage() {
  redirect("/manager/rezervace")
}
