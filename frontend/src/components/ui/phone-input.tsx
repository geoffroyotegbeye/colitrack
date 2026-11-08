import * as React from "react";

import { Input } from "@/components/ui/input";

const sanitize = (raw: string) => raw.replace(/[^\d+\s()-]/g, "");

const PhoneInput = React.forwardRef<HTMLInputElement, React.ComponentProps<typeof Input>>(
  ({ onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      e.target.value = sanitize(e.target.value);
      onChange?.(e);
    };

    return <Input type="tel" inputMode="tel" ref={ref} onChange={handleChange} {...props} />;
  },
);
PhoneInput.displayName = "PhoneInput";

export { PhoneInput };
