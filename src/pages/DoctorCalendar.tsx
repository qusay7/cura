import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/axios";

// ═══════════════════════════════════════════════
// Types — مطابقة لـ DoctorCalendarDto من الـ API
// ═══════════════════════════════════════════════

type SlotStatus = "available" | "booked" | "absent" | "past";

interface CalendarSlot {
  start: string;                 // "09:00"
  end: string;                   // "09:30"
  status: SlotStatus;
  appointmentId?: string | null;
  patientName?: string | null;
  appointmentStatus?: string | null;
}

interface CalendarDay {
  date: string;                  // ISO
  dayOfWeek: number;
  isWorkingDay: boolean;
  isAbsent: boolean;
  slots: CalendarSlot[];
}

interface DoctorCalendarDto {
  doctorId: string;
  doctorName: string;
  from: string;
  to: string;
  days: CalendarDay[];
}

interface DoctorItem {
  id: string;
  fullName: string;
  specialty?: string | null;
}

type ViewKey = "1w" | "2w" | "3w" | "1m" | "2m";

interface Props {
  onCreateAppointment?: (payload: { doctorId: string; dateTime: string }) => void;
  onOpenAppointment?: (appointmentId: string) => void;
  initialDoctorId?: string;
}

// ═══════════════════════════════════════════════
// i18n
// ═══════════════════════════════════════════════

const getStoredLang = (): "ar" | "en" =>
  (localStorage.getItem("cura-lang") as "ar" | "en") || "en";

const T = {
  ar: {
    noDoctors: "— لا يوجد أطباء —",
    prev: "السابق", today: "اليوم", next: "التالي",
    available: "متاح", booked: "محجوز", absent: "إجازة", past: "منتهٍ",
    time: "الوقت",
    loading: "جارٍ التحميل…",
    errorDoctors: "تعذّر تحميل قائمة الأطباء",
    errorCalendar: "تعذّر تحميل التقويم",
    retry: "إعادة المحاولة",
    empty: "لا يوجد دوام لهذا الطبيب ضمن الفترة المحددة.",
    views: { "1w": "أسبوع", "2w": "أسبوعين", "3w": "٣ أسابيع", "1m": "شهر", "2m": "شهرين" },
    days: ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"],
   print: "طباعة", excel: "إكسل", pdf: "PDF", exporting: "جارٍ التصدير…",
   dailySchedule: "📋 جدول اليوم",
  },
  en: {
    noDoctors: "— No doctors —",
    prev: "Previous", today: "Today", next: "Next",
    available: "Available", booked: "Booked", absent: "Off", past: "Past",
    time: "Time",
    loading: "Loading…",
    errorDoctors: "Failed to load doctors",
    errorCalendar: "Failed to load calendar",
    retry: "Retry",
    empty: "This doctor has no working hours in the selected period.",
    views: { "1w": "Week", "2w": "2 Weeks", "3w": "3 Weeks", "1m": "Month", "2m": "2 Months" },
    days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    print: "Print", excel: "Excel", pdf: "PDF", exporting: "Exporting…",
    dailySchedule: "📋 Today's Schedule",
  },
};

const VIEW_KEYS: ViewKey[] = ["1w", "2w", "3w", "1m", "2m"];

// ═══════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════

const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

/** بداية الأسبوع = السبت */
const startOfWeek = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const diff = (x.getDay() + 1) % 7; // السبت = 0
  x.setDate(x.getDate() - diff);
  return x;
};

const weeksOf = (v: ViewKey) => (v === "1w" ? 1 : v === "2w" ? 2 : v === "3w" ? 3 : 0);

/** يحسب مدى العرض من تاريخ المرجع */
const getRange = (anchor: Date, view: ViewKey) => {
  if (view === "1m" || view === "2m") {
    const months = view === "1m" ? 1 : 2;
    const from = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    const to = new Date(anchor.getFullYear(), anchor.getMonth() + months, 0);
    return { from, to };
  }
  const w = weeksOf(view);
  const from = startOfWeek(anchor);
  return { from, to: addDays(from, w * 7 - 1) };
};

