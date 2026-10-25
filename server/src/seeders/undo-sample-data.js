/**
 * Mini Study Network - Sample Data Undo / Rollback
 * 
 * Safely removes seeded sample student accounts and their associated interactions.
 * Strictly protects existing real user accounts (admin, hungnd, demo1) and their data.
 * 
 * Usage:
 *   cd server
 *   node src/seeders/undo-sample-data.js
 */

'use strict';
require('dotenv').config();

const { Op } = require('sequelize');
const {
  sequelize,
  User,
  Post,
  Comment,
  Like,
  Follow,
  Bookmark,
  Notification,
} = require('../models');

// Protected emails that must NEVER be touched
const PROTECTED_EMAILS = [
  'admin@studynet.vn',
  'hungnd13112004@gmail.com',
  'demo1@gmail.com',
];

const SAMPLE_EMAILS = [
  'minhanh.tran@studynet.vn',
  'hoangnam.le@studynet.vn',
  'thutrang.pham@studynet.vn',
  'quocbao.dang@studynet.vn',
  'haiyen.vu@studynet.vn',
  'ducthang.nguyen@studynet.vn',
  'phuonglinh.bui@studynet.vn',
  'quanghuy.do@studynet.vn',
  'maichi.hoang@studynet.vn',
  'tuankiet.trinh@studynet.vn',
];

async function undoSampleData() {
  console.log('--- BẮT ĐẦU HOÀN TÁC (ROLLBACK) DỮ LIỆU MẪU ---');

  // Find all sample users
  const sampleUsers = await User.findAll({
    where: {
      email: {
        [Op.in]: SAMPLE_EMAILS,
        [Op.notIn]: PROTECTED_EMAILS,
      },
    },
    attributes: ['id', 'email', 'full_name'],
  });

  const sampleUserIds = sampleUsers.map(u => u.id);
  console.log(`Tìm thấy ${sampleUserIds.length} tài khoản mẫu cần hoàn tác.`);

  if (sampleUserIds.length === 0) {
    console.log('Không có tài khoản mẫu nào cần xóa.');
    return;
  }

  // Find sample posts
  const samplePosts = await Post.findAll({
    where: { user_id: { [Op.in]: sampleUserIds } },
    attributes: ['id'],
  });
  const samplePostIds = samplePosts.map(p => p.id);

  console.log(`Tìm thấy ${samplePostIds.length} bài viết mẫu.`);

  await sequelize.transaction(async (transaction) => {
    // 1. Delete notifications related to sample users or sample posts
    const notifCount = await Notification.destroy({
      where: {
        [Op.or]: [
          { actor_id: { [Op.in]: sampleUserIds } },
          { recipient_id: { [Op.in]: sampleUserIds } },
          ...(samplePostIds.length ? [{ post_id: { [Op.in]: samplePostIds } }] : []),
        ],
      },
      transaction,
    });
    console.log(` Đã xóa ${notifCount} thông báo liên quan.`);

    // 2. Delete likes by sample users or on sample posts
    const likesCount = await Like.destroy({
      where: {
        [Op.or]: [
          { user_id: { [Op.in]: sampleUserIds } },
          ...(samplePostIds.length ? [{ target_type: 'post', target_id: { [Op.in]: samplePostIds } }] : []),
        ],
      },
      transaction,
    });
    console.log(` Đã xóa ${likesCount} lượt thích liên quan.`);

    // 3. Delete bookmarks by sample users or of sample posts
    const bookmarkCount = await Bookmark.destroy({
      where: {
        [Op.or]: [
          { user_id: { [Op.in]: sampleUserIds } },
          ...(samplePostIds.length ? [{ post_id: { [Op.in]: samplePostIds } }] : []),
        ],
      },
      transaction,
    });
    console.log(` Đã xóa ${bookmarkCount} bookmarks liên quan.`);

    // 4. Delete follows involving sample users
    const followCount = await Follow.destroy({
      where: {
        [Op.or]: [
          { follower_id: { [Op.in]: sampleUserIds } },
          { following_id: { [Op.in]: sampleUserIds } },
        ],
      },
      transaction,
    });
    console.log(` Đã xóa ${followCount} quan hệ theo dõi liên quan.`);

    // 5. Delete comments on sample posts or by sample users
    const commentCount = await Comment.destroy({
      where: {
        [Op.or]: [
          { user_id: { [Op.in]: sampleUserIds } },
          ...(samplePostIds.length ? [{ post_id: { [Op.in]: samplePostIds } }] : []),
        ],
      },
      transaction,
    });
    console.log(` Đã xóa ${commentCount} bình luận liên quan.`);

    // 6. Delete sample posts
    if (samplePostIds.length > 0) {
      const deletedPosts = await Post.destroy({
        where: { id: { [Op.in]: samplePostIds } },
        transaction,
      });
      console.log(` Đã xóa ${deletedPosts} bài viết mẫu.`);
    }

    // 7. Delete sample users
    const deletedUsers = await User.destroy({
      where: { id: { [Op.in]: sampleUserIds } },
      transaction,
    });
    console.log(` Đã xóa ${deletedUsers} tài khoản người dùng mẫu.`);
  });

  console.log('\n--- HOÀN TÁC DỮ LIỆU MẪU HOÀN TẤT VÀ AN TOÀN! ---');
  console.log(`- Số lượng Users còn lại: ${await User.count()}`);
  console.log(`- Số lượng Posts còn lại: ${await Post.count()}`);
}

undoSampleData()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Lỗi khi hoàn tác dữ liệu:', err);
    process.exit(1);
  });
