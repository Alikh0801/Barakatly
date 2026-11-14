import { APP_PAGE_TITLE } from "@/components/app/form-styles";
import { CourierQueue } from "@/components/courier/CourierPanels";
import { getCourierQueue } from "@/lib/courier/queries";

export const metadata = { title: "Kuryer növbəsi" };

export default async function CourierPage() {
  const orders = await getCourierQueue();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6 md:py-12 app:px-6 app:pt-4 app:pb-8">
      <h1 className={`text-3xl font-semibold text-zinc-900 ${APP_PAGE_TITLE}`}>Çatdırılma növbəsi</h1>
      <p className="mt-2 text-sm text-zinc-500 app:mt-1 app:text-app-muted">
        Hazırlanan və yolda olan sifarişləri idarə edin
      </p>
      <div className="mt-8 app:mt-5">
        <CourierQueue orders={orders} />
      </div>
    </div>
  );
}
