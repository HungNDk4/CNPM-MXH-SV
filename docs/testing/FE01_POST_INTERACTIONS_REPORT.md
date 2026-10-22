# FE-01 Post Detail + Comments/Replies + Likes

Implementation on a dedicated branch based on integration/team-dev-20261020. Source scope: client/src/pages/posts/PostDetailPage.jsx only; no backend, SQL, API wrapper, or Render deployment changes.

Post Detail: question and discussion detail via postAPI.getById; loading, invalid id, 403, 404, guest login prompt, document redirect, unavailable/hidden state, metadata and safe text rendering.

Comments: top-level comments and one-level replies via commentAPI.getByPost/create/delete. Forms reject empty content and limit UI input to 2000 characters. Owner or admin sees delete button, API remains authorization authority; query refetch/invalidation and toast feedback after mutation.

Likes: post and comment counts from likeAPI.count, toggle from likeAPI.toggle with known liked value only after mutation, refetching server counts. The current API does NOT expose the viewer's saved liked state at initial load, so the UI labels initial state as unknown. Adding a viewerLiked endpoint needs backend contract review; no guessed persisted heart state.

Remaining backend risks: comment endpoint does not deeply validate parent/post/status and like endpoint does not validate target visibility. These are separate security hardening tasks, not claimed fixed here. Browser test and build evidence to follow.

Do not merge into main or auto-deployed Render branch without Human A/B review.
