"use client";

import { Input } from "@/components/ui/input";
import React, { forwardRef } from "react";
import { useFormContext } from "react-hook-form";
import { CommonField } from "./CommonField";
import { mergeRefs, peekErrors } from "./utils";

export const InputField = forwardRef<
  HTMLInputElement,
  {
    name: string;
    label: string;
    type?: string;
    required?: boolean;
    hint?: string;
    placeholder?: string;
    serverError?: string;
    className?: string;
    inputProps?: React.ComponentProps<typeof Input>;
  }
>((props, ref) => {
  const {
    name,
    label,
    type = "text",
    required,
    hint,
    placeholder,
    serverError,
    className,
    inputProps = {},
  } = props;
  const form = useFormContext();
  const { register } = form;
  const error = serverError ?? peekErrors(form, name);
  const { ref: registerRef, ...registerProps } = register(name);
  const { ref: inputRef, ...inputPropsRest } = inputProps;

  return (  
    <CommonField
      label={label}
      name={name}
      required={required}
      hint={hint}
      serverError={error}
      className={className}
    >
      <Input
        ref={mergeRefs(registerRef, ref, inputRef)}
        id={name}
        type={type}
        placeholder={placeholder}
        required={required}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : undefined}
        {...registerProps}
        {...inputPropsRest}
      />
    </CommonField>
  );
});

InputField.displayName = "InputField";
