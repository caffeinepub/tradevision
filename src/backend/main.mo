import Principal "mo:core/Principal";
import Map "mo:core/Map";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";

actor {
  type UserSettings = {
    selectedAsset : Text;
    timeframe : Text;
    indicatorSettings : Text;
  };

  let userSettings = Map.empty<Principal, UserSettings>();

  public shared ({ caller }) func saveUserSettings(asset : Text, timeframe : Text, indicators : Text) : async () {
    let settings : UserSettings = {
      selectedAsset = asset;
      timeframe;
      indicatorSettings = indicators;
    };
    userSettings.add(caller, settings);
  };

  public query ({ caller }) func getMySettings() : async UserSettings {
    switch (userSettings.get(caller)) {
      case (?settings) { settings };
      case (null) { Runtime.trap("No settings found") };
    };
  };
};
