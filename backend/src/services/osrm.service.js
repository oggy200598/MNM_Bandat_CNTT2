function estimateDurationSeconds(
  profile,
  distanceMeters,
  fallbackSeconds
) {
  const distance =
    Number(distanceMeters);

  if (!Number.isFinite(distance)) {
    return fallbackSeconds;
  }

  const metersPerSecond =
    profile === "foot"
      ? 1.39
      : profile === "bike"
      ? 4.17
      : null;

  if (!metersPerSecond) {
    return fallbackSeconds;
  }

  return Math.round(
    distance / metersPerSecond
  );
}

export async function fetchRoute(profile, originLng, originLat, destLng, destLat) {
  const url = `https://router.project-osrm.org/route/v1/${profile}/${originLng},${originLat};${destLng},${destLat}?overview=full&geometries=geojson`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`OSRM API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  if (!data?.routes?.[0]) {
    return null;
  }

  const route =
    data.routes[0];

  return {
    ...route,
    duration:
      estimateDurationSeconds(
        profile,
        route.distance,
        route.duration
      ),
    profile
  };
}
