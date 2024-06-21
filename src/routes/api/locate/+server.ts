import { json, type RequestHandler } from '@sveltejs/kit';
import { locations } from './locations';
import type { ClosestSchool, LatLng } from '$lib/types/location';

const { atan2, cos, sin, sqrt, PI } = Math;

const distanceBetween = (a: LatLng, b: LatLng) => {
	const R = 6371e3; // meters
	const φ1 = a.lat * PI / 180; // φ, λ in radians
	const φ2 = b.lat * PI / 180;
	const Δφ = (b.lat - a.lat) * PI / 180;
	const Δλ = (b.lng - a.lng) * PI / 180;

	const x = sin(Δφ / 2) * sin(Δφ / 2) +
		cos(φ1) * cos(φ2) *
		sin(Δλ / 2) * sin(Δλ / 2);
	const y = 2 * atan2(sqrt(x), sqrt(1 - x));

	return R * y; // meters
};

export const GET: RequestHandler = async ({ request: { url } }) => {
	const params = new URL(url).searchParams;
	if (!params) return new Response(null, { status: 400, statusText: 'Bad Request' });
	if (!params.has('lat') || !params.has('lng')) return new Response(null, { status: 400, statusText: 'Bad Request' });
	const lat = Number(params.get('lat'));
	const lng = Number(params.get('lng'));

	let closest: ClosestSchool | null = null;
	locations.forEach((location) => {
		const distance = distanceBetween({ lat, lng }, { lat: location.lat, lng: location.lng });
		if (!closest || distance < closest.distance) closest = { distance, name: location.name, id: location.id };
	});

	if (!closest) return new Response(null, { status: 404, statusText: 'Not Found' });
	return json(closest);
};