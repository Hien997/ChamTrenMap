import React, { forwardRef } from "react";
import type { FieldValues, Path } from "react-hook-form";
import { useFormContext } from "react-hook-form";
import { CommonField } from "./CommonField";
import { Textarea } from "../ui/textarea";
import { mergeRefs, peekErrors } from "./utils";

type TextAreaFieldProps<TFieldValues extends FieldValues> = {
  name: Path<TFieldValues>;
  label: string;
  required?: boolean;
  hint?: string;
  rows?: number;
  serverError?: string;
  className?: string;
  textareaProps?: Omit<React.ComponentProps<typeof Textarea>, "name" | "ref">;
};

export const TextAreaField = forwardRef<
  HTMLTextAreaElement,
  TextAreaFieldProps<FieldValues>
>((props, ref) => {
  const {
    name,
    label,
    required,
    hint,
    rows = 3,
    serverError,
    className,
    textareaProps = {},
  } = props;

  const form = useFormContext<FieldValues>();
  const { register } = form;

  const { ref: registerRef, ...registerProps } = register(name);

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
      <Textarea
        {...textareaProps}
        {...registerProps}
        ref={mergeRefs(registerRef, ref)}
        id={name}
        rows={rows}
        required={required}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : undefined}
      />
    </CommonField>
  );
});

TextAreaField.displayName = "TextAreaField";
