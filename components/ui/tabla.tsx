import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from "react";
import { cn } from "@/lib/formato";

export function Tabla({ className, ...props }: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto">
      <table className={cn("w-full border-collapse text-b1 text-mid-900", className)} {...props} />
    </div>
  );
}

export function Th({ className, numerica, ...props }: ThHTMLAttributes<HTMLTableCellElement> & { numerica?: boolean }) {
  return (
    <th
      scope="col"
      className={cn(
        "sticky top-0 z-[1] whitespace-nowrap border-b border-light-600 bg-light-400 px-3 py-2 text-left text-a3 font-semibold text-mid-600",
        numerica && "text-right",
        className,
      )}
      {...props}
    />
  );
}

export function Td({ className, numerica, ...props }: TdHTMLAttributes<HTMLTableCellElement> & { numerica?: boolean }) {
  return <td className={cn("border-b border-light-600 px-3 py-2.5 align-middle", numerica && "whitespace-nowrap text-right tabular-nums", className)} {...props} />;
}

export function Fila({ className, onClick, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      onClick={onClick}
      className={cn("transition-colors hover:bg-canvas", onClick && "cursor-pointer focus-within:bg-canvas", className)}
      {...props}
    />
  );
}
