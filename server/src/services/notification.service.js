'use strict';
const { Notification, User } = require('../models');

// Called only after the underlying Follow, Comment or Like has been created
// inside the *same* transaction. Failed inserts roll back both writes.
async function createInteractionNotification({
  recipientId, actorId, eventType, postId = null, commentId = null, transaction,
}) {
  if (!transaction) throw new Error('Notification and interaction must share a transaction');
  if (!recipientId || recipientId === actorId) return null;
  const recipient = await User.findOne({
    where: { id: recipientId, is_active: true },
    attributes: ['id'], transaction,
  });
  if (!recipient) return null;
  return Notification.create({
    recipient_id: recipientId,
    actor_id: actorId,
    event_type: eventType,
    post_id: postId,
    comment_id: commentId,
  }, { transaction });
}
module.exports = { createInteractionNotification };
