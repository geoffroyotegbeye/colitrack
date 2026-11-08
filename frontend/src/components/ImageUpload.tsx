import { useRef, useState } from "react";
import { Image as ImageIcon, Upload } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface ImageUploadProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  category: "profile" | "produits" | "courses";
}

export function ImageUpload({ label, value, onChange, category }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await api.upload.image(file, category);
      onChange(url);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-3">
        <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-muted border border-border overflow-hidden shrink-0">
          {value ? <img src={value} alt={label} className="h-full w-full object-cover" /> : <ImageIcon className="h-5 w-5 text-muted-foreground/40" />}
        </div>
        <div className="space-y-1">
          <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
          <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => inputRef.current?.click()} className="gap-2">
            <Upload className="h-3.5 w-3.5" />{uploading ? "Envoi..." : value ? "Changer" : "Choisir une image"}
          </Button>
          {value && (
            <button type="button" onClick={() => onChange("")} className="block text-xs text-muted-foreground hover:text-destructive">
              Retirer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
