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

  return data.routes[0];
}