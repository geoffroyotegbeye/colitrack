import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

interface CategoryComboboxProps {
  categories: string[];
  value: string;
  onChange: (value: string) => void;
  allValue: string;
  allLabel?: string;
  className?: string;
}

export function CategoryCombobox({ categories, value, onChange, allValue, allLabel = "Toutes catégories", className }: CategoryComboboxProps) {
  const [open, setOpen] = useState(false);
  const label = value === allValue ? allLabel : value;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("h-10 justify-between text-xs font-normal", className)}
        >
          <span className="truncate">{label}</span>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="start">
        <Command>
          <CommandInput placeholder="Rechercher une catégorie..." className="text-sm" />
          <CommandList>
            <CommandEmpty>Aucune catégorie trouvée.</CommandEmpty>
            <CommandGroup>
              <CommandItem value={allLabel} onSelect={() => { onChange(allValue); setOpen(false); }}>
                <Check className={cn("mr-2 h-4 w-4", value === allValue ? "opacity-100" : "opacity-0")} />
                {allLabel}
              </CommandItem>
              {categories.map((c) => (
                <CommandItem key={c} value={c} onSelect={() => { onChange(c); setOpen(false); }}>
                  <Check className={cn("mr-2 h-4 w-4", value === c ? "opacity-100" : "opacity-0")} />
                  {c}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
