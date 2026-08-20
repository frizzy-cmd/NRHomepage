// worker.js - Cloudflare Worker Backend for Kip's Forum & Admin Panel

export default {
	async fetch(request, env, ctx) {
		const url = new URL(request.url);
		const path = url.pathname;
		const method = request.method;

		// Get user IP hash for md.
		const clientIP = request.headers.get('cf-connecting-ip') || '127.0.0.1';
		const ipHash = await hashIP(clientIP);

		// this is CORS headers
		const corsHeaders = {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Key',
			'Content-Type': 'application/json'
		};

		if (method === 'OPTIONS') {
			return new Response(null, { headers: corsHeaders });
		}

		try {
            //Public API. Get usr status (checks if ban, mute or kick)
			if (path === '/api/forum/user-status' && method === 'GET') {
				const activeBan = await env.DB.prepare(
					`SELECT * FROM moderation WHERE ip_hash = ? AND action_type = 'ban' ORDER BY created_at DESC LIMIT 1`
				).bind(ipHash).first();

				if (activeBan) {
					return new Response(JSON.stringify({
						status: 'banned',
						reviewed: activeBan.created_at,
						reason: activeBan.reason
					}), { headers: corsHeaders });
				}

				const activeMute = await env.DB.prepare(
					`SELECT * FROM moderation WHERE ip_hash = ? AND action_type = 'mute' AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP) ORDER BY created_at DESC LIMIT 1`
				).bind(ipHash).first();

				if (activeMute) {
					return new Response(JSON.stringify({
						status: 'muted',
						expires_at: activeMute.expires_at,
						reason: activeMute.reason
					}), { headers: corsHeaders });
				}

				const activeKick = await env.DB.prepare(
					`SELECT * FROM moderation WHERE ip_hash = ? AND action_type = 'kick' ORDER BY created_at DESC LIMIT 1`
				).bind(ipHash).first();

				if (activeKick) {
					return new Response(JSON.stringify({
						status: 'kicked',
						reason: activeKick.reason
					}), { headers: corsHeaders });
				}

				return new Response(JSON.stringify({ status: 'ok' }), { headers: corsHeaders });
			}


            // Public API: Fetch all forum posts/comments
			if (path === '/api/forum/posts' && method === 'GET') {
				const posts = await env.DB.prepare(
					`SELECT * FROM posts ORDER BY created_at DESC LIMIT 50`
				).all();

				const comments = await env.DB.prepare(
					`SELECT * FROM comments ORDER BY created_at ASC`
				).all();

				// we kill off any del posts
				const sanitizedPosts = posts.results.map(p => {
					if (p.is_deleted) {
						return {
							...p,
							title: '[deleted]',
							content: '[Post removed by forum moderator]',
							images: '[]'
						};
					}
					return p;
				});

				return new Response(JSON.stringify({
					posts: sanitizedPosts,
					comments: comments.results
				}), { headers: corsHeaders });
			}

            // Public API: we create new post with a max of 2 img and a mcheck
			if (path === '/api/forum/posts' && method === 'POST') {
				// is user banned or muted? if YES!!, reject.
				const modCheck = await env.DB.prepare(
					`SELECT action_type, reason, expires_at FROM moderation WHERE ip_hash = ? AND (action_type = 'ban' OR (action_type = 'mute' AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)))`
				).bind(ipHash).first();

				if (modCheck) {
					return new Response(JSON.stringify({ error: `Action restricted. Status: ${modCheck.action_type}. Reason: ${modCheck.reason}` }), { status: 403, headers: corsHeaders });
				}

				const formData = await request.formData();
				const author = formData.get('author') || 'Anonymous';
				const title = formData.get('title') || '';
				const content = formData.get('content') || '';
				const imageFiles = formData.getAll('images');

				if (!title.trim() || !content.trim()) {
					return new Response(JSON.stringify({ error: 'Title and content are required!' }), { status: 400, headers: corsHeaders });
				}

				if (imageFiles.length > 2) {
					return new Response(JSON.stringify({ error: 'Maximum 2 images allowed per post!' }), { status: 400, headers: corsHeaders });
				}

				const uploadedImageUrls = [];
				for (const file of imageFiles) {
					if (file && file.size > 0) {
						if (file.size > 2 * 1024 * 1024) {
							return new Response(JSON.stringify({ error: 'Image size must be under 2MB!' }), { status: 400, headers: corsHeaders });
						}
						const key = `uploads/${Date.now()}_${Math.random().toString(36).substring(7)}_${file.name}`;
						await env.UPLOADS.put(key, file.stream(), {
							httpMetadata: { contentType: file.type }
						});
						uploadedImageUrls.push(`/api/forum/images/${key}`);
					}
				}

                // we check if req ahs valid mod pw header
				const adminKey = request.headers.get('X-Admin-Key');
				const isAdmin = (adminKey && adminKey === env.ADMIN_SECRET) ? 1 : 0;

				const id = 'post_' + Date.now();
				await env.DB.prepare(
					`INSERT INTO posts (id, author, title, content, images, ip_hash, is_admin) VALUES (?, ?, ?, ?, ?, ?, ?)`
				).bind(id, author, title, content, JSON.stringify(uploadedImageUrls), ipHash, isAdmin).run();

				return new Response(JSON.stringify({ success: true, id }), { headers: corsHeaders });
			}

            // modAPI: Verify admin pw and fetch stats admin.html
			if (path === '/api/admin/stats' && method === 'GET') {
				const adminKey = request.headers.get('X-Admin-Key');
				if (adminKey !== env.ADMIN_SECRET) {
					return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
				}

				const totalActivePosts = await env.DB.prepare(`SELECT COUNT(*) as cnt FROM posts WHERE is_deleted = 0`).first();
				const totalActiveComments = await env.DB.prepare(`SELECT COUNT(*) as cnt FROM comments WHERE is_deleted = 0`).first();
				const totalPosts = await env.DB.prepare(`SELECT COUNT(*) as cnt FROM posts`).first();
				const totalComments = await env.DB.prepare(`SELECT COUNT(*) as cnt FROM comments`).first();
				const totalMutes = await env.DB.prepare(`SELECT COUNT(*) as cnt FROM moderation WHERE action_type = 'mute'`).first();
				const totalBans = await env.DB.prepare(`SELECT COUNT(*) as cnt FROM moderation WHERE action_type = 'ban'`).first();
				const totalKicks = await env.DB.prepare(`SELECT COUNT(*) as cnt FROM moderation WHERE action_type = 'kick'`).first();
				const totalRemovals = await env.DB.prepare(`SELECT COUNT(*) as cnt FROM moderation WHERE action_type = 'delete'`).first();

				const auditLog = await env.DB.prepare(`SELECT * FROM moderation ORDER BY created_at DESC LIMIT 50`).all();
				const activeUsers = await env.DB.prepare(`SELECT DISTINCT author, ip_hash, created_at FROM posts ORDER BY created_at DESC LIMIT 50`).all();

				return new Response(JSON.stringify({
					stats: {
						activePosts: totalActivePosts.cnt,
						activeComments: totalActiveComments.cnt,
						totalPosts: totalPosts.cnt,
						totalComments: totalComments.cnt,
						totalCombined: totalPosts.cnt + totalComments.cnt,
						mutes: totalMutes.cnt,
						bans: totalBans.cnt,
						kicks: totalKicks.cnt,
						removals: totalRemovals.cnt
					},
					auditLog: auditLog.results,
					activeUsers: activeUsers.results
				}), { headers: corsHeaders });
			}

            // modAPI: Exec mod actions, del post, ban, mute, kick.
			if (path === '/api/admin/moderate' && method === 'POST') {
				const adminKey = request.headers.get('X-Admin-Key');
				if (adminKey !== env.ADMIN_SECRET) {
					return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
				}

				const body = await request.json();
				const { action, targetId, ipHash: targetIp, username, reason, durationHours, adminName } = body;
				const modId = 'mod_' + Date.now();
				const modName = adminName || 'Admin';

				if (action === 'delete') {
					await env.DB.prepare(`UPDATE posts SET is_deleted = 1, deletion_reason = ? WHERE id = ?`).bind(reason, targetId).run();
					await env.DB.prepare(`INSERT INTO moderation (id, ip_hash, username, action_type, reason, admin_name) VALUES (?, ?, ?, 'delete', ?, ?)`).bind(modId, targetIp || 'unknown', username || 'unknown', reason, modName).run();
				} 
				else if (action === 'ban') {
					await env.DB.prepare(`INSERT INTO moderation (id, ip_hash, username, action_type, reason, admin_name) VALUES (?, ?, ?, 'ban', ?, ?)`).bind(modId, targetIp, username, reason, modName).run();
				} 
				else if (action === 'mute') {
					let expires = null;
					if (durationHours) {
						let date = new Date(Date.now() + durationHours * 3600 * 1000);
						expires = date.toISOString().replace('T', ' ').substring(0, 19);
					}
					await env.DB.prepare(`INSERT INTO moderation (id, ip_hash, username, action_type, reason, expires_at, admin_name) VALUES (?, ?, ?, 'mute', ?, ?, ?)`).bind(modId, targetIp, username, reason, expires, modName).run();
				} 
				else if (action === 'kick') {
					await env.DB.prepare(`UPDATE posts SET is_deleted = 1, deletion_reason = ? WHERE ip_hash = ?`).bind(reason, targetIp).run();
					await env.DB.prepare(`UPDATE comments SET is_deleted = 1 WHERE ip_hash = ?`).bind(targetIp).run();
					await env.DB.prepare(`INSERT INTO moderation (id, ip_hash, username, action_type, reason, admin_name) VALUES (?, ?, ?, 'kick', ?, ?)`).bind(modId, targetIp, username, reason, modName).run();
				}
				else if (action === 'revoke') {
					await env.DB.prepare(`DELETE FROM moderation WHERE id = ?`).bind(targetId).run();
				}

				return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
			}

			// serve img from r2
			if (path.startsWith('/api/forum/images/')) {
				const key = path.replace('/api/forum/images/', '');
				const object = await env.UPLOADS.get(key);
				if (!object) return new Response('Not Found', { status: 404 });
				const headers = new Headers();
				object.writeHttpMetadata(headers);
				headers.set('etag', object.httpEtag);
				return new Response(object.body, { headers });
			}

			return new Response(JSON.stringify({ error: 'Endpoint Not Found' }), { status: 404, headers: corsHeaders });

		} catch (e) {
			return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
		}
	}
};

// SHA-256 hash func for IP
async function hashIP(ip) {
	const msgUint8 = new TextEncoder().encode(ip + '_SALT_KIP_FORUM');
	const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
}