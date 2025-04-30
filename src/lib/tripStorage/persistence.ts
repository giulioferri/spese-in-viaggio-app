// Get/set current trip - keep in localStorage for UX
const CURRENT_TRIP_KEY = 'spese_trasferta_current_trip';

export const setCurrentTrip = (location: string, date: string): void => {
  localStorage.setItem(
    CURRENT_TRIP_KEY,
    JSON.stringify({ location, date })
  );
};

export const getCurrentTrip = (): { location: string; date: string } | null => {
  const currentTripData = localStorage.getItem(CURRENT_TRIP_KEY);
  if (!currentTripData) {
    return null;
  }
  return JSON.parse(currentTripData);
};
