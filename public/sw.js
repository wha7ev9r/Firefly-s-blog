const CACHE_NAME = "firefly-blog-v1";
const STATIC_ASSETS = [
	"/",
	"/favicon/favicon.ico",
	"/favicon/favicon-light-192.png",
	"/manifest.webmanifest",
];

self.addEventListener("install", (event) => {
	event.waitUntil(
		caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)),
	);
	self.skipWaiting();
});

self.addEventListener("activate", (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((cacheNames) =>
				Promise.all(
					cacheNames
						.filter((name) => name !== CACHE_NAME)
						.map((name) => caches.delete(name)),
				),
			),
	);
	self.clients.claim();
});

self.addEventListener("fetch", (event) => {
	const { request } = event;

	if (request.method !== "GET") return;

	const url = new URL(request.url);

	if (url.origin !== self.location.origin) return;

	if (url.pathname.startsWith("/_astro/")) {
		event.respondWith(
			caches.open(CACHE_NAME).then(async (cache) => {
				const cached = await cache.match(request);
				if (cached) return cached;
				const response = await fetch(request);
				if (response.ok) cache.put(request, response.clone());
				return response;
			}),
		);
		return;
	}

	if (request.mode === "navigate") {
		event.respondWith(
			fetch(request)
				.then((response) => {
					const responseClone = response.clone();
					caches
						.open(CACHE_NAME)
						.then((cache) => cache.put(request, responseClone));
					return response;
				})
				.catch(() =>
					caches.match(request).then((cached) => cached || caches.match("/")),
				),
		);
		return;
	}

	event.respondWith(
		caches.match(request).then((cached) => {
			if (cached) {
				fetch(request)
					.then((response) => {
						if (response.ok) {
							caches
								.open(CACHE_NAME)
								.then((cache) => cache.put(request, response.clone()));
						}
					})
					.catch(() => {});
				return cached;
			}
			return fetch(request).then((response) => {
				if (response.ok && request.destination !== "document") {
					const responseClone = response.clone();
					caches
						.open(CACHE_NAME)
						.then((cache) => cache.put(request, responseClone));
				}
				return response;
			});
		}),
	);
});
