import { redirect } from "next/navigation";

// Sponsors now take an angel's whole wish list; single gifts aren't offered.
// Old links to "Gifts for every budget" go to the general needs list instead.
export default function ItemsByPrice() {
  redirect("/give#amazon");
}
