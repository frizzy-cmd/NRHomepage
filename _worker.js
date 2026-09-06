// _worker.js - 

export default {
	async fetch(request, env, ctx) {
		// 1. CORS Headers
		const corsHeaders = {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Key',
			'Content-Type': 'application/json'
		};

		const url = new URL(request.url);
		const path = url.pathname;
		const method = request.method;

		if (method === 'OPTIONS') {
			return new Response(null, { headers: corsHeaders });
		}

		const db = env.DB || env.forum_db;
		const clientIP = request.headers.get('cf-connecting-ip') || '127.0.0.1';
		const ipHash = await hashIP(clientIP);

		let siteStatus = 'online';
		let maintenanceNote = '';

		if (db) {
			try {
				const statusRow = await db.prepare(`SELECT value FROM site_settings WHERE key = 'site_status'`).first();
				const noteRow = await db.prepare(`SELECT value FROM site_settings WHERE key = 'maintenance_note'`).first();
				if (statusRow && statusRow.value) siteStatus = statusRow.value;
				if (noteRow && noteRow.value) maintenanceNote = noteRow.value;
			} catch (e) {
				siteStatus = 'online';
			}
		}

		if (siteStatus === 'offline') {
			const isExempt = path === '/admin-panel.html' || 
			                 path === '/admin-panel' || 
			                 path === '/unavail.html' || 
			                 path === '/unavail' || 
			                 path.startsWith('/api/admin/') || 
			                 path.startsWith('/api/site/') || 
			                 path.startsWith('/static/');
			if (!isExempt) {
				return Response.redirect(`${url.origin}/unavail.html`, 302);
			}
		}

		if (!path.startsWith('/api/')) {
			if (env.ASSETS) return env.ASSETS.fetch(request);
			return new Response('Asset Not Found', { status: 404 });
		}

		// API FOR ADMIN

		if (path === '/api/site/status' && method === 'GET') {
			let statusVal = 'online';
			let noteVal = '';
			let dbError = null;

			if (!db) {
				dbError = 'D1 database binding (DB) is missing in env';
			} else {
				try {
					await db.prepare(`CREATE TABLE IF NOT EXISTS site_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)`).run();
					const statusRow = await db.prepare(`SELECT value FROM site_settings WHERE key = 'site_status'`).first();
					const noteRow = await db.prepare(`SELECT value FROM site_settings WHERE key = 'maintenance_note'`).first();
					if (statusRow && statusRow.value) statusVal = statusRow.value;
					if (noteRow && noteRow.value) noteVal = noteRow.value;
				} catch(e) {
					dbError = e.message;
				}
			}

			return new Response(JSON.stringify({ 
				status: statusVal, 
				note: noteVal,
				dbError: dbError 
			}), { headers: corsHeaders });
		}

		if (path === '/api/site/announcement' && method === 'GET') {
			let text = '';
			let closable = false;
			let expiresAt = 0;
			let dbError = null;

			if (db) {
				try {
					await db.prepare(`CREATE TABLE IF NOT EXISTS site_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)`).run();
					const textRow = await db.prepare(`SELECT value FROM site_settings WHERE key = 'announcement_text'`).first();
					const closeRow = await db.prepare(`SELECT value FROM site_settings WHERE key = 'announcement_closable'`).first();
					const expRow = await db.prepare(`SELECT value FROM site_settings WHERE key = 'announcement_expires'`).first();

					if (textRow && textRow.value) text = textRow.value;
					if (closeRow && closeRow.value) closable = (closeRow.value === 'true');
					if (expRow && expRow.value) expiresAt = parseInt(expRow.value) || 0;
				} catch (e) {
					dbError = e.message;
				}
			}

			if (expiresAt > 0 && Date.now() > expiresAt) {
				text = '';
			}

			return new Response(JSON.stringify({
				active: !!text,
				text: text,
				closable: closable,
				expiresAt: expiresAt,
				dbError: dbError
			}), { headers: corsHeaders });
		}

		if (path === '/api/admin/site-settings' && method === 'POST') {
			const adminKey = request.headers.get('X-Admin-Key');
			if (!adminKey || !env.ADMIN_SECRET || adminKey.trim() !== env.ADMIN_SECRET.trim()) {
				return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
			}

			const body = await request.json();
			const { action, status, note, announcementText, closable, durationMinutes } = body;

			try {
				if (action === 'set_status') {
					await env.DB.prepare(`DELETE FROM site_settings WHERE key = 'site_status'`).run();
					await env.DB.prepare(`INSERT INTO site_settings (key, value) VALUES ('site_status', ?)`).bind(status || 'online').run();

					await env.DB.prepare(`DELETE FROM site_settings WHERE key = 'maintenance_note'`).run();
					await env.DB.prepare(`INSERT INTO site_settings (key, value) VALUES ('maintenance_note', ?)`).bind(note || '').run();
				}
				else if (action === 'set_announcement') {
					let expTimestamp = 0;
					if (durationMinutes && durationMinutes > 0) {
						expTimestamp = Date.now() + durationMinutes * 60 * 1000;
					}

					await env.DB.prepare(`DELETE FROM site_settings WHERE key = 'announcement_text'`).run();
					await env.DB.prepare(`INSERT INTO site_settings (key, value) VALUES ('announcement_text', ?)`).bind(announcementText || '').run();

					await env.DB.prepare(`DELETE FROM site_settings WHERE key = 'announcement_closable'`).run();
					await env.DB.prepare(`INSERT INTO site_settings (key, value) VALUES ('announcement_closable', ?)`).bind(closable ? 'true' : 'false').run();

					await env.DB.prepare(`DELETE FROM site_settings WHERE key = 'announcement_expires'`).run();
					await env.DB.prepare(`INSERT INTO site_settings (key, value) VALUES ('announcement_expires', ?)`).bind(expTimestamp.toString()).run();
				}
				else if (action === 'clear_announcement') {
					await env.DB.prepare(`DELETE FROM site_settings WHERE key LIKE 'announcement_%'`).run();
				}

				return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
			} catch (e) {
				return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
			}
		}

		// ANALYTICS
		// Yers no key!
		if (path === '/api/analytics/track' && method === 'POST') {
			try {
				const body = await request.json();

				await env.DB.prepare(
					`CREATE TABLE IF NOT EXISTS page_views (
						id TEXT PRIMARY KEY,
						path TEXT,
						theme TEXT,
						referrer TEXT,
						viewport TEXT,
						day TEXT,
						time_spent INTEGER DEFAULT 0,
						visit_hash TEXT,
						created_at INTEGER
					)`
				).run();

				await env.DB.prepare(
					`CREATE TABLE IF NOT EXISTS click_events (
						id INTEGER PRIMARY KEY AUTOINCREMENT,
						path TEXT,
						tag TEXT,
						label TEXT,
						day TEXT,
						created_at INTEGER
					)`
				).run();

				const today = new Date().toISOString().slice(0, 10);

				if (body.type === 'view') {
					await env.DB.prepare(
						`INSERT OR IGNORE INTO page_views (id, path, theme, referrer, viewport, day, time_spent, visit_hash, created_at) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)`
					).bind(body.id || ('v_' + Date.now()), body.path || '', body.theme || '', body.referrer || '', body.viewport || '', today, ipHash, Date.now()).run();
				}
				else if (body.type === 'leave') {
					await env.DB.prepare(
						`UPDATE page_views SET time_spent = ? WHERE id = ?`
					).bind(body.timeSpent || 0, body.id || '').run();
				}
				else if (body.type === 'click') {
					await env.DB.prepare(
						`INSERT INTO click_events (path, tag, label, day, created_at) VALUES (?, ?, ?, ?, ?)`
					).bind(body.path || '', body.tag || '', body.label || '', today, Date.now()).run();
				}

				return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
			} catch (e) {
				// dont wanna break the site incase it says bye! woopsies!
				return new Response(JSON.stringify({ success: false }), { headers: corsHeaders });
			}
		}

				// ANALYTICS DASHBOARD READ - added 6/9/2026
		if (path === '/api/admin/analytics/summary' && method === 'GET') {
			const adminKey = request.headers.get('X-Admin-Key');
			if (!adminKey || !env.ADMIN_SECRET || adminKey.trim() !== env.ADMIN_SECRET.trim()) {
				return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
			}

			try {
				const topPages = await env.DB.prepare(
					`SELECT path, COUNT(*) as views, AVG(time_spent) as avgTime FROM page_views GROUP BY path ORDER BY views DESC LIMIT 20`
				).all();

				const referrers = await env.DB.prepare(
					`SELECT referrer, COUNT(*) as cnt FROM page_views GROUP BY referrer ORDER BY cnt DESC LIMIT 10`
				).all();

				const viewports = await env.DB.prepare(
					`SELECT viewport, COUNT(*) as cnt FROM page_views GROUP BY viewport`
				).all();

				const themes = await env.DB.prepare(
					`SELECT theme, COUNT(*) as cnt FROM page_views GROUP BY theme`
				).all();

				const dailyViews = await env.DB.prepare(
					`SELECT day, COUNT(*) as cnt FROM page_views GROUP BY day ORDER BY day DESC LIMIT 14`
				).all();

				const topClicks = await env.DB.prepare(
					`SELECT path, tag, label, COUNT(*) as cnt FROM click_events GROUP BY path, tag, label ORDER BY cnt DESC LIMIT 30`
				).all();

				const totals = await env.DB.prepare(
					`SELECT COUNT(*) as totalViews, AVG(time_spent) as avgTimeAll FROM page_views`
				).first();

				return new Response(JSON.stringify({
					totals: totals || { totalViews: 0, avgTimeAll: 0 },
					topPages: topPages.results || [],
					referrers: referrers.results || [],
					viewports: viewports.results || [],
					themes: themes.results || [],
					dailyViews: dailyViews.results || [],
					topClicks: topClicks.results || []
				}), { headers: corsHeaders });
			} catch (e) {
				return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
			}
		}
		// ANALYTICS DASHBOARD END

		// SITE STATUS CHECK END
		// SITE STATUS CHECK END
		// SITE STATUS CHECK END
		// SITE STATUS CHECK END
		// SITE STATUS CHECK END

		// const corsHeaders = {
		// 	'Access-Control-Allow-Origin': '*',
		// 	'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
		// 	'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Key',
		// 	'Content-Type': 'application/json'
		// };

		if (method === 'OPTIONS') {
			return new Response(null, { headers: corsHeaders });
		}

		try {
            //fetch all msgs
			if (path === '/api/onemsg/messages' && method === 'GET') {
				const fingerprint = url.searchParams.get('fp') || '';
				
				let countRow = { cnt: 0 };
				try {
					countRow = await env.DB.prepare(`SELECT COUNT(*) as cnt FROM messages`).first() || { cnt: 0 };
				} catch(e) {}

				let messages = { results: [] };
				try {
					messages = await env.DB.prepare(`SELECT * FROM messages ORDER BY msg_number DESC LIMIT 100`).all();
				} catch(e) {}

				let userCheck = null;
				if (fingerprint) {
					try {
						userCheck = await env.DB.prepare(
							`SELECT id FROM messages WHERE device_fingerprint = ? OR ip_hash = ?`
						).bind(fingerprint, ipHash).first();
					} catch(e) {}
				}

				return new Response(JSON.stringify({
					totalCount: countRow.cnt || 0,
					hasPosted: !!userCheck,
					messages: messages.results || []
				}), { headers: corsHeaders });
			}

			// submit new msg
			if (path === '/api/onemsg/messages' && method === 'POST') {
                const body = await request.json();
                const { author, content, portrait, fingerprint } = body;

                const cleanAuthor = (author || 'Anonymous').trim();
                const cleanContent = (content || '').trim();
                const cleanPortrait = (portrait || 'niko.png').trim();

                if (!cleanContent) {
                    return new Response(JSON.stringify({ error: 'Message cannot be empty!' }), { status: 400, headers: corsHeaders });
                }

                let existingMsg = null;
                try {
                    existingMsg = await env.DB.prepare(
                        `SELECT id FROM messages WHERE device_fingerprint = ? OR ip_hash = ? OR LOWER(author) = LOWER(?)`
                    ).bind(fingerprint || 'none', ipHash, cleanAuthor).first();
                } catch(e) {}

                if (existingMsg) {
                    return new Response(JSON.stringify({ error: 'You have already left your OneMessage on the wall!' }), { status: 403, headers: corsHeaders });
                }

                let countRow = { cnt: 0 };
                try {
                    countRow = await env.DB.prepare(`SELECT COUNT(*) as cnt FROM messages`).first() || { cnt: 0 };
                } catch(e) {}

                const msgNumber = (countRow.cnt || 0) + 1;
                const id = 'msg_' + Date.now();

                await env.DB.prepare(
                    `INSERT INTO messages (id, msg_number, author, portrait, content, ip_hash, device_fingerprint) VALUES (?, ?, ?, ?, ?, ?, ?)`
                ).bind(id, msgNumber, cleanAuthor, cleanPortrait, cleanContent, ipHash, fingerprint || 'none').run();

                return new Response(JSON.stringify({ success: true, id, msgNumber }), { headers: corsHeaders });
            }

			// reactAPI
			if (path === '/api/onemsg/react' && method === 'POST') {
				const body = await request.json();
				const { msgId, reaction } = body;

				if (reaction === 'light') {
					await env.DB.prepare(`UPDATE messages SET lights_count = lights_count + 1 WHERE id = ?`).bind(msgId).run();
				} else if (reaction === 'pancake') {
					await env.DB.prepare(`UPDATE messages SET pancakes_count = pancakes_count + 1 WHERE id = ?`).bind(msgId).run();
				}

				return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
			}

            //adm login
            if (path === '/api/onemsg/admin/login' && method === 'POST') {
                const body = await request.json();
                const { password } = body;
                if (password && env.ADMIN_SECRET && password.trim() === env.ADMIN_SECRET.trim()) {
                    return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
                }
                return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
            }

			// adm delete and purge
			if (path === '/api/onemsg/admin/delete' && method === 'POST') {
                const adminKey = request.headers.get('X-Admin-Key');
                if (!adminKey || !env.ADMIN_SECRET || adminKey.trim() !== env.ADMIN_SECRET.trim()) {
                    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
                }

				const body = await request.json();
				const { msgId, purgeAll } = body;

				if (purgeAll) {
					await env.DB.prepare(`DELETE FROM messages`).run();
				} else if (msgId) {
					await env.DB.prepare(`DELETE FROM messages WHERE id = ?`).bind(msgId).run();
				}

				return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
			}

			return new Response(JSON.stringify({ error: 'Endpoint Not Found' }), { status: 404, headers: corsHeaders });

		} catch (e) {
			return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
		}
	}
};

async function hashIP(ip) {
	const msgUint8 = new TextEncoder().encode(ip + '_SALT_KIP_FORUM');
	const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
}