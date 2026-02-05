import { RotateCcw } from "lucide-react";
import { StationItem } from "@/lib/services/station.service";
import { RoleItem } from "@/lib/services/user.service";

interface UserFilterProps {
  station: string;
  setStation: (value: string) => void;
  role: string;
  setRole: (value: string) => void;
  stations: StationItem[];
  roles: RoleItem[];
  loadingStation: boolean;
  loadingRole: boolean;
  onReset: () => void;
  search: string;
}

export default function UserFilter({
  station,
  setStation,
  role,
  setRole,
  stations,
  roles,
  loadingStation,
  loadingRole,
  onReset,
  search,
}: UserFilterProps) {
  return (
    <div
      className="
        flex flex-col gap-3
        md:flex-row md:items-center
        rounded-xl border bg-white px-6 py-4 shadow-sm
      "
    >
      <span className="text-sm font-semibold text-[#8D1231]">Filters:</span>

      {/* STATION (UUID) */}
      <select
        value={station}
        onChange={(e) => setStation(e.target.value)}
        disabled={loadingStation}
        className="h-10 w-full md:w-auto min-w-[160px] cursor-pointer rounded-lg border border-[#8D1231] bg-[#8D1231] text-white px-4 text-sm outline-none transition-colors"
      >
        <option
          value="all"
          disabled={loadingStation}
          className="bg-[#8D1231] text-white"
        >
          {loadingStation ? "Loading stasiun..." : "Stasiun"}
        </option>

        {stations.map((s) => (
          <option key={s.id} value={s.id} className="bg-[#8D1231] text-white">
            {s.stationName}
          </option>
        ))}
      </select>

      {/* ROLE (UUID) */}
      <select
        value={role}
        onChange={(e) => setRole(e.target.value)}
        disabled={loadingRole}
        className="h-10 w-full md:w-auto min-w-[160px] cursor-pointer rounded-lg border border-[#8D1231] bg-[#8D1231] text-white px-4 text-sm outline-none transition-colors"
      >
        <option
          value="all"
          disabled={loadingRole}
          className="bg-[#8D1231] text-white"
        >
          {loadingRole ? "Loading role..." : "Role"}
        </option>

        {roles.map((r) => (
          <option key={r.id} value={r.id} className="bg-[#8D1231] text-white">
            {r.roleName}
          </option>
        ))}
      </select>

      <button
        onClick={onReset}
        className={`flex h-10 w-full md:w-10 items-center justify-center rounded-lg border transition-colors ${
          search || role !== "all" || station !== "all"
            ? "border-[#8D1231] bg-[#8D1231] text-white hover:bg-[#73122E]"
            : "border-gray-300 bg-white text-gray-500 hover:bg-gray-50"
        }`}
      >
        <RotateCcw size={16} />
      </button>
    </div>
  );
}
