// forum.js - For forum.html

document.addEventListener('DOMContentLoaded', () => {
	const postForm = document.getElementById('postForm');
	const postAuthor = document.getElementById('postAuthor');
	const postTitle = document.getElementById('postTitle');
	const postContent = document.getElementById('postContent');
	const postImages = document.getElementById('postImages');
	const submitPostBtn = document.getElementById('submitPostBtn');
	const forumNotice = document.getElementById('forumNotice');
	const postsFeed = document.getElementById('postsFeed');

	const suspensionModal = document.getElementById('suspensionModal');
	const banDate = document.getElementById('banDate');
	const banReason = document.getElementById('banReason');

	// restore username from localstorage
	const savedUser = localStorage.getItem('kip_forum_username') || '';
	if (postAuthor) postAuthor.value = savedUser;

	checkUserStatus();

	loadPosts();

	// this handles post submissions
	if (postForm) {
		postForm.addEventListener('submit', async (e) => {
			e.preventDefault();

			const authorVal = postAuthor.value.trim() || 'Anonymous';
			const titleVal = postTitle.value.trim();
			const contentVal = postContent.value.trim();
			const files = postImages.files;

			if (!titleVal || !contentVal) {
				alert('Please fill in both the title and content!');
				return;
			}

			if (files.length > 2) {
				alert('Maximum 2 images allowed per post!');
				return;
			}

			// save usr for future sessions
			localStorage.setItem('kip_forum_username', authorVal);

			submitPostBtn.disabled = true;
			submitPostBtn.textContent = 'Publishing..';

			try {
				const formData = new FormData();
				formData.append('author', authorVal);
				formData.append('title', titleVal);
				formData.append('content', contentVal);

				for (let i = 0; i < files.length; i++) {
					formData.append('images', files[i]);
				}

				const res = await fetch('/api/forum/posts', {
					method: 'POST',
					body: formData
				});

				const data = await res.json();

				if (!res.ok) {
					alert(data.error || 'Failed to publish post.');
				} else {
					postTitle.value = '';
					postContent.value = '';
					postImages.value = '';
					loadPosts(); // ref
				}
			} catch (err) {
				alert('Error publishing post: ' + err.message);
			} finally {
				submitPostBtn.disabled = false;
				submitPostBtn.textContent = 'Publish post';
			}
		});
	}

	// we check user status
	async function checkUserStatus() {
		try {
			const res = await fetch('/api/forum/user-status');
			if (!res.ok) return;

			const data = await res.json();

            // here lists the uis for the moderations
			if (data.status === 'banned') {
				// ban
				if (suspensionModal) {
					banDate.textContent = new Date(data.reviewed).toUTCString();
					banReason.textContent = data.reason || 'Violation of community rules';
					suspensionModal.style.display = 'flex';
				}
				if (postForm) postForm.style.display = 'none';
			} else if (data.status === 'muted') {
				// mute
				if (forumNotice) {
					forumNotice.className = 'forum-notice mute';
					forumNotice.style.display = 'block';
					forumNotice.innerHTML = `
						<strong>Forum mute</strong><br>
						You have been temporarily muted by a forum moderator until ${new Date(data.expires_at).toUTCString()}.<br>
						Reason: ${escapeHTML(data.reason || 'Undefined')}
					`;
				}
				if (submitPostBtn) submitPostBtn.disabled = true;
			} else if (data.status === 'kicked') {
				// kick
				if (forumNotice) {
					forumNotice.className = 'forum-notice';
					forumNotice.style.display = 'block';
					forumNotice.innerHTML = `
						<strong>Notice</strong><br>
						You have been kicked by a forum moderator. You can still make posts/comments, however existing posts/comments have been removed.<br>
						Reason: ${escapeHTML(data.reason || 'Undefined')}
					`;
				}
				localStorage.removeItem('kip_forum_username');
			}
		} catch (e) {
			console.log('failed to check User status:', e);
		}
	}

	// load all avail posts and comments
	async function loadPosts() {
		try {
			const res = await fetch('/api/forum/posts');
			if (!res.ok) throw new Error('Failed to load posts');

			const data = await res.json();
			const posts = data.posts || [];
			const comments = data.comments || [];

			if (!posts.length) {
				postsFeed.innerHTML = '<p style="color: #aaa;">No discussions yet. Be the first to create a post!</p>';
				return;
			}

			postsFeed.innerHTML = posts.map(p => {
				const postComments = comments.filter(c => c.post_id === p.id);
				let imagesArr = [];
				try { imagesArr = JSON.parse(p.images || '[]'); } catch (e) {}

				const isDeleted = p.is_deleted === 1;

				return `
					<div class="post-card">
						<div class="post-header">
							<span class="post-author">${escapeHTML(p.author)}</span>
							<span>${new Date(p.created_at).toLocaleString()}</span>
						</div>
						<div class="post-title">${isDeleted ? '[deleted]' : escapeHTML(p.title)}</div>
						<div class="post-content">${isDeleted ? '[Post removed by forum moderator]' : escapeHTML(p.content)}</div>

						${!isDeleted && imagesArr.length ? `
							<div class="post-images-grid">
								${imagesArr.map(imgUrl => `<img src="${imgUrl}" class="post-img" onclick="window.open('${imgUrl}', '_blank')">`).join('')}
							</div>
						` : ''}

						<div class="comments-section">
							<strong style="color: var(--header-subtitle);">${postComments.length} Comments</strong>
							${postComments.map(c => `
								<div class="comment-card">
									<span class="comment-author">${escapeHTML(c.author)}</span>
									<span class="comment-date">${new Date(c.created_at).toLocaleTimeString()}</span>
									<div>${c.is_deleted ? '[Comment removed by forum moderator]' : escapeHTML(c.content)}</div>
								</div>
							`).join('')}
						</div>
					</div>
				`;
			}).join('');

		} catch (err) {
			postsFeed.innerHTML = `<p style="color: #ff4444;">Error loading posts: ${err.message}</p>`;
		}
	}

    // lol
	function escapeHTML(str) {
		return String(str || '').replace(/[&<>"']/g, m => ({
			'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
		})[m]);
	}
});