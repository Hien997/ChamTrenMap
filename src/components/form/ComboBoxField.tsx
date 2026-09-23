"use client";

import { cn } from "cn";
import { useMemo, useState, type KeyboardEvent } from "react";
import { useFormContext } from "react-hook-form";
import { CommonField } from "./CommonField";
import { peekErrors } from "./utils";

export function ComboBoxField({
  name,
  label,
  options,
  required,
  hint,
  serverError,
  className,
  placeholder = "Tìm kiếm...",
}: {
  name: string;
  label: string;
  options: { id: string; slug: string; name: string }[];
  required?: boolean;
  hint?: string;
  serverError?: string;
  className?: string;
  placeholder?: string;
}) {
  const form = useFormContext();
  const { setValue, watch } = form;
  const [query, setQuery] = useState("");
  const selectedId = watch(name, "");
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const error = serverError ?? peekErrors(form, name);
  const selectedOption = options.find((o) => o.id === selectedId);

  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    const q = query.trim().toLowerCase();
    return options.filter(
      (opt) =>
        opt.name.toLowerCase().includes(q) ||
        opt.slug.toLowerCase().includes(q),
    );
  }, [options, query]);

  const activeIndex = filtered.length > 0 ? highlighted % filtered.length : -1;

  const handleSelect = (option: (typeof options)[0]) => {
    setValue(name, option.id, { shouldValidate: true, shouldDirty: true });
    setQuery("");
    setOpen(false);
    setHighlighted(0);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        setHighlighted(0);
        return;
      }
      if (filtered.length === 0) return;
      setHighlighted((h) =>
        e.key === "ArrowDown"
          ? (h + 1) % filtered.length
          : (h - 1 + filtered.length) % filtered.length,
      );
    } else if (e.key === "Enter") {
      if (open) {
        e.preventDefault();
        const option = filtered[activeIndex];
        if (option) handleSelect(option);
      }
    } else if (e.key === "Escape" && open) {
      e.preventDefault();
      setOpen(false);
    }
  };

  return (
    <CommonField
      label={label}
      name={name}
      required={required}
      hint={hint}
      serverError={error}
      className={className}
    >
      <div className="relative">
        <input
          type="text"
          id={name}
          role="combobox"
          value={selectedOption ? selectedOption.name : query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setHighlighted(0);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={handleKeyDown}
          placeholder={selectedOption ? "" : placeholder}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${name}-error` : undefined}
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-autocomplete="list"
          aria-controls={`${name}-listbox`}
          aria-activedescendant={
            open && activeIndex >= 0
              ? `${name}-option-${activeIndex}`
              : undefined
          }
          className={cn(
            "h-8 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-sm outline-none transition-[color,box-shadow] placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
            error && "border-destructive ring-3 ring-destructive/20",
            className,
          )}
        />
        {open && filtered.length > 0 && (
          <ul
            id={`${name}-listbox`}
            role="listbox"
            className="absolute z-50 mt-1 max-h-52 overflow-auto rounded-md border bg-popover py-1 shadow-md"
            onMouseDown={(e) => e.preventDefault()}
          >
            {filtered.map((option, index) => (
              <li
                key={option.id}
                id={`${name}-option-${index}`}
                role="option"
                aria-selected={option.id === selectedId}
                onClick={() => handleSelect(option)}
                onMouseEnter={() => setHighlighted(index)}
                className={cn(
                  "px-3 py-1.5 text-sm cursor-pointer transition-colors",
                  activeIndex === index
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent/50",
                  option.id === selectedId && "font-semibold",
                )}
              >
                {option.name}
                <span className="ml-2 text-muted-foreground text-xs">
                  /{option.slug}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </CommonField>
  );
}
