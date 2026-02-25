import { createContext, useContext, useState, ReactNode } from "react";

type Role = "FORMULADOR" | "CONSULTOR";

interface RoleContextType {
  role: Role;
  setRole: (role: Role) => void;
  isConsultor: boolean;
}

const RoleContext = createContext<RoleContextType>({
  role: "FORMULADOR",
  setRole: () => {},
  isConsultor: false,
});

export const useRole = () => useContext(RoleContext);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>(
    () => (localStorage.getItem("app_role") as Role) || "FORMULADOR"
  );

  const handleSetRole = (newRole: Role) => {
    setRole(newRole);
    localStorage.setItem("app_role", newRole);
  };

  return (
    <RoleContext.Provider value={{ role, setRole: handleSetRole, isConsultor: role === "CONSULTOR" }}>
      {children}
    </RoleContext.Provider>
  );
}
