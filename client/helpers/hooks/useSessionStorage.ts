import React from "react";

type SetValue<T> = T | ((value: T) => T);
export default function useSessionStorage<T>(
  key: string,
  initialValue: T
): [T, (value: SetValue<T>) => void] {
  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = React.useState(() => {
    const item = window.sessionStorage.getItem(key);
    try {
      // Get from session storage by key
      // Parse stored json or if none return initialValue
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return item;
    }
  });

  // Return a wrapped version of useState's setter function that ...
  // ... persists the new value to sessionStorage.
  const setValue = (value: SetValue<T>) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      // Save state
      setStoredValue(valueToStore);
      // Save to session storage
      window.sessionStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      // A more advanced implementation would handle the error case
      console.error(error);
    }
  };

  return [storedValue, setValue];
}
