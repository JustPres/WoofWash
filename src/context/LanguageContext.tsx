import { createContext } from "react";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const LanguageContext = createContext({
  lang: "en",
  setLang: (lang: string) => {},
});
