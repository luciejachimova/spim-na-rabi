"use client"

import { useEffect, useMemo, useState } from "react"
import { useLocale, useTranslations } from "next-intl"

function toDateKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function keyToDate(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number)
  return new Date(year, month - 1, day)
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function isBusyOnDate(dateKey, apartmentSelection, availabilityBySlug) {
  const slugs = Object.keys(availabilityBySlug)
  if (slugs.length === 0) return false

  const isBusyForSlug = (slug) =>
    (availabilityBySlug[slug] || []).some((range) => dateKey >= range.start && dateKey < range.end)

  if (apartmentSelection && apartmentSelection !== "any") {
    return isBusyForSlug(apartmentSelection)
  }

  // "No preference" / not chosen yet: a day only counts as fully booked
  // when every apartment is taken — otherwise "any" can still be booked.
  return slugs.every(isBusyForSlug)
}

export function AvailabilityCalendar({ apartmentSelection, dateFrom, dateTo, onChange }) {
  const t = useTranslations("calendar")
  const locale = useLocale()
  const [availabilityBySlug, setAvailabilityBySlug] = useState({})
  const [loadError, setLoadError] = useState(null)
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(new Date()))
  const [rangeError, setRangeError] = useState(null)

  // Locale-aware month title, weekday headers, and summary dates.
  const weekdayLabels = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale, { weekday: "short" })
    // 2024-01-01 is a Monday — build Mon…Sun.
    return Array.from({ length: 7 }, (_, i) => formatter.format(new Date(2024, 0, 1 + i)))
  }, [locale])

  const monthFormatter = useMemo(() => new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }), [locale])
  const dateFormatter = useMemo(() => new Intl.DateTimeFormat(locale, { day: "numeric", month: "numeric", year: "numeric" }), [locale])
  const formatDisplayDate = (dateKey) => dateFormatter.format(keyToDate(dateKey))

  useEffect(() => {
    let cancelled = false

    fetch("/api/availability")
      .then((response) => response.json())
      .then((payload) => {
        if (cancelled) return
        const bySlug = {}
        for (const apartment of payload.apartments || []) {
          bySlug[apartment.slug] = apartment.busyRanges
        }
        setAvailabilityBySlug(bySlug)
      })
      .catch(() => {
        if (!cancelled) setLoadError(t("loadError"))
      })

    return () => {
      cancelled = true
    }
  }, [t])

  const todayKey = useMemo(() => toDateKey(new Date()), [])

  const days = useMemo(() => {
    const firstDay = startOfMonth(visibleMonth)
    const startWeekday = (firstDay.getDay() + 6) % 7 // Monday = 0
    const daysInMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0).getDate()

    const cells = []
    for (let i = 0; i < startWeekday; i++) {
      cells.push(null)
    }
    for (let day = 1; day <= daysInMonth; day++) {
      cells.push(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day))
    }
    return cells
  }, [visibleMonth])

  function isInSelectedRange(dateKey) {
    if (!dateFrom || !dateTo) return false
    return dateKey > dateFrom && dateKey < dateTo
  }

  function isRangeFree(fromKey, toKeyExclusive) {
    for (let cursor = fromKey; cursor < toKeyExclusive; ) {
      if (isBusyOnDate(cursor, apartmentSelection, availabilityBySlug)) {
        return false
      }
      const next = new Date(cursor)
      next.setDate(next.getDate() + 1)
      cursor = toDateKey(next)
    }
    return true
  }

  function handleDayClick(dateKey, busy) {
    // Busy days are already rendered disabled, but guard here too since
    // this is also reachable for the "reset to a new start" paths below.
    if (dateKey < todayKey || busy) return

    const hasOpenStart = dateFrom && !dateTo

    if (!hasOpenStart || dateKey <= dateFrom) {
      setRangeError(null)
      onChange({ dateFrom: dateKey, dateTo: "" })
      return
    }

    if (isRangeFree(dateFrom, dateKey)) {
      setRangeError(null)
      onChange({ dateFrom, dateTo: dateKey })
      return
    }

    // Completing this range would cross a booked date — rather than freezing
    // on an error, treat the clicked (free) date as a fresh start so the
    // guest can immediately try a different range without getting stuck.
    setRangeError(t("rangeError"))
    onChange({ dateFrom: dateKey, dateTo: "" })
  }

  function goToMonth(offset) {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1))
  }

  const now = new Date()
  const isCurrentMonth = visibleMonth.getFullYear() === now.getFullYear() && visibleMonth.getMonth() === now.getMonth()

  return (
    <div className="rounded-[2px] border border-mid/20 bg-pale p-4">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => goToMonth(-1)}
          disabled={isCurrentMonth}
          className="cursor-pointer px-2 py-1 text-mid disabled:cursor-not-allowed disabled:opacity-30"
          aria-label={t("prevMonth")}
        >
          ‹
        </button>
        <p className="text-sm font-medium uppercase tracking-wide text-dark">
          {monthFormatter.format(visibleMonth)}
        </p>
        <button
          type="button"
          onClick={() => goToMonth(1)}
          className="cursor-pointer px-2 py-1 text-mid hover:text-dark"
          aria-label={t("nextMonth")}
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[0.7rem] uppercase text-mid">
        {weekdayLabels.map((label, index) => (
          <div key={index} className="py-1">
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((date, index) => {
          if (!date) return <div key={`empty-${index}`} />

          const dateKey = toDateKey(date)
          const busy = isBusyOnDate(dateKey, apartmentSelection, availabilityBySlug)
          const past = dateKey < todayKey
          const isStart = dateKey === dateFrom
          const isEnd = dateKey === dateTo
          const inRange = isInSelectedRange(dateKey)

          let className =
            "aspect-square rounded-[2px] text-xs transition-colors flex items-center justify-center "

          if (past) {
            className += "text-mid/40 cursor-not-allowed"
          } else if (isStart || isEnd) {
            className += "cursor-pointer bg-dark text-cream font-medium"
          } else if (inRange) {
            className += "cursor-pointer bg-accent/30 text-dark"
          } else if (busy) {
            className += "cursor-not-allowed bg-mid/20 text-mid/60 line-through"
          } else {
            className += "cursor-pointer bg-cream text-dark hover:bg-accent/40"
          }

          return (
            <button
              type="button"
              key={dateKey}
              disabled={past || (busy && dateKey !== dateFrom)}
              onClick={() => handleDayClick(dateKey, busy)}
              className={className}
            >
              {date.getDate()}
            </button>
          )
        })}
      </div>

      <div className="mt-3 flex flex-wrap gap-4 text-[0.68rem] text-mid">
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-[2px] bg-cream border border-mid/30" /> {t("legendFree")}
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-[2px] bg-mid/20" /> {t("legendBusy")}
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-[2px] bg-dark" /> {t("legendSelected")}
        </span>
      </div>

      <p className="mt-3 text-sm text-dark">
        {dateFrom && dateTo
          ? t("range", { from: formatDisplayDate(dateFrom), to: formatDisplayDate(dateTo) })
          : dateFrom
            ? t("pickEnd", { date: formatDisplayDate(dateFrom) })
            : t("selectStart")}
      </p>
      {rangeError && <p className="mt-1 text-sm text-accent">{rangeError}</p>}
      {loadError && <p className="mt-1 text-sm text-accent">{loadError}</p>}
    </div>
  )
}
