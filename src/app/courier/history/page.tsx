import { CourierHistory } from "@/components/courier/CourierPanels";
import { getCourierHistory } from "@/lib/courier/queries";

export const metadata = { title: "Kuryer tarixçəsi" };

export default async function CourierHistoryPage() {
  const orders = await getCourierHistory();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6 md:py-12">
      <h1 className="text-3xl font-semibold text-zinc-900">Tarixçə</h1>
      <p className="mt-2 text-sm text-zinc-500">Çatdırdığınız və çatdıra bilmədiyiniz sifarişlər</p>
      <div className="mt-8">
        <CourierHistory orders={orders} />
      </div>
    </div>
  );
}
