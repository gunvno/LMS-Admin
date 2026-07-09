import { MoreVertical } from "lucide-react";
import Link from "next/link";
import { ReactNode } from "react";

type ActionMenuItem = {
  label: string;
  icon?: ReactNode;
  href?: string;
  danger?: boolean;
  disabled?: boolean;
  onClick?: () => void;
};

type ActionMenuProps = {
  items: ActionMenuItem[];
  align?: "left" | "right";
};

export default function ActionMenu({ items, align = "right" }: ActionMenuProps) {
  return (
    <details className={`action-menu action-menu-${align}`}>
      <summary className="icon-btn action-menu-trigger" title="Thao tác" aria-label="Mở menu thao tác">
        <MoreVertical size={18} />
      </summary>
      <div className="action-menu-content">
        {items.map((item) => {
          const className = `action-menu-item${item.danger ? " danger" : ""}`;

          if (item.href) {
            return (
              <Link key={item.label} href={item.href} className={className} aria-disabled={item.disabled}>
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          }

          return (
            <button
              key={item.label}
              type="button"
              className={className}
              disabled={item.disabled}
              onClick={item.onClick}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </details>
  );
}
