"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFormContext } from "react-hook-form";
import { CommonField } from "./CommonField";
import { peekErrors } from "./utils";

export function SelectField({
  name,
  label,
  options,
  required,
  hint,
  serverError,
  className,
}: {
  name: string;
  label: string;
  options: { value: string; label: string }[];
  required?: boolean;
  hint?: string;
  serverError?: string;
  className?: string;
}) {
  const form = useFormContext();
  const { setValue, watch } = form;
  const error = serverError ?? peekErrors(form, name);
  const value = watch(name);
  const items = Object.fromEntries(options.map((o) => [o.value, o.label]));

  return (
    <CommonField
      label={label}
      name={name}
      required={required}
      hint={hint}
      serverError={error}
      className={className}
    >
      <Select
        items={items}
        value={typeof value === "string" && value !== "" ? value : null}
        onValueChange={(next) => {
          setValue(name, typeof next === "string" ? next : "", {
            shouldValidate: true,
            shouldDirty: true,
          });
        }}
      >
        <SelectTrigger
          aria-invalid={!!error}
          aria-describedby={error ? `${name}-error` : undefined}
        >
          <SelectValue placeholder="Chọn..." />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </CommonField>
  );
}
