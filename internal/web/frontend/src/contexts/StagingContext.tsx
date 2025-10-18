import React, { createContext, useContext, useState, useCallback } from "react";
import type { HPA } from "@/lib/api/types";

interface HPAWithOriginal {
  current: HPA;
  original: HPA;
}

interface StagingContextType {
  modifiedHPAs: Map<string, HPAWithOriginal>;
  count: number;
  add: (hpa: HPA, original: HPA) => void;
  remove: (key: string) => void;
  clear: () => void;
  has: (key: string) => boolean;
  get: (key: string) => HPAWithOriginal | undefined;
  getAll: () => Array<{ key: string; data: HPAWithOriginal }>;
  getChanges: (key: string) => { before: HPA; after: HPA } | null;
}

const StagingContext = createContext<StagingContextType | undefined>(undefined);

export const StagingProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [modifiedHPAs, setModifiedHPAs] = useState<Map<string, HPAWithOriginal>>(
    new Map()
  );

  const getKey = useCallback((hpa: HPA) => {
    return `${hpa.cluster}/${hpa.namespace}/${hpa.name}`;
  }, []);

  const add = useCallback(
    (hpa: HPA, original: HPA) => {
      const key = getKey(hpa);
      setModifiedHPAs((prev) => {
        const newMap = new Map(prev);
        newMap.set(key, { current: hpa, original });
        return newMap;
      });
    },
    [getKey]
  );

  const remove = useCallback((key: string) => {
    setModifiedHPAs((prev) => {
      const newMap = new Map(prev);
      newMap.delete(key);
      return newMap;
    });
  }, []);

  const clear = useCallback(() => {
    setModifiedHPAs(new Map());
  }, []);

  const has = useCallback(
    (key: string) => {
      return modifiedHPAs.has(key);
    },
    [modifiedHPAs]
  );

  const get = useCallback(
    (key: string) => {
      return modifiedHPAs.get(key);
    },
    [modifiedHPAs]
  );

  const getAll = useCallback(() => {
    return Array.from(modifiedHPAs.entries()).map(([key, data]) => ({
      key,
      data,
    }));
  }, [modifiedHPAs]);

  const getChanges = useCallback(
    (key: string) => {
      const item = modifiedHPAs.get(key);
      if (!item) return null;
      return {
        before: item.original,
        after: item.current,
      };
    },
    [modifiedHPAs]
  );

  const value: StagingContextType = {
    modifiedHPAs,
    count: modifiedHPAs.size,
    add,
    remove,
    clear,
    has,
    get,
    getAll,
    getChanges,
  };

  return (
    <StagingContext.Provider value={value}>{children}</StagingContext.Provider>
  );
};

export const useStaging = () => {
  const context = useContext(StagingContext);
  if (!context) {
    throw new Error("useStaging must be used within StagingProvider");
  }
  return context;
};
