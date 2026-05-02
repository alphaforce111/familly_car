import { Calendar } from "@/components/Calendar";

export default function HomePage() {
  return (
    <main className="min-h-screen px-4 py-6">
      <div className="mx-auto max-w-md">
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-slate-900">가족 차량 예약</h1>
          <p className="mt-1 text-sm text-slate-600">
            하루에 한 명만 예약할 수 있습니다. 기존 예약은 사유를 적고
            인수할 수 있습니다.
          </p>
        </div>
        <Calendar />
      </div>
    </main>
  );
}
