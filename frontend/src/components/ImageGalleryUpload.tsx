import { useRef, useState } from "react";
import { Image as ImageIcon, Plus, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface ImageGalleryUploadProps {
  label: string;
  values: string[];
  onChange: (urls: string[]) => void;
  category: "profile" | "produits" | "courses";
  max: number;
}

export function ImageGalleryUpload({ label, values, onChange, category, max }: ImageGalleryUploadProps) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await api.upload.image(file, category);
      onChange([...values, url]);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const remove = (index: number) => onChange(values.filter((_, i) => i !== index));

  return (
    <div className="space-y-2">
      <Label>{label} <span className="text-xs font-normal text-muted-foreground">({values.length}/{max})</span></Label>
      <div className="flex flex-wrap gap-3">
        {values.map((url, i) => (
          <div key={i} className="relative h-16 w-16 rounded-xl bg-muted border border-border overflow-hidden shrink-0">
            <img src={url} alt={`${label} ${i + 1}`} className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => remove(i)}
              className="absolute top-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
              title="Retirer"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </div>
        ))}
        {values.length < max && (
          <>
            <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
            <button
              type="button"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
              className="flex h-16 w-16 flex-col items-center justify-center gap-0.5 rounded-xl border border-dashed border-border text-muted-foreground hover:border-accent hover:text-accent shrink-0"
              title="Ajouter une photo"
            >
              {uploading ? <ImageIcon className="h-4 w-4 animate-pulse" /> : <Plus className="h-4 w-4" />}
              <span className="text-[9px]">{uploading ? "..." : "Ajouter"}</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
