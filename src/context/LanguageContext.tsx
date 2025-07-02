import { createContext } from "react";

export const LanguageContext = createContext<{
    lang: string;
    setLang: (lang: string) => void;
}>({
    lang: "en",
    setLang: () => {},
});
