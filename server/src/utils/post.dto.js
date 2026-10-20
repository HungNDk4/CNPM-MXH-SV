'use strict';

// SEC-01: explicit projection. Never serialize complete Post / related model
// instances to HTTP. In particular, file_url, file_name and storage paths
// must never be part of any Post JSON response.
const toSafePost = (record) => {
  const post = typeof record.toJSON === 'function' ? record.toJSON() : record;
  const author = post.author || null;

  return {
    id: post.id,
    user_id: post.user_id,
    title: post.title,
    content: post.content ?? null,
    post_type: post.post_type,
    subject: post.subject ?? null,
    tags: Array.isArray(post.tags)
      ? post.tags.filter(tag => typeof tag === 'string')
      : null,
    price: Number(post.price ?? 0).toFixed(2),
    view_count: post.view_count,
    status: post.status,
    created_at: post.created_at,
    updated_at: post.updated_at,
    author: author ? {
      id: author.id,
      full_name: author.full_name,
      avatar_url: author.avatar_url ?? null,
      university: author.university ?? null,
    } : null,
  };
};

module.exports = { toSafePost };
