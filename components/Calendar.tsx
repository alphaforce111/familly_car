"use client";

import { useEffect, useMemo, useState } from "react";
import { ReservationModal } from "@/components/ReservationModal";
import { CarReservation, getSupabaseClient } from "@/lib/supabaseClient";

type CalendarDay = {
  date: Date;
  isoDate: string;
  isCurrentMonth: boolean;
};

const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildMonthDays(currentMonth: Date) {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startDate = new Date(firstDayOfMonth);
  startDate.setDate(firstDayOfMonth.getDate() - firstDayOfMonth.getDay());
  const endDate = new Date(lastDayOfMonth);
  endDate.setDate(lastDayOfMonth.getDate() + (6 - lastDayOfMonth.getDay()));

  const days: CalendarDay[] = [];
  const cursor = new Date(startDate);

  while (cursor <= endDate) {
    days.push({
      date: new Date(cursor),
      isoDate: formatDateKey(cursor),
      isCurrentMonth: cursor.getMonth() === month
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
}

function getFriendlySupabaseError(error: { code?: string; message?: string }) {
  if (error.code === "23505") {
    return "이미 예약된 날짜입니다. 새로고침 후 다시 확인해 주세요.";
  }

  if (error.code === "42501" || error.message?.toLowerCase().includes("row-level security")) {
    return "Supabase 권한 설정 때문에 저장할 수 없습니다. schema.sql의 RLS 정책을 다시 실행해 주세요.";
  }

  return error.message ? `저장 실패: ${error.message}` : "예약 저장에 실패했습니다.";
}

export function Calendar() {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [reservations, setReservations] = useState<Record<string, CarReservation>>(
    {}
  );
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const monthDays = useMemo(() => buildMonthDays(currentMonth), [currentMonth]);
  const selectedReservation = selectedDate ? reservations[selectedDate] ?? null : null;

  const monthLabel = new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long"
  }).format(currentMonth);

  useEffect(() => {
    const fetchReservations = async () => {
      setIsLoading(true);
      setErrorMessage("");

      const startDate = monthDays[0]?.isoDate;
      const endDate = monthDays[monthDays.length - 1]?.isoDate;

      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
          .from("car_reservations")
          .select("*")
          .gte("reservation_date", startDate)
          .lte("reservation_date", endDate)
          .order("reservation_date", { ascending: true });

        if (error) {
          console.error("Failed to fetch reservations:", error);
          setErrorMessage(`예약 정보를 불러오지 못했습니다: ${error.message}`);
          return;
        }

        const nextReservations = (data ?? []).reduce<Record<string, CarReservation>>(
          (accumulator, reservation) => {
            accumulator[reservation.reservation_date] = reservation;
            return accumulator;
          },
          {}
        );

        setReservations(nextReservations);
      } catch (error) {
        console.error("Supabase setup error:", error);
        setErrorMessage(
          error instanceof Error ? error.message : "Supabase 설정이 필요합니다."
        );
      } finally {
        setIsLoading(false);
      }
    };

    void fetchReservations();
  }, [monthDays]);

  const changeMonth = (direction: number) => {
    setCurrentMonth((previousMonth) => {
      const nextMonth = new Date(previousMonth);
      nextMonth.setMonth(previousMonth.getMonth() + direction);
      return new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 1);
    });
  };

  const handleSave = async (reservedBy: string, takeoverReason?: string) => {
    if (!selectedDate) {
      return;
    }

    setIsSaving(true);
    setErrorMessage("");

    try {
      const supabase = getSupabaseClient();
      const existingReservation = reservations[selectedDate];

      if (!existingReservation) {
        const { data, error } = await supabase
          .from("car_reservations")
          .insert({
            reservation_date: selectedDate,
            reserved_by: reservedBy
          })
          .select()
          .single();

        if (error) {
          console.error("Failed to insert reservation:", error);
          setErrorMessage(getFriendlySupabaseError(error));
          return;
        }

        setReservations((previous) => ({
          ...previous,
          [selectedDate]: data
        }));
        setSelectedDate(null);
        return;
      }

      const { data, error } = await supabase
        .from("car_reservations")
        .update({
          reserved_by: reservedBy,
          previous_reserved_by: existingReservation.reserved_by,
          takeover_reason: takeoverReason ?? null
        })
        .eq("reservation_date", selectedDate)
        .select()
        .single();

      if (error) {
        console.error("Failed to update reservation:", error);
        setErrorMessage(getFriendlySupabaseError(error));
        return;
      }

      setReservations((previous) => ({
        ...previous,
        [selectedDate]: data
      }));
      setSelectedDate(null);
    } catch (error) {
      console.error("Failed to save reservation:", error);
      setErrorMessage(
        error instanceof Error ? error.message : "예약 저장에 실패했습니다."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = async () => {
    if (!selectedDate || !reservations[selectedDate]) {
      return;
    }

    setIsSaving(true);
    setErrorMessage("");

    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from("car_reservations")
        .delete()
        .eq("reservation_date", selectedDate);

      if (error) {
        console.error("Failed to cancel reservation:", error);
        setErrorMessage(getFriendlySupabaseError(error));
        return;
      }

      setReservations((previous) => {
        const nextReservations = { ...previous };
        delete nextReservations[selectedDate];
        return nextReservations;
      });
      setSelectedDate(null);
    } catch (error) {
      console.error("Failed to cancel reservation:", error);
      setErrorMessage(
        error instanceof Error ? error.message : "예약 취소에 실패했습니다."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <section className="rounded-3xl bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => changeMonth(-1)}
            className="rounded-full border border-slate-200 px-3 py-2 text-sm text-slate-700"
          >
            이전
          </button>
          <h2 className="text-lg font-semibold text-slate-900">{monthLabel}</h2>
          <button
            type="button"
            onClick={() => changeMonth(1)}
            className="rounded-full border border-slate-200 px-3 py-2 text-sm text-slate-700"
          >
            다음
          </button>
        </div>

        <div className="mb-2 grid grid-cols-7 gap-2 text-center text-xs font-medium text-slate-500">
          {DAY_LABELS.map((label) => (
            <div key={label}>{label}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {monthDays.map((day) => {
            const reservation = reservations[day.isoDate];

            return (
              <button
                type="button"
                key={day.isoDate}
                onClick={() => {
                  setSelectedDate(day.isoDate);
                  setErrorMessage("");
                }}
                className={[
                  "min-h-24 rounded-2xl border p-2 text-left transition",
                  day.isCurrentMonth
                    ? "border-slate-200 bg-white"
                    : "border-slate-100 bg-slate-50 text-slate-400",
                  reservation ? "border-emerald-200 bg-emerald-50" : "",
                  "active:scale-[0.98]"
                ].join(" ")}
              >
                <div className="text-sm font-semibold">{day.date.getDate()}</div>
                {reservation ? (
                  <div className="mt-2">
                    <p className="rounded-xl bg-white/80 px-2 py-1 text-xs font-medium text-slate-800">
                      {reservation.reserved_by}
                    </p>
                    {reservation.previous_reserved_by &&
                    reservation.takeover_reason ? (
                      <p className="mt-1 text-[11px] text-slate-600">
                        {reservation.previous_reserved_by} → {reservation.reserved_by}
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <p className="mt-2 text-[11px] text-slate-400">비어 있음</p>
                )}
              </button>
            );
          })}
        </div>

        {isLoading ? (
          <p className="mt-4 text-sm text-slate-500">불러오는 중...</p>
        ) : null}

        {!isLoading && errorMessage && !selectedDate ? (
          <p className="mt-4 rounded-2xl bg-red-50 px-3 py-2 text-sm text-red-600">
            {errorMessage}
          </p>
        ) : null}
      </section>

      <ReservationModal
        isOpen={Boolean(selectedDate)}
        selectedDate={selectedDate ?? ""}
        reservation={selectedReservation}
        isSaving={isSaving}
        errorMessage={selectedDate ? errorMessage : ""}
        onClose={() => {
          setSelectedDate(null);
          setErrorMessage("");
        }}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </>
  );
}
