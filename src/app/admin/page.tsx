import { redirect } from "next/navigation";

export const metadata = {
  title: "Admin — BARAKATLY",
};

export default function AdminPage() {
  redirect("/admin/payments");
}
