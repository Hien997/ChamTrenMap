"use client";

import { useFormContext } from "react-hook-form";
import { CommonField } from "./CommonField";
import { peekErrors } from "./utils";

export function RadioField({
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
    >
      <div className="flex flex-wrap gap-4">
        {options.map((option) => (
          <label key={option.value} className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              id={`${name}-${option.value}`}
              value={option.value}
              {...register(name)}
            />
            {option.label}
          </label>
        ))}
      </div>
    </CommonField>
  );
}
