"use client";

import {
  Children,
  isValidElement,
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";
import { createPortal } from "react-dom";
import { useOverlayMenu } from "@/components/overlay-menu";

type Item = { value: string; label: string };
type Group = { label?: string; items: Item[] };

function textOf(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) {
    return textOf(node.props.children);
  }
  return "";
}

function readGroups(children: ReactNode): Group[] {
  const groups: Group[] = [];
  let loose: Item[] = [];
  const flush = () => {
    if (!loose.length) return;
    groups.push({ items: loose });
    loose = [];
  };
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    if (child.type === "optgroup") {
      flush();
      const items: Item[] = [];
      const group = child.props as { label?: string; children?: ReactNode };
      Children.forEach(group.children, (option) => {
        if (!isValidElement(option) || option.type !== "option") return;
        const props = option.props as { value?: string | number; children?: ReactNode };
        items.push({
          value: String(props.value ?? ""),
          label: textOf(props.children) || String(props.value ?? ""),
        });
      });
      groups.push({ label: group.label, items });
      return;
    }
    if (child.type === "option") {
      const props = child.props as { value?: string | number; children?: ReactNode };
      loose.push({
        value: String(props.value ?? ""),
        label: textOf(props.children) || String(props.value ?? ""),
      });
    }
  });
  flush();
  return groups;
}

function renderOverlay(node: ReactNode, style: object | null) {
  if (style && typeof document !== "undefined") return createPortal(node, document.body);
  return node;
}

function asValue(
  value: SelectHTMLAttributes<HTMLSelectElement>["value"] | undefined,
): string {
  if (Array.isArray(value)) return String(value[0] ?? "");
  if (value === undefined || value === null) return "";
  return String(value);
}

export function MenuSelect({
  children,
  className,
  value: valueProp,
  defaultValue,
  onChange,
  disabled,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement>) {
  const groups = readGroups(children);
  const items = groups.flatMap((group) => group.items);
  const isControlled = valueProp !== undefined;
  const [uncontrolled, setUncontrolled] = useState(() => asValue(defaultValue));
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const selectRef = useRef<HTMLSelectElement>(null);
  const overlayStyle = useOverlayMenu(open, triggerRef, "left", () => setOpen(false));
  const controlledRef = useRef(isControlled);
  controlledRef.current = isControlled;
  const listId = useId();
  const value = isControlled ? asValue(valueProp) : uncontrolled;
  const current = items.find((item) => item.value === value);

  useEffect(() => {
    const select = selectRef.current;
    if (!select) return;
    const descriptor = Object.getOwnPropertyDescriptor(
      HTMLSelectElement.prototype,
      "value",
    );
    if (!descriptor?.get || !descriptor.set) return;
    const prototypeGet = descriptor.get;
    const prototypeSet = descriptor.set;
    Object.defineProperty(select, "value", {
      configurable: true,
      enumerable: true,
      get() {
        return prototypeGet.call(this);
      },
      set(next: string) {
        const currentValue = String(prototypeGet.call(this));
        prototypeSet.call(this, next);
        if (currentValue !== String(next) && !controlledRef.current) {
          setUncontrolled(String(next));
        }
      },
    });
    return () => {
      Reflect.deleteProperty(select, "value");
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function choose(next: string) {
    const select = selectRef.current;
    setOpen(false);
    if (!select || select.value === next) return;
    select.value = next;
    if (!isControlled) setUncontrolled(next);
    onChange?.({
      target: select,
      currentTarget: select,
    } as ChangeEvent<HTMLSelectElement>);
  }

  return (
    <div className={className ? `menu-select ${className}` : "menu-select"} ref={rootRef}>
      <select
        {...rest}
        ref={selectRef}
        className="menu-select-native"
        {...(isControlled
          ? { value }
          : { defaultValue: asValue(defaultValue) })}
        disabled={disabled}
        tabIndex={-1}
        aria-hidden
        onChange={onChange}
        onFocus={(event) => {
          event.currentTarget.blur();
          if (!disabled) setOpen(true);
        }}
        onMouseDown={(event) => {
          event.preventDefault();
          if (!disabled) setOpen(true);
        }}
      >
        {children}
      </select>
      <button
        ref={triggerRef}
        type="button"
        className="menu-select-trigger"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => {
          if (!disabled) setOpen((currentOpen) => !currentOpen);
        }}
      >
        <span>{current?.label ?? value}</span>
      </button>
      {open
        ? renderOverlay(
            <ul
              ref={menuRef}
              className="menu-select-menu"
              id={listId}
              role="listbox"
              style={overlayStyle ?? undefined}
            >
          {groups.map((group, index) => (
            <li key={group.label ?? `group-${index}`}>
              {group.label ? (
                <div className="menu-select-group">{group.label}</div>
              ) : null}
              <ul>
                {group.items.map((item) => {
                  const selected = item.value === value;
                  return (
                    <li key={item.value} role="option" aria-selected={selected}>
                      <button
                        type="button"
                        className={
                          selected
                            ? "menu-select-option is-selected"
                            : "menu-select-option"
                        }
                        onPointerDown={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          choose(item.value);
                        }}
                      >
                        {item.label}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
            </ul>,
            overlayStyle,
          )
        : null}
    </div>
  );
}
