import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type Repository, type Scan, type FileAnalysis, type CreateRepoRequest } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

// === REPOSITORIES ===

export function useRepos() {
  return useQuery({
    queryKey: [api.repos.list.path],
    queryFn: async () => {
      const res = await fetch(api.repos.list.path, { credentials: "include" });
      if (res.status === 401) throw new Error("Unauthorized");
      if (!res.ok) throw new Error("Failed to fetch repositories");
      return api.repos.list.responses[200].parse(await res.json());
    },
  });
}

export function useRepo(id: number) {
  return useQuery({
    queryKey: [api.repos.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.repos.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (res.status === 401) throw new Error("Unauthorized");
      if (!res.ok) throw new Error("Failed to fetch repository");
      return api.repos.get.responses[200].parse(await res.json());
    },
    enabled: !isNaN(id),
  });
}

export function useCreateRepo() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateRepoRequest) => {
      const res = await fetch(api.repos.create.path, {
        method: api.repos.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) {
        if (res.status === 401) throw new Error("Unauthorized");
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || "Failed to create repository");
      }
      return api.repos.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.repos.list.path] });
      toast({ title: "Repository added", description: "Repository has been tracked successfully." });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

export function useDeleteRepo() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.repos.delete.path, { id });
      const res = await fetch(url, { method: api.repos.delete.method, credentials: "include" });
      if (!res.ok) throw new Error("Failed to delete repository");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.repos.list.path] });
      toast({ title: "Deleted", description: "Repository removed successfully." });
    },
  });
}

// === SCANS ===

export function useRepoScans(repoId: number) {
  const result = useQuery({
    queryKey: [api.scans.list.path, repoId],
    queryFn: async () => {
      const url = buildUrl(api.scans.list.path, { id: repoId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch scans");
      return api.scans.list.responses[200].parse(await res.json());
    },
    enabled: !isNaN(repoId),
    refetchInterval: (query) => {
      const scans = query.state.data;
      if (scans?.some((s: any) => s.status === "processing" || s.status === "pending")) {
        return 3000;
      }
      return false;
    },
  });
  return result;
}

export function useScan(id: number) {
  return useQuery({
    queryKey: [api.scans.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.scans.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch scan details");
      return api.scans.get.responses[200].parse(await res.json());
    },
    enabled: !isNaN(id) && id > 0,
    refetchInterval: (query) => {
      const data = query.state.data as any;
      if (data?.scan?.status === "processing" || data?.scan?.status === "pending") {
        return 3000;
      }
      return false;
    },
  });
}

export function useRunScan() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (repoId: number) => {
      const url = buildUrl(api.scans.create.path, { id: repoId });
      const res = await fetch(url, { method: api.scans.create.method, credentials: "include" });
      if (!res.ok) throw new Error("Failed to start scan");
      return api.scans.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, repoId) => {
      queryClient.invalidateQueries({ queryKey: [api.scans.list.path, repoId] });
      queryClient.invalidateQueries({ queryKey: [api.repos.list.path] }); 
      toast({ title: "Scan started", description: "Analysis is running in the background. Results will appear automatically." });
    },
    onError: (error) => {
      toast({ title: "Scan failed", description: error.message, variant: "destructive" });
    },
  });
}

// === STATS ===

export function useStats() {
  return useQuery({
    queryKey: ["/api/stats"],
    queryFn: async () => {
      const res = await fetch("/api/stats", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
  });
}
