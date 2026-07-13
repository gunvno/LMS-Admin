"use client";

import { MoreVertical } from "lucide-react";
import Link from "next/link";
import {
  ReactNode,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

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

const MENU_GAP = 8;
const VIEWPORT_PADDING = 8;

export default function ActionMenu({ items, align = "right" }: ActionMenuProps) {
  const menuId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const triggerRect = trigger.getBoundingClientRect();
    const menuWidth = menuRef.current?.offsetWidth ?? 180;
    const menuHeight = menuRef.current?.offsetHeight ?? items.length * 38 + 12;
    const preferredLeft = align === "right"
      ? triggerRect.right - menuWidth
      : triggerRect.left;
    const left = Math.min(
      Math.max(VIEWPORT_PADDING, preferredLeft),
      window.innerWidth - menuWidth - VIEWPORT_PADDING,
    );

    const below = triggerRect.bottom + MENU_GAP;
    const above = triggerRect.top - menuHeight - MENU_GAP;
    const top = below + menuHeight <= window.innerHeight - VIEWPORT_PADDING
      ? below
      : Math.max(VIEWPORT_PADDING, above);

    setPosition({ top, left });
  }, [align, items.length]);

  useLayoutEffect(() => {
    if (open) updatePosition();
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;

    const closeOnOutsideClick = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    const closeOnViewportChange = () => setOpen(false);

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    window.addEventListener("resize", closeOnViewportChange);
    window.addEventListener("scroll", closeOnViewportChange, true);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("resize", closeOnViewportChange);
      window.removeEventListener("scroll", closeOnViewportChange, true);
    };
  }, [open]);

  return (
    <span className={`action-menu action-menu-${align}`} onClick={(event) => event.stopPropagation()}>
      <button
        ref={triggerRef}
        type="button"
        className="icon-btn action-menu-trigger"
        title="Thao tác"
        aria-label="Mở menu thao tác"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={(event) => {
          event.stopPropagation();
          setOpen((current) => !current);
        }}
      >
        <MoreVertical size={18} />
      </button>

      {open && createPortal(
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          className="action-menu-content"
          style={position}
          onClick={(event) => event.stopPropagation()}
        >
          {items.map((item) => {
            const className = `action-menu-item${item.danger ? " danger" : ""}`;

            if (item.href) {
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  role="menuitem"
                  className={className}
                  aria-disabled={item.disabled}
                  onClick={(event) => {
                    event.stopPropagation();
                    if (item.disabled) {
                      event.preventDefault();
                      return;
                    }
                    setOpen(false);
                  }}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              );
            }

            return (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                className={className}
                disabled={item.disabled}
                onClick={(event) => {
                  event.stopPropagation();
                  setOpen(false);
                  item.onClick?.();
                }}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>,
        document.body,
      )}
    </span>
  );
}
