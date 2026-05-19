/* ============================================
   controllers/ratingController.js
============================================ */
const Rating = require('../models/Rating');
const Novel = require('../models/Novel');

function mapUser(u) {
  if (!u) return u;
  const obj = u.toObject ? u.toObject() : u;
  return Object.assign({}, obj, { avatar_url: obj.avatar || obj.avatar_url || '', id: obj._id || obj.id, username: obj.username });
}

function mapRating(r) {
  if (!r) return r;
  const obj = r.toObject ? r.toObject() : r;
  return Object.assign({}, obj, { user: mapUser(obj.user) });
}

exports.rateNovel = async (req, res, next) => {
  try {
    const { score, review } = req.body;
    if (!score || score < 1 || score > 5) {
      return res.status(400).json({ success: false, message: 'Score must be between 1 and 5' });
    }

    let rating = await Rating.findOne({ user: req.user.id, novel: req.params.novelId });
    if (rating) {
      rating.score = score;
      rating.review = review || rating.review;
      await rating.save();
    } else {
      rating = await Rating.create({
        user: req.user.id,
        novel: req.params.novelId,
        score,
        review: review || '',
      });
    }

    // Recalculate average rating on the novel
    const allRatings = await Rating.find({ novel: req.params.novelId });
    const avg = allRatings.reduce((sum, r) => sum + r.score, 0) / allRatings.length;
    await Novel.findByIdAndUpdate(req.params.novelId, {
      avgRating: Math.round(avg * 10) / 10,
      totalRatings: allRatings.length,
    });

    res.json({ success: true, data: mapRating(rating) });
  } catch (err) { next(err); }
};

exports.getNovelRatings = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const total = await Rating.countDocuments({ novel: req.params.novelId });
    const ratings = await Rating.find({ novel: req.params.novelId })
      .populate('user', 'username avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(+limit);

    // Score distribution
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    const allScores = await Rating.find({ novel: req.params.novelId }).select('score');
    allScores.forEach(r => { distribution[r.score] = (distribution[r.score] || 0) + 1; });

    res.json({ success: true, count: ratings.length, total, distribution, data: ratings.map(mapRating) });
  } catch (err) { next(err); }
};

exports.deleteRating = async (req, res, next) => {
  try {
    const rating = await Rating.findOneAndDelete({
      user: req.user.id,
      novel: req.params.novelId,
    });
    if (!rating) return res.status(404).json({ success: false, message: 'Rating not found' });

    // Recalculate average
    const remaining = await Rating.find({ novel: req.params.novelId });
    const avg = remaining.length
      ? remaining.reduce((sum, r) => sum + r.score, 0) / remaining.length
      : 0;

    await Novel.findByIdAndUpdate(req.params.novelId, {
      avgRating: Math.round(avg * 10) / 10,
      totalRatings: remaining.length,
    });

    res.json({ success: true, message: 'Rating removed' });
  } catch (err) { next(err); }
};
