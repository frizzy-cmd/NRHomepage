// forum.js - Fixed Comment Submission & Username Locking

document.addEventListener('DOMContentLoaded', () => {
	const postForm = document.getElementById('postForm');
	const postAuthor = document.getElementById('postAuthor');
	const postTitle = document.getElementById('postTitle');
	const postContent = document.getElementById('postContent');
	const postImages = document.getElementById('postImages');
	const submitPostBtn = document.getElementById('submitPostBtn');
	const forumNotice = document.getElementById('forumNotice');
	const postsFeed = document.getElementById('postsFeed');
	const sidePanel = document.getElementById('sidePanel');
	const sidePanelBody = document.getElementById('sidePanelBody');

	let currentUserIpHash = '';
	let allPosts = [];
	let allComments = [];

	// Lock username if saved in localStorage
	const savedUser = localStorage.getItem('kip_forum_username') || '';
	if (postAuthor && savedUser) {
		postAuthor.value = savedUser;
		postAuthor.readOnly = true;
	}

	checkUserStatus();
	loadPosts();

	if (postForm) {
		postForm.addEventListener('submit', async (e) => {
			e.preventDefault();
			const authorVal = postAuthor.value.trim() || 'Anonymous';
			const titleVal = postTitle.value.trim();
			const contentVal = postContent.value.trim();
			const files = postImages.files;

			if (!titleVal || !contentVal) return alert('Fill in both title and content!');
			if (files.length > 2) return alert('Maximum 2 images allowed!');

			localStorage.setItem('kip_forum_username', authorVal);
			postAuthor.readOnly = true;

			submitPostBtn.disabled = true;

			try {
				const formData = new FormData();
				formData.append('author', authorVal);
				formData.append('title', titleVal);
				formData.append('content', contentVal);
				for (let i = 0; i < files.length; i++) formData.append('images', files[i]);

				const adminToken = sessionStorage.getItem('kip_admin_token') || '';
				const headers = {};
				if (adminToken) headers['X-Admin-Key'] = adminToken;

				const res = await fetch('/api/forum/posts', { method: 'POST', headers, body: formData });
				if (res.ok) {
					postTitle.value = ''; postContent.value = ''; postImages.value = '';
					loadPosts();
				} else {
					const data = await res.json();
					alert(data.error || 'Post failed');
				}
			} catch (err) { alert(err.message); }
			finally { submitPostBtn.disabled = false; }
		});
	}

	async function checkUserStatus() {
		try {
			const res = await fetch('/api/forum/user-status');
			if (res.ok) {
				const data = await res.json();
				currentUserIpHash = data.userIpHash || '';
			}
		} catch (e) {}
	}

	async function loadPosts() {
		try {
			const res = await fetch('/api/forum/posts');
			if (!res.ok) return;

			const data = await res.json();
			currentUserIpHash = data.userIpHash || currentUserIpHash;
			allPosts = data.posts || [];
			allComments = data.comments || [];

			if (!allPosts.length) {
				postsFeed.innerHTML = '<p style="color: #aaa;">No discussions yet. Be the first one!</p>';
				return;
			}

			postsFeed.innerHTML = allPosts.map(p => {
				const pComments = allComments.filter(c => c.post_id === p.id);
				const isOwnPost = p.ip_hash === currentUserIpHash;
				const modBadge = p.is_admin === 1 ? '<span class="mod-badge">[Moderator]</span>' : '';

				return `
					<div class="post-card" style="cursor: pointer;" onclick="openSidePanel('${p.id}')">
						<div class="post-header">
							<span class="post-author">${escapeHTML(p.author)}${modBadge}</span>
							<span>${new Date(p.created_at).toLocaleString()}</span>
						</div>
						<div class="post-title">${escapeHTML(p.title)}</div>
						<div class="post-content">${escapeHTML(p.content)}</div>
						<div style="font-size: 11pt; color: var(--header-subtitle);">
							${pComments.length} comments
							${isOwnPost && !p.is_deleted ? `<button class="self-del-btn" onclick="event.stopPropagation(); deleteOwn('post', '${p.id}')">Delete</button>` : ''}
						</div>
					</div>
				`;
			}).join('');
		} catch (e) {}
	}

	window.openSidePanel = function(postId) {
		const post = allPosts.find(p => p.id === postId);
		if (!post) return;

		const pComments = allComments.filter(c => c.post_id === postId);
		let imagesArr = [];
		try { imagesArr = JSON.parse(post.images || '[]'); } catch (e) {}

		const currentLockedUsername = localStorage.getItem('kip_forum_username') || '';

		sidePanelBody.innerHTML = `
			<h3 style="color: #fff; margin-top: 0;">${escapeHTML(post.title)}</h3>
			<div style="font-size: 11pt; color: #aaa; margin-bottom: 12px;">
				By <strong style="color: var(--header-subtitle);">${escapeHTML(post.author)}</strong> | ${new Date(post.created_at).toLocaleString()}
			</div>
			<div class="post-content">${escapeHTML(post.content)}</div>

			${imagesArr.length ? `
				<div class="post-images-grid">
					${imagesArr.map(img => `<img src="${img}" class="post-img" onclick="window.open('${img}', '_blank')">`).join('')}
				</div>
			` : ''}

			<hr style="border: 0; border-top: 1px solid var(--box-border); margin: 20px 0;">

			<h4>Comments (${pComments.length})</h4>
			<div>
				${pComments.map(c => `
					<div class="comment-card">
						<span class="comment-author">${escapeHTML(c.author)}${c.is_admin ? ' <span class="mod-badge">[Moderator]</span>' : ''}</span>
						<span class="comment-date">${new Date(c.created_at).toLocaleTimeString()}</span>
						<div>${escapeHTML(c.content)}</div>
						${c.ip_hash === currentUserIpHash && !c.is_deleted ? `<button class="self-del-btn" onclick="deleteOwn('comment', '${c.id}')">Delete</button>` : ''}
					</div>
				`).join('')}
			</div>

			<div style="margin-top: 20px;">
				<h4>Add a Comment</h4>
				<input type="text" id="commentAuthor" placeholder="Username" value="${escapeHTML(currentLockedUsername)}" ${currentLockedUsername ? 'readonly' : ''} style="width: 100%; margin-bottom: 8px;">
				<textarea id="commentContent" rows="3" placeholder="Write your reply.." style="width: 100%; background: var(--input-bg); color: #fff; border: 1px solid var(--input-border); padding: 6px; font-family: Terminus, monospace;"></textarea>
				<button class="btn" style="width: 100% !important; margin-top: 10px;" onclick="submitComment('${post.id}')">Post</button>
			</div>
		`;

		sidePanel.classList.add('open');
	};

	window.closeSidePanel = function() { sidePanel.classList.remove('open'); };

	window.submitComment = async function(postId) {
		const authorEl = document.getElementById('commentAuthor');
		const author = authorEl ? authorEl.value.trim() : 'Anonymous';
		const content = document.getElementById('commentContent').value.trim();

		if (!content) return alert('Write a comment first!');

		if (author && !localStorage.getItem('kip_forum_username')) {
			localStorage.setItem('kip_forum_username', author);
		}

		try {
			const adminToken = sessionStorage.getItem('kip_admin_token') || '';
			const headers = { 'Content-Type': 'application/json' };
			if (adminToken) headers['X-Admin-Key'] = adminToken;

			const res = await fetch('/api/forum/comments', {
				method: 'POST',
				headers,
				body: JSON.stringify({ postId, author, content })
			});

			if (res.ok) {
				await loadPosts();
				openSidePanel(postId);
			} else {
				const data = await res.json();
				alert(data.error || 'Comment failed.');
			}
		} catch (e) { alert(e.message); }
	};

	window.deleteOwn = async function(type, id) {
		if (!confirm(`Are you sure you want to delete your ${type}?`)) return;

		try {
			const res = await fetch('/api/forum/delete-own', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ type, id })
			});

			if (res.ok) {
				await loadPosts();
				closeSidePanel();
			}
		} catch (e) {}
	};

	function escapeHTML(str) {
		return String(str || '').replace(/[&<>"']/g, m => ({
			'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
		})[m]);
	}
});