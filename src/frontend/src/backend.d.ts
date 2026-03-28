import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface UserSettings {
    selectedAsset: string;
    timeframe: string;
    indicatorSettings: string;
}
export interface backendInterface {
    getMySettings(): Promise<UserSettings>;
    saveUserSettings(asset: string, timeframe: string, indicators: string): Promise<void>;
}
