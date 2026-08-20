// fetch
if (path === '/api/onemsg/messages' && method === 'GET') {
	const fingerprint = url.searchParams.get('fp') || '';
	
	const countRow = await env.DB.prepare(`SELECT COUNT(*) as cnt FROM messages`).first();
	const messages = await env.DB.prepare(`SELECT * FROM messages ORDER BY msg_number DESC LIMIT 100`).all();

	// check if fp or ip has posted
	const userCheck = await env.DB.prepare(
		`SELECT id FROM messages WHERE device_fingerprint = ? OR ip_hash = ?`
	).bind(fingerprint, ipHash).first();

	return new Response(JSON.stringify({
		totalCount: countRow.cnt,
		hasPosted: !!userCheck,
		messages: messages.results || []
	}), { headers: corsHeaders });
}

// 2. Submit New OneMessage
if (path === '/api/onemsg/messages' && method === 'POST') {
	const body = await request.json();
	const { author, content, portrait, fingerprint } = body;

	const cleanAuthor = (author || 'Anonymous').trim();
	const cleanContent = (content || '').trim();
	const cleanPortrait = (portrait || 'niko.png').trim();

	if (!cleanContent) {
		return new Response(JSON.stringify({ error: 'Message cannot be empty!' }), { status: 400, headers: corsHeaders });
	}

	// DEBUG. REMOVE WHEN DEPLOYING
	const isDebugUser = /^Kip\d*$/i.test(cleanAuthor) || cleanAuthor.toLowerCase() === 'coolgamer22';

	if (!isDebugUser) {
		const existingMsg = await env.DB.prepare(
			`SELECT id FROM messages WHERE device_fingerprint = ? OR ip_hash = ? OR LOWER(author) = LOWER(?)`
		).bind(fingerprint, ipHash, cleanAuthor).first();

		if (existingMsg) {
			return new Response(JSON.stringify({ error: 'You have already left your OneMessage on the wall!' }), { status: 403, headers: corsHeaders });
		}
	}

	const countRow = await env.DB.prepare(`SELECT COUNT(*) as cnt FROM messages`).first();
	const msgNumber = (countRow.cnt || 0) + 1;
	const id = 'msg_' + Date.now();

	await env.DB.prepare(
		`INSERT INTO messages (id, msg_number, author, portrait, content, ip_hash, device_fingerprint) VALUES (?, ?, ?, ?, ?, ?, ?)`
	).bind(id, msgNumber, cleanAuthor, cleanPortrait, cleanContent, ipHash, fingerprint).run();

	return new Response(JSON.stringify({ success: true, id, msgNumber }), { headers: corsHeaders });
}

//react
if (path === '/api/onemsg/react' && method === 'POST') {
	const body = await request.json();
	const { msgId, reaction } = body; // reaction = 'light' or 'pancake'

	if (reaction === 'light') {
		await env.DB.prepare(`UPDATE messages SET lights_count = lights_count + 1 WHERE id = ?`).bind(msgId).run();
	} else if (reaction === 'pancake') {
		await env.DB.prepare(`UPDATE messages SET pancakes_count = pancakes_count + 1 WHERE id = ?`).bind(msgId).run();
	}

	return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
}

// adm
if (path === '/api/onemsg/admin/delete' && method === 'POST') {
	const adminKey = request.headers.get('X-Admin-Key');
	if (adminKey !== env.ADMIN_SECRET) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });

	const body = await request.json();
	const { msgId, purgeAll } = body;

	if (purgeAll) {
		await env.DB.prepare(`DELETE FROM messages`).run();
	} else if (msgId) {
		await env.DB.prepare(`DELETE FROM messages WHERE id = ?`).bind(msgId).run();
	}

	return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
}