"use client";

import { useFormContext } from "react-hook-form";
import { CommonField } from "./CommonField";
import { peekErrors } from "./utils";

export function ToggleField({
  name,
  label,
  required,
  hint,
  serverError,
  className,
}: {
  name: string;
  label: string;
  required?: boolean;
  hint?: string;
  serverError?: string;
  className?: string;
}) {
  const form = useFormContext();
  const { register } = form;
  const error = serverError ?? peekErrors(form, name);

  return (
    <CommonField
      label={label}
      name={name}
      required={required}
      hint={hint}
      serverError={error}
      className={className}
      hideLabel
    >
      <label htmlFor={name} className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          id={name}
          role="switch"
          {...register(name)}
        />
        {label}
        {required ? (
          <span aria-hidden className="ml-0.5 text-destructive">
            *
          </span>
        ) : null}
      </label>
    </CommonField>
  );
}
