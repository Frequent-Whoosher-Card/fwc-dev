import { useState, useEffect } from "react";
import axios from "@/lib/axios";
import { toast } from "sonner";

export interface Member {
  id: string;
  name: string;
  identityNumber: string;
  email?: string;
  phone?: string;
  nippKai?: string;
  gender?: string;
  alamat?: string;
  nationality?: string;
  companyName?: string;
  notes?: string;
}

export function useMemberSearch() {
  const [query, setQuery] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  useEffect(() => {
    // Debounce search
    if (query.length < 3) {
      setMembers([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const response = await axios.get("/members", {
          params: {
            search: query,
            limit: 10,
          },
        });

        const data = response.data.data;
        setMembers(data?.items || []);
      } catch (error) {
        console.error("Failed to search members:", error);
        toast.error("Gagal mencari member");
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const reset = () => {
    setQuery("");
    setMembers([]);
    setSelectedMember(null);
  };

  return {
    query,
    setQuery,
    members,
    loading,
    selectedMember,
    setSelectedMember,
    reset,
  };
}
