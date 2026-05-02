"use client";

import { useEffect, useState } from "react";
import type { CarReservation } from "@/lib/supabaseClient";

const FAMILY_MEMBERS = ["아빠", "엄마", "아들1", "아들2"] as const;

type ReservationModalProps = {
  isOpen: boolean;
  selectedDate: string;
  reservation: CarReservation | null;
  isSaving: boolean;
  errorMessage: string;
  onClose: () => void;
  onSave: (reservedBy: string, takeoverReason?: string) => Promise<void>;
};

export function ReservationModal({
  isOpen,
  selectedDate,
  reservation,
  isSaving,
  errorMessage,
  onClose,
  onSave
}: ReservationModalProps) {
  const [selectedMember, setSelectedMember] = useState<string>(FAMILY_MEMBERS[0]);
  const [takeoverReason, setTakeoverReason] = useState("");
  const [validationMessage, setValidationMessage] = useState("");

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setSelectedMember(reservation?.reserved_by ?? FAMILY_MEMBERS[0]);
    setTakeoverReason("");
    setValidationMessage("");
  }, [isOpen, reservation]);

  if (!isOpen) {
    return null;
  }

  const isTakeover = Boolean(reservation);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isTakeover && !takeoverReason.trim()) {
      setValidationMessage("인수 사유를 입력해 주세요.");
      return;
    }

    setValidationMessage("");
    await onSave(selectedMember, takeoverReason.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-slate-950/40 sm:items-center sm:justify-center">
      <div className="w-full rounded-t-3xl bg-white p-5 shadow-xl sm:max-w-sm sm:rounded-3xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {selectedDate}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {isTakeover ? "예약 인수" : "새 예약"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-3 py-1 text-sm text-slate-500"
          >
            닫기
          </button>
        </div>

        {reservation ? (
          <div className="mb-4 rounded-2xl bg-amber-50 p-3 text-sm text-slate-700">
            <p>
              현재 예약자:{" "}
              <span className="font-semibold">{reservation.reserved_by}</span>
            </p>
            {reservation.previous_reserved_by && reservation.takeover_reason ? (
              <div className="mt-2 border-t border-amber-100 pt-2 text-xs text-slate-600">
                <p>이전 예약자: {reservation.previous_reserved_by}</p>
                <p>인수 사유: {reservation.takeover_reason}</p>
              </div>
            ) : null}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              예약자
            </label>
            <select
              value={selectedMember}
              onChange={(event) => setSelectedMember(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base outline-none transition focus:border-slate-400"
            >
              {FAMILY_MEMBERS.map((member) => (
                <option key={member} value={member}>
                  {member}
                </option>
              ))}
            </select>
          </div>

          {isTakeover ? (
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                인수 사유
              </label>
              <textarea
                value={takeoverReason}
                onChange={(event) => setTakeoverReason(event.target.value)}
                className="min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3 text-base outline-none transition focus:border-slate-400"
                placeholder="사유를 입력하세요"
              />
            </div>
          ) : null}

          {validationMessage || errorMessage ? (
            <p className="rounded-2xl bg-red-50 px-3 py-2 text-sm text-red-600">
              {validationMessage || errorMessage}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSaving}
            className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-base font-medium text-white transition disabled:opacity-50"
          >
            {isSaving ? "저장 중..." : isTakeover ? "인수 저장" : "예약 저장"}
          </button>
        </form>
      </div>
    </div>
  );
}
