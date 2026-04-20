import { useState } from "react";

const tabs = [
  {
    label: "Zones",
    icon: (
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18M3 15h18M9 3v18" />
      </svg>
    ),
  },
  {
    label: "Wing",
    icon: (
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
      </svg>
    ),
  },
  {
    label: "Exit Row",
    icon: (
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </svg>
    ),
  },
  {
    label: "Emergency Exit",
    icon: (
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M13 4h3a2 2 0 0 1 2 2v14" />
        <path d="M2 20h20" />
        <path d="M13 20v-16a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v16" />
      </svg>
    ),
  },
];

export const AircraftToolbar = () => {
  const [active, setActive] = useState<number | null>(null);
  return (
    <div className="flex items-center justify-between rounded-t-xl border border-b-0 border-gray-100 bg-white px-6 py-3">
      <span className="text-muted-foreground text-[11px] font-bold tracking-widest uppercase">
        Aircraft Seat Configuration
      </span>
      <div className="flex w-fit items-center gap-1 rounded-full border border-gray-200 bg-white px-1.5 py-1.5">
        {tabs.map((tab, idx) => (
          <button
            key={tab.label}
            onClick={() => setActive(active === idx ? null : idx)}
            className={`flex cursor-pointer items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11px] font-bold tracking-wide uppercase transition-colors ${
              active === idx
                ? "bg-blue-50 text-blue-600"
                : "text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};
