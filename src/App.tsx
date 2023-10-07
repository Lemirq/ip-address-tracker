import { supabase } from './supabaseClient';
import { IpInfo } from './data';
import { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { AnimatePresence, motion } from 'framer-motion';

const App = () => {
	const [ipData, setIpData] = useState<IpInfo | null>(null);
	const [ip, setIp] = useState<string>('');

	const mapContainer = useRef<HTMLDivElement | null>(null);
	const map = useRef<mapboxgl.Map | null>(null);

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
			center: [ipData.longitude, ipData.latitude],
			zoom: 10,
			pitch: 30,
		});
		new mapboxgl.Marker({
			color: '#000',
		})
			.setLngLat([ipData.longitude, ipData.latitude])
			.addTo(map.current);

		map.current.addControl(
			new mapboxgl.NavigationControl({
				visualizePitch: true,
				showCompass: true,
				showZoom: true,
			})
		);
		map.current.addControl(new mapboxgl.GeolocateControl());
	}, [ipData]);

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const { data, error } = await supabase.functions.invoke('iptracker', { body: JSON.stringify({ sentIp: ip }) });
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
		console.log({ ...data, timezone: json.features[0].properties.TZID });
		map.current?.flyTo({
			center: [data.longitude, data.latitude],
			zoom: 10,
			speed: 1,
			curve: 1,
		});
		new mapboxgl.Marker({
			color: '#000',
		})
			.setLngLat([data.longitude, data.latitude])
			.addTo(map.current!);
	};

	return (
		<div className="w-screen h-screen overflow-hidden font-rubik select-none">
			<div className="w-full fc h-1/3 relative z-10 px-10">
				<img src="/images/pattern-bg-desktop.png" className="w-full h-full object-cover absolute -z-10 hidden sm:block" />
				<img src="/images/pattern-bg-mobile.png" className="w-full h-full object-cover absolute -z-10 block sm:hidden" />
				<div className="fc gap-2 mb-4">
					<h1 className="text-4xl font-medium text-center text-white pt-10">IP Address Tracker</h1>
					<a href="https://lemirq.github.io/" className="text-center text-white underline underline-offset-2">
						Made by Vihaan
					</a>
				</div>
				<form onSubmit={handleSubmit} className="max-w-xl w-full fr mb-20">
					<input
						type="text"
						placeholder="Search for any IP address or domain"
						className="w-10/12 h-12 px-5 rounded-l-lg outline-none"
						value={ip}
						onChange={(e) => setIp(e.target.value)}
					/>
					<button className="w-2/12 h-12 bg-black rounded-r-lg fc" type="submit">
						<img src="/images/icon-arrow.svg" alt="" />
					</button>
				</form>
				<AnimatePresence>
					{ipData && (
						<motion.div
							initial={{ opacity: 0, y: 100 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: 100 }}
							className="absolute top-3/4 p-5 md:w-auto w-[calc(100%-40px)] mx-5 rounded-2xl bg-white shadow-xl fc md:fr gap-2 md:gap-5 lg:gap-10 md:items-stretch"
						>
							<div className="fc gap-2 px-2 md:items-start">
								<p className="text-sm text-gray-400 uppercase tracking-wide">IP Address</p>
								<h3 className="text-xl md:text-2xl font-medium">{ipData?.ip}</h3>
							</div>
							<div className="w-0.5 bg-gray-300 rounded-full" />
							<div className="fc gap-2 px-2 md:items-start">
								<p className="text-sm text-gray-400 uppercase tracking-wide">Location</p>
								<h3 className="text-xl md:text-2xl font-medium">{`${ipData?.city}, ${ipData?.country_name}`}</h3>
							</div>
							<div className="w-0.5 bg-gray-300 rounded-full" />
							<div className="fc gap-2 px-2 md:items-start">
								<p className="text-sm text-gray-400 uppercase tracking-wide">Timezone</p>
								<h3 className="text-xl md:text-2xl font-medium">{ipData?.timezone}</h3>
							</div>
							<div className="w-0.5 bg-gray-300 rounded-full" />
							<div className="fc gap-2 px-2 md:items-start">
								<p className="text-sm text-gray-400 uppercase tracking-wide">Type</p>
								<h3 className="text-xl md:text-2xl font-medium">{ipData?.type}</h3>
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			</div>
			<div ref={mapContainer} className="w-screen h-2/3" />
		</div>
	);
};

export default App;
