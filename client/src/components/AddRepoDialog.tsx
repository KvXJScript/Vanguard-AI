import { useState } from "react";
import { useCreateRepo } from "@/hooks/use-repos";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Github, Loader2 } from "lucide-react";
import { z } from "zod";

const urlSchema = z.string().url().regex(/^https:\/\/github\.com\/[\w-]+\/[\w-.]+$/, "Must be a valid GitHub repository URL");

export function AddRepoDialog() {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { mutate: createRepo, isPending } = useCreateRepo();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const result = urlSchema.safeParse(url);
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    createRepo({ url }, {
      onSuccess: () => {
        setOpen(false);
        setUrl("");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 shadow-lg shadow-primary/20" data-testid="button-add-repo">
          <Plus className="w-4 h-4" /> Add Repository
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md border-white/10 bg-card/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle>Track Repository</DialogTitle>
          <DialogDescription>
            Enter the public GitHub URL to start monitoring codebase health.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="url">Repository URL</Label>
            <div className="relative">
              <Github className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="url"
                placeholder="https://github.com/owner/repo"
                className="pl-9 bg-background/50 border-white/10 focus:border-primary/50"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={isPending}
                data-testid="input-repo-url"
              />
            </div>
            {error && <p className="text-xs text-destructive mt-1">{error}</p>}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={isPending} data-testid="button-cancel-add">
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} data-testid="button-submit-repo">
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Adding...
                </>
              ) : (
                "Add Repository"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
