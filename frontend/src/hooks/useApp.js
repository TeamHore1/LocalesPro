import { useContext } from "react";
import AppStoreContext from "../store/app-store-context";

export const useApp = () => useContext(AppStoreContext);
