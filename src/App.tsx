import { supabase } from './supabaseClient';
import { IpInfo } from './data';
import { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { AnimatePresence, motion } from 'framer-motion';

const App = () => {
	const [ipData, setIpData] = useState<IpInfo | null>(null);
	const [ip, setIp] = useState<string>('');
	const [notFound, setNotFound] = useState(false);
	const [markers, setMarkers] = useState<mapboxgl.Marker[] | null>(null);

	const mapContainer = useRef<HTMLDivElement | null>(null);
	const map = useRef<mapboxgl.Map | null>(null);
	const [mapLoaded, setMapLoaded] = useState(false);
	const [loading, setLoading] = useState(false);

	mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_PUBLIC;

	const getData = async () => {
		const { data, error } = await supabase.functions.invoke('iptracker', { body: JSON.stringify({ sentIp: '' }) });
		if (error) {
			console.log(error);
			return;
		}
		const f = fetch(
			`https://api.mapbox.com/v4/examples.4ze9z6tv/tilequery/${data.longitude},${data.latitude}.json?access_token=${
				import.meta.env.VITE_MAPBOX_PUBLIC
			}`
		);
		const res = await f;
		const json = await res.json();

		setIpData({ ...data, timezone: json.features[0].properties.TZID });
	};

	useEffect(() => {
		getData();
	}, []);

	useEffect(() => {
		if (ipData === null) return;
		if (map.current) return;

		map.current = new mapboxgl.Map({
			container: (mapContainer.current && mapContainer.current) || '',
			style: 'mapbox://styles/mapbox/streets-v12',
			center: [0, 0],
			zoom: 2,
			pitch: 30,
		});

		map.current.on('load', () => {
			if (!map.current) return;
			setMapLoaded(true);

			setTimeout(() => {
				map.current?.flyTo({
					center: [ipData.longitude, ipData.latitude],
					zoom: 10,
					speed: 1,
					curve: 1,
				});
			}, 1000);

			const marker1 = new mapboxgl.Marker({
				color: '#000',
			})
				.setLngLat([ipData.longitude, ipData.latitude])
				.addTo(map.current);
			setMarkers((prev) => [...(prev || []), marker1]);
			map.current.addControl(
				new mapboxgl.NavigationControl({
					visualizePitch: true,
					showCompass: true,
					showZoom: true,
				})
			);
			map.current.addControl(
				new mapboxgl.GeolocateControl({
					positionOptions: {
						enableHighAccuracy: true,
					},
					trackUserLocation: true,
					showUserLocation: true,
				})
			);
		});

		map.current.on('style.load', () => {
			// Insert the layer beneath any symbol layer.

			const layers = map.current.getStyle().layers;

			const labelLayerId = layers.find((layer) => layer.type === 'symbol' && layer.layout['text-field']).id;

			// The 'building' layer in the Mapbox Streets
			// vector tileset contains building height data
			// from OpenStreetMap.
			map.current.addLayer(
				{
					id: 'add-3d-buildings',
					source: 'composite',
					'source-layer': 'building',
					filter: ['==', 'extrude', 'true'],
					type: 'fill-extrusion',
					minzoom: 15,
					paint: {
						'fill-extrusion-color': '#aaa',
						// Use an 'interpolate' expression to
						// add a smooth transition effect to
						// the buildings as the user zooms in.
						'fill-extrusion-height': ['interpolate', ['linear'], ['zoom'], 15, 0, 15.05, ['get', 'height']],
						'fill-extrusion-base': ['interpolate', ['linear'], ['zoom'], 15, 0, 15.05, ['get', 'min_height']],
						'fill-extrusion-opacity': 0.6,
					},
				},
				labelLayerId
			);
		});
	}, [ipData]);

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setLoading(true);

		const { data, error } = await supabase.functions.invoke('iptracker', { body: JSON.stringify({ sentIp: ip }) });
		if (error) {
			console.log(error);
			return;
		}
		if (error || data) setLoading(false);

		console.log(data);
		if (markers) {
			markers.forEach((marker) => marker.remove());
		}

		if (data.detail === 'Not Found') {
			setNotFound(true);
			map.current?.flyTo({
				center: [0, 0],
				zoom: 2,
				speed: 1,
				curve: 1,
			});
			setMarkers(null);

			return;
		}
		setNotFound(false);

		const f = fetch(
			`https://api.mapbox.com/v4/examples.4ze9z6tv/tilequery/${data.longitude},${data.latitude}.json?access_token=${
				import.meta.env.VITE_MAPBOX_PUBLIC
			}`
		);
		const res = await f;
		const json = await res.json();

		setIpData({ ...data, timezone: json.features[0].properties.TZID });

		map.current?.flyTo({
			center: [data.longitude, data.latitude],
			zoom: 10,
			speed: 1,
			curve: 1,
		});

		const marker1 = new mapboxgl.Marker({
			color: '#000',
		})
			.setLngLat([data.longitude, data.latitude])
			.addTo(map.current!);
		setMarkers((prev) => [...(prev || []), marker1]);
	};

	return (
		<div className="w-screen h-screen overflow-hidden font-rubik select-none relative">
			<AnimatePresence>
				{loading && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed z-50 bg-white/40 w-screen h-screen backdrop-blur-xl fc font-medium text-2xl"
					>
						Loading...
					</motion.div>
				)}
			</AnimatePresence>
			<div className="w-full fc sm:justify-center justify-start h-1/3 relative z-20 px-10">
				<div className="w-full h-full absolute -z-10 hidden bg-no-repeat bg-cover sm:block bg-[url(/pattern-bg-desktop.png)]" />
				<div className="w-full h-full absolute -z-10 block bg-no-repeat bg-cover sm:hidden bg-[url(/pattern-bg-mobile.png)]" />
				<div className="fr sm:fc gap-2 mb-4 pt-6">
					<h1 className="text-2xl sm:text-4xl font-medium text-center text-white">IP Address Tracker</h1>
					<a href="https://lemirq.github.io/" className="text-center text-white underline underline-offset-2">
						by Vihaan
					</a>
				</div>
				<form onSubmit={handleSubmit} className="max-w-xl w-full fr">
					<input
						type="text"
						placeholder="Search for any IP address or domain"
						className="w-10/12 h-12 px-5 rounded-l-lg outline-none"
						value={ip}
						onChange={(e) => setIp(e.target.value)}
					/>
					<button className="w-2/12 h-12 bg-black rounded-r-lg fc" type="submit">
						<svg xmlns="http://www.w3.org/2000/svg" width="11" height="14">
							<path fill="none" stroke="#FFF" strokeWidth="3" d="M2 1l6 6-6 6" />
						</svg>
					</button>
				</form>
				<div className="text-xs text-center text-white mb-20 mt-4">Leave the input field empty to get your own IP address</div>
				<AnimatePresence>
					{ipData && (
						<motion.div
							initial={{ opacity: 0, y: 100 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: 100 }}
							className="absolute top-[70%] sm:top-3/4 p-3 pt-5 md:w-auto w-[calc(100%-40px)] mx-5 rounded-2xl bg-white shadow-xl fc gap-4"
						>
							{notFound ? (
								<div className="w-full h-full text-xl font-medium">Not Found</div>
							) : (
								<div className="fc md:fr gap-1 md:gap-5 lg:gap-10 md:items-stretch">
									<div className="fc gap-1 px-2 md:items-start">
										<p className="text-sm text-gray-400 uppercase tracking-wide">IP Address</p>
										<h3 className="text-lg md:text-2xl font-medium">{ipData?.ip}</h3>
									</div>
									<div className="w-0.5 bg-gray-300 rounded-full" />
									<div className="fc gap-1 px-2 md:items-start">
										<p className="text-sm text-gray-400 uppercase tracking-wide">Location</p>
										<h3 className="text-lg md:text-2xl font-medium">{`${ipData?.city}, ${ipData?.country_name}`}</h3>
									</div>
									<div className="w-0.5 bg-gray-300 rounded-full" />
									<div className="fc gap-1 px-2 md:items-start">
										<p className="text-sm text-gray-400 uppercase tracking-wide">Timezone</p>
										<h3 className="text-lg md:text-2xl font-medium">{ipData?.timezone}</h3>
									</div>
									<div className="w-0.5 bg-gray-300 rounded-full" />
									<div className="fc gap-1 px-2 md:items-start">
										<p className="text-sm text-gray-400 uppercase tracking-wide">Type</p>
										<h3 className="text-lg md:text-2xl font-medium">{ipData?.type}</h3>
									</div>
								</div>
							)}
						</motion.div>
					)}
				</AnimatePresence>
			</div>
			<AnimatePresence>
				{!mapLoaded && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.2 }}
						className="w-screen h-2/3 absolute fc text-2xl font-bold z-10 bg-white"
					>
						Loading...
					</motion.div>
				)}
			</AnimatePresence>
			<div ref={mapContainer} className="w-screen h-2/3" />
		</div>
	);
};

export default App;
