import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

function ips(req: Request) {
	return req.headers.get('x-forwarded-for')?.split(/\s*,\s*/);
}

serve(async (req) => {
	// This is needed if you're planning to invoke your function from a browser.
	if (req.method === 'OPTIONS') {
		return new Response('ok', {
			headers: {
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey',
			},
		});
	}

	try {
		const { sentIp } = await req.json();
		const clientIps = ips(req) || [''];
		const ip = clientIps[0];
		const access_key = '50680fa3cb40ef5b7558d2db0ef5938d';
		let url = '';
		if (sentIp === '') {
			url = `http://api.ipstack.com/${ip}?access_key=${access_key}`;
		} else {
			url = `http://api.ipstack.com/${sentIp}?access_key=${access_key}`;
		}
		const response = await fetch(url);
		const data = await response.json();
		return new Response(JSON.stringify({ ...data }), {
			headers: {
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey',
				'Content-Type': 'application/json',
			},
			status: 200,
		});
	} catch (error) {
		return new Response(JSON.stringify({ error: error.message }), {
			headers: {
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey',
				'Content-Type': 'application/json',
			},
			status: 400,
		});
	}
});
