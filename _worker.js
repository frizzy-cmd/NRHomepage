// // _worker.js - 

// export default {
// 	async fetch(request, env, ctx) {
// 		const url = new URL(request.url);
// 		const path = url.pathname;
// 		const method = request.method;

// 		if (!path.startsWith('/api/')) {
// 			if (env.ASSETS) return env.ASSETS.fetch(request);
// 			return new Response('Asset Not Found', { status: 404 });
// 		}

// 		const clientIP = request.headers.get('cf-connecting-ip') || '127.0.0.1';
// 		const ipHash = await hashIP(clientIP);

// 		const corsHeaders = {
// 			'Access-Control-Allow-Origin': '*',
// 			'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
// 			'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Key',
// 			'Content-Type': 'application/json'
// 		};

// 		if (method === 'OPTIONS') {
// 			return new Response(null, { headers: corsHeaders });
// 		}

// 		try {
//             //fetch all msgs
// 			if (path === '/api/onemsg/messages' && method === 'GET') {
// 				const fingerprint = url.searchParams.get('fp') || '';
				
// 				let countRow = { cnt: 0 };
// 				try {
// 					countRow = await env.DB.prepare(`SELECT COUNT(*) as cnt FROM messages`).first() || { cnt: 0 };
// 				} catch(e) {}

// 				let messages = { results: [] };
// 				try {
// 					messages = await env.DB.prepare(`SELECT * FROM messages ORDER BY msg_number DESC LIMIT 100`).all();
// 				} catch(e) {}

// 				let userCheck = null;
// 				if (fingerprint) {
// 					try {
// 						userCheck = await env.DB.prepare(
// 							`SELECT id FROM messages WHERE device_fingerprint = ? OR ip_hash = ?`
// 						).bind(fingerprint, ipHash).first();
// 					} catch(e) {}
// 				}

// 				return new Response(JSON.stringify({
// 					totalCount: countRow.cnt || 0,
// 					hasPosted: !!userCheck,
// 					messages: messages.results || []
// 				}), { headers: corsHeaders });
// 			}

// 			// submit new msg
// 			if (path === '/api/onemsg/messages' && method === 'POST') {
//                 const body = await request.json();
//                 const { author, content, portrait, fingerprint } = body;

//                 const cleanAuthor = (author || 'Anonymous').trim();
//                 const cleanContent = (content || '').trim();
//                 const cleanPortrait = (portrait || 'niko.png').trim();

//                 if (!cleanContent) {
//                     return new Response(JSON.stringify({ error: 'Message cannot be empty!' }), { status: 400, headers: corsHeaders });
//                 }

//                 let existingMsg = null;
//                 try {
//                     existingMsg = await env.DB.prepare(
//                         `SELECT id FROM messages WHERE device_fingerprint = ? OR ip_hash = ? OR LOWER(author) = LOWER(?)`
//                     ).bind(fingerprint || 'none', ipHash, cleanAuthor).first();
//                 } catch(e) {}

//                 if (existingMsg) {
//                     return new Response(JSON.stringify({ error: 'You have already left your OneMessage on the wall!' }), { status: 403, headers: corsHeaders });
//                 }

//                 let countRow = { cnt: 0 };
//                 try {
//                     countRow = await env.DB.prepare(`SELECT COUNT(*) as cnt FROM messages`).first() || { cnt: 0 };
//                 } catch(e) {}

//                 const msgNumber = (countRow.cnt || 0) + 1;
//                 const id = 'msg_' + Date.now();

//                 await env.DB.prepare(
//                     `INSERT INTO messages (id, msg_number, author, portrait, content, ip_hash, device_fingerprint) VALUES (?, ?, ?, ?, ?, ?, ?)`
//                 ).bind(id, msgNumber, cleanAuthor, cleanPortrait, cleanContent, ipHash, fingerprint || 'none').run();

//                 return new Response(JSON.stringify({ success: true, id, msgNumber }), { headers: corsHeaders });
//             }

// 			// reactAPI
// 			if (path === '/api/onemsg/react' && method === 'POST') {
// 				const body = await request.json();
// 				const { msgId, reaction } = body;

// 				if (reaction === 'light') {
// 					await env.DB.prepare(`UPDATE messages SET lights_count = lights_count + 1 WHERE id = ?`).bind(msgId).run();
// 				} else if (reaction === 'pancake') {
// 					await env.DB.prepare(`UPDATE messages SET pancakes_count = pancakes_count + 1 WHERE id = ?`).bind(msgId).run();
// 				}

// 				return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
// 			}

//             //adm login
//             if (path === '/api/onemsg/admin/login' && method === 'POST') {
//                 const body = await request.json();
//                 const { password } = body;
//                 if (password && env.ADMIN_SECRET && password.trim() === env.ADMIN_SECRET.trim()) {
//                     return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
//                 }
//                 return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
//             }

// 			// adm delete and purge
// 			if (path === '/api/onemsg/admin/delete' && method === 'POST') {
//                 const adminKey = request.headers.get('X-Admin-Key');
//                 if (!adminKey || !env.ADMIN_SECRET || adminKey.trim() !== env.ADMIN_SECRET.trim()) {
//                     return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
//                 }

// 				const body = await request.json();
// 				const { msgId, purgeAll } = body;

// 				if (purgeAll) {
// 					await env.DB.prepare(`DELETE FROM messages`).run();
// 				} else if (msgId) {
// 					await env.DB.prepare(`DELETE FROM messages WHERE id = ?`).bind(msgId).run();
// 				}

// 				return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
// 			}

// 			return new Response(JSON.stringify({ error: 'Endpoint Not Found' }), { status: 404, headers: corsHeaders });

// 		} catch (e) {
// 			return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
// 		}
// 	}
// };

// async function hashIP(ip) {
// 	const msgUint8 = new TextEncoder().encode(ip + '_SALT_KIP_FORUM');
// 	const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
// 	const hashArray = Array.from(new Uint8Array(hashBuffer));
// 	return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
// }

export default {
  async fetch(request) {
    return new Response("paused", { status: 503 });
  }
};
