interface FaqWidgetProps {
  title?: string;
  subtitle?: string;
  primaryColor?: string;
  items: Array<{ question: string; answer: string }>;
  expandFirst?: boolean;
}

export function FaqWidget({
  title = "FAQ",
  subtitle,
  primaryColor = "#2563eb",
  items,
  expandFirst = false,
}: FaqWidgetProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold" style={{ color: primaryColor }}>
        {title}
      </h2>
      {subtitle ? <p className="mt-1 text-sm text-slate-600">{subtitle}</p> : null}

      <div className="mt-5 space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-slate-600">No FAQ items configured.</p>
        ) : (
          items.map((item, index) => (
            <details
              key={item.question}
              className="rounded-lg border border-slate-200 px-4 py-3"
              open={expandFirst && index === 0}
            >
              <summary className="cursor-pointer font-medium">{item.question}</summary>
              <p className="mt-2 text-sm text-slate-600">{item.answer}</p>
            </details>
          ))
        )}
      </div>
    </div>
  );
}