/** نقلة السابق/التالي بنفس مدى العرض */
const shiftAnchor = (anchor: Date, view: ViewKey, dir: 1 | -1) => {
  if (view === "1m") return new Date(anchor.getFullYear(), anchor.getMonth() + dir, 1);
  if (view === "2m") return new Date(anchor.getFullYear(), anchor.getMonth() + dir * 2, 1);
  return addDays(anchor, dir * weeksOf(view) * 7);
};

const fmtRange = (from: Date, to: Date, locale: string) =>
  `${from.toLocaleDateString(locale, { day: "numeric", month: "short" })} — ${to.toLocaleDateString(
    locale,
    { day: "numeric", month: "short", year: "numeric" }
  )}`;

// ── ألوان النظام ──
const PRIMARY = "#5B8C8F";
const TEXT_DARK = "#2C3E3F";
const TEXT_MUTED = "#6B8A8C";
const BORDER = "#DCE5E5";

const STATUS_STYLE: Record<SlotStatus, { bg: string; color: string }> = {
  available: { bg: "#EAF6EE", color: "#2F7D4F" },
  booked: { bg: "#E8F0F0", color: "#33686B" },
  absent: { bg: "#FBECEC", color: "#B4453F" },
  past: { bg: "#F2F4F4", color: "#9AA8A9" },
};

const btnStyle: React.CSSProperties = {
  background: "#FFFFFF",
  border: `1px solid ${BORDER}`,
  borderRadius: 10,
  padding: "8px 14px",
  fontSize: 13,
  color: TEXT_DARK,
  cursor: "pointer",
  fontFamily: "inherit",
};

// ═══════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════

