import { createContext, useContext, useState, type ReactNode } from "react";

interface UserData {
  name: string;
  goal: string | null;
}

interface UserContextType {
  userData: UserData;
  setName: (name: string) => void;
  setGoal: (goal: string) => void;
}

const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [userData, setUserData] = useState<UserData>({
    name: "",
    goal: null,
  });

  const setName = (name: string) => {
    setUserData((prev) => ({ ...prev, name }));
  };

  const setGoal = (goal: string) => {
    setUserData((prev) => ({ ...prev, goal }));
  };

  return (
    <UserContext.Provider value={{ userData, setName, setGoal }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