export default function DoctorCalendar({
  onCreateAppointment,
  onOpenAppointment,
  initialDoctorId,
}: Props) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [lang, setLang] = useState<"ar" | "en">(getStoredLang);
  const [doctors, setDoctors] = useState<DoctorItem[]>([]);
  // ✅ يقبل ?doctorId= قادم من رابط جدول اليوم عشان يفتح نفس الطبيب مباشرة
  const [doctorId, setDoctorId] = useState<string>(initialDoctorId ?? searchParams.get("doctorId") ?? "");
  const [view, setView] = useState<ViewKey>("1w");
  const [anchor, setAnchor] = useState<Date>(() => new Date());
  const [data, setData] = useState<DoctorCalendarDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const t = T[lang];
  const isAr = lang === "ar";
  const locale = isAr ? "ar-EG" : "en-US";

  const { from, to } = useMemo(() => getRange(anchor, view), [anchor, view]);
  const todayStr = ymd(new Date());

  // تغيير اللغة من الشريط الجانبي
    // تنسيق الطباعة
  useEffect(() => {
    const id = "doctor-calendar-print-css";
    if (document.getElementById(id)) return;
    const style = document.createElement("style");
    style.id = id;
    style.textContent = `
@media print {
  @page { size: landscape; margin: 10mm; }
  .doctor-calendar-wrap { max-height: none !important; overflow: visible !important; border: none !important; }
  .doctor-calendar-wrap table { font-size: 9px !important; }
  .doctor-calendar-wrap td, .doctor-calendar-wrap th { padding: 3px 4px !important; }
}`;
    document.head.appendChild(style);
  }, []);

  // جلب الأطباء
  useEffect(() => {
    let alive = true;
    api
      .get("/doctors")
      .then((res) => {
        if (!alive) return;
        const list: DoctorItem[] = res.data;
        setDoctors(list);
        if (!doctorId && list.length > 0) setDoctorId(list[0].id);
      })
      .catch(() => alive && setError(T[getStoredLang()].errorDoctors));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // جلب التقويم
  const load = useCallback(async () => {
    if (!doctorId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/schedules/doctor/${doctorId}/calendar`, {
        params: { from: ymd(from), to: ymd(to) },
      });
      setData(res.data);
    } catch {
      setError(T[getStoredLang()].errorCalendar);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [doctorId, from, to]);

  useEffect(() => {
    load();
  }, [load]);

  const days = data?.days ?? [];

  // كل أوقات البدء الموجودة في المدى — تصير صفوف الجدول
  const times = useMemo(() => {
    const set = new Set<string>();
    days.forEach((d) => d.slots.forEach((s) => set.add(s.start)));
    return Array.from(set).sort();
  }, [days]);

  const slotMap = useMemo(() => {
    const map = new Map<string, CalendarSlot>();
    days.forEach((d) => {
      const key = d.date.slice(0, 10);
      d.slots.forEach((s) => map.set(`${key}|${s.start}`, s));
    });
    return map;
  }, [days]);

  const handleSlotClick = (dateKey: string, slot: CalendarSlot) => {
    if (slot.status === "booked" && slot.appointmentId) {
      if (onOpenAppointment) onOpenAppointment(slot.appointmentId);
      else navigate(`/appointments/${slot.appointmentId}`);
    } else if (slot.status === "available") {
      const dateTime = `${dateKey}T${slot.start}:00`;
      if (onCreateAppointment) onCreateAppointment({ doctorId, dateTime });
      else navigate("/appointments/add", { state: { prefillDoctorId: doctorId, prefillDateTime: dateTime } });
    }
  };
  const handleExport = async (format: "pdf" | "excel") => {
    if (!doctorId) return;
    setExporting(true);
    try {
      const res = await api.get(`/schedules/doctor/${doctorId}/calendar/export`, {
        params: { from: ymd(from), to: ymd(to), format, lang },
        responseType: "blob",
      });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = format === "excel" ? "doctor-calendar.xlsx" : "doctor-calendar.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* ─── شريط التحكم ─── */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
        <select
          value={doctorId}
          onChange={(e) => setDoctorId(e.target.value)}
          style={{ ...btnStyle, minWidth: 190, padding: "8px 12px" }}
        >
          {doctors.length === 0 && <option value="">{t.noDoctors}</option>}
          {doctors.map((d) => (
            <option key={d.id} value={d.id}>
              {d.fullName}
              {d.specialty ? ` — ${d.specialty}` : ""}
            </option>
          ))}
        </select>

        <div style={{ display: "flex", border: `1px solid ${BORDER}`, borderRadius: 10, overflow: "hidden" }}>
          {VIEW_KEYS.map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{
                border: "none",
                borderInlineStart: `1px solid ${BORDER}`,
                padding: "8px 13px",
                fontSize: 13,
                cursor: "pointer",
                fontFamily: "inherit",
                background: view === v ? PRIMARY : "#FFFFFF",
                color: view === v ? "#FFFFFF" : TEXT_DARK,
              }}
            >
              {t.views[v]}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 6 }}>
          <button style={btnStyle} onClick={() => setAnchor(shiftAnchor(anchor, view, -1))}>{t.prev}</button>
          <button style={btnStyle} onClick={() => setAnchor(new Date())}>{t.today}</button>
          <button style={btnStyle} onClick={() => setAnchor(shiftAnchor(anchor, view, 1))}>{t.next}</button>
        </div>

                <div style={{ display: "flex", gap: 6 }}>
          <button style={btnStyle} onClick={() => navigate(`/daily${doctorId ? `?doctorId=${doctorId}` : ""}`)}>{t.dailySchedule}</button>
          <button style={btnStyle} onClick={() => window.print()}>🖨️ {t.print}</button>
          <button style={btnStyle} disabled={exporting} onClick={() => handleExport("excel")}>
            {exporting ? t.exporting : `📊 ${t.excel}`}
          </button>
          <button style={btnStyle} disabled={exporting} onClick={() => handleExport("pdf")}>
            {exporting ? t.exporting : `📄 ${t.pdf}`}
          </button>
        </div>

        <span style={{ fontSize: 13, color: TEXT_MUTED }}>{fmtRange(from, to, locale)}</span>

        <div style={{ display: "flex", gap: 12, fontSize: 12, color: TEXT_MUTED, marginInlineStart: "auto" }}>
          <span>🟢 {t.available}</span>
          <span>🔵 {t.booked}</span>
          <span>🔴 {t.absent}</span>
          <span>⚪ {t.past}</span>
        </div>
      </div>

      {/* ─── الحالات ─── */}
      {error && (
        <div style={{ padding: 12, borderRadius: 12, background: "#FBECEC", color: "#B4453F", fontSize: 13, display: "flex", gap: 12, alignItems: "center" }}>
          {error}
          <button onClick={load} style={{ background: "none", border: "none", color: "#B4453F", textDecoration: "underline", cursor: "pointer", fontFamily: "inherit" }}>
            {t.retry}
          </button>
        </div>
      )}

      {loading && <div style={{ padding: 24, textAlign: "center", color: TEXT_MUTED, fontSize: 13 }}>{t.loading}</div>}

      {!loading && !error && times.length === 0 && (
        <div style={{ padding: 32, textAlign: "center", color: TEXT_MUTED, fontSize: 13 }}>
          {t.empty}
        </div>
      )}

      {/* ─── الجدول ─── */}
      {!loading && times.length > 0 && (
        <div className="doctor-calendar-wrap" style={{ overflow: "auto", border: `1px solid ${BORDER}`, borderRadius: 14, maxHeight: "70vh", background: "#FFFFFF" }}>          
          <table style={{ borderCollapse: "collapse", fontSize: 13, width: "max-content" }}>
            <thead>
              <tr>
                <th style={{
                  position: "sticky", top: 0, insetInlineStart: 0, zIndex: 3,
                  background: "#EEF3F3", border: `1px solid ${BORDER}`, padding: "8px 12px",
                  width: 78, color: TEXT_MUTED, fontSize: 12,
                }}>
                  {t.time}
                </th>
                {days.map((d) => {
                  const key = d.date.slice(0, 10);
                  const dt = new Date(key);
                  const isToday = key === todayStr;
                  return (
                    <th
                      key={key}
                      style={{
                        position: "sticky", top: 0, zIndex: 2,
                        border: `1px solid ${BORDER}`, padding: "8px 12px", minWidth: 118,
                        whiteSpace: "nowrap",
                        background: isToday ? "#DCEAEA" : "#EEF3F3",
                        color: isToday ? PRIMARY : TEXT_DARK,
                      }}
                    >
                      <div style={{ fontWeight: 600 }}>{t.days[dt.getDay()]}</div>
                      <div style={{ fontSize: 11, fontWeight: 400, color: TEXT_MUTED }}>
                        {dt.toLocaleDateString(locale, { day: "numeric", month: "numeric" })}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {times.map((time) => (
                <tr key={time}>
                  <td style={{
                    position: "sticky", insetInlineStart: 0, zIndex: 1,
                    background: "#F8FAFA", border: `1px solid ${BORDER}`,
                    padding: "6px 12px", textAlign: "center", color: TEXT_MUTED,
                    fontVariantNumeric: "tabular-nums",
                  }}>
                    {time}
                  </td>
                  {days.map((d) => {
                    const key = d.date.slice(0, 10);
                    const slot = slotMap.get(`${key}|${time}`);
                    const isToday = key === todayStr;

                    if (!slot)
                      return (
                        <td key={key} style={{
                          border: `1px solid ${BORDER}`, padding: "6px 8px", textAlign: "center",
                          color: "#C8D2D3", background: isToday ? "#F4F9F9" : "#FAFBFB",
                        }}>
                          —
                        </td>
                      );

                    const s = STATUS_STYLE[slot.status];
                    const label: Record<SlotStatus, string> = {
                      available: `🟢 ${t.available}`,
                      booked: `🔵 ${slot.patientName ?? t.booked}`,
                      absent: `🔴 ${t.absent}`,
                      past: "⚪ —",
                    };
                    const clickable = slot.status === "available" || slot.status === "booked";

                    return (
                      <td
                        key={key}
                        onClick={() => clickable && handleSlotClick(key, slot)}
                        title={`${time} — ${slot.end}`}
                        style={{
                          border: `1px solid ${BORDER}`, padding: "6px 8px", textAlign: "center",
                          whiteSpace: "nowrap", background: s.bg, color: s.color,
                          cursor: clickable ? "pointer" : "default",
                          boxShadow: isToday ? `inset 0 0 0 1px ${PRIMARY}33` : undefined,
                          maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis",
                        }}
                      >
                        {label[slot.status]}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}