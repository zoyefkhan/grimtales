/* ============================================
   controllers/chapterController.js
============================================ */
const Chapter = require('../models/Chapter');
const Novel = require('../models/Novel');

exports.getChapters = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, order = 'asc' } = req.query;
    const filter = { novel: req.params.novelId, isPublished: true };
    const total = await Chapter.countDocuments(filter);
    const chapters = await Chapter.find(filter)
      .sort({ number: order === 'asc' ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(+limit)
      .select('-content');
    res.json({ success: true, count: chapters.length, total, data: chapters });
  } catch (err) { next(err); }
};

exports.getChapter = async (req, res, next) => {
  try {
    const chapter = await Chapter.findById(req.params.id)
      .populate('novel', 'title author status')
      .populate('author', 'username');

    if (!chapter) return res.status(404).json({ success: false, message: 'Chapter not found' });

    // Only author can view unpublished chapters
    const isAuthor = req.user && req.user.id === chapter.author._id.toString();
    if (!chapter.isPublished && !isAuthor) {
      return res.status(404).json({ success: false, message: 'Chapter not found' });
    }

    // Increment views (non-blocking)
    Chapter.findByIdAndUpdate(chapter._id, { $inc: { views: 1 } }).catch(() => {});

    // Fetch prev/next chapters
    const [prev, next] = await Promise.all([
      Chapter.findOne({ novel: chapter.novel._id, number: chapter.number - 1, isPublished: true }).select('_id number title'),
      Chapter.findOne({ novel: chapter.novel._id, number: chapter.number + 1, isPublished: true }).select('_id number title'),
    ]);

    res.json({ success: true, data: chapter, prev: prev || null, next: next || null });
  } catch (err) { next(err); }
};

exports.createChapter = async (req, res, next) => {
  try {
    const novel = await Novel.findById(req.body.novel);
    if (!novel) return res.status(404).json({ success: false, message: 'Novel not found' });
    if (novel.author.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    const lastChapter = await Chapter.findOne({ novel: req.body.novel }).sort({ number: -1 });
    const chapter = await Chapter.create({
      ...req.body,
      author: req.user.id,
      number: (lastChapter?.number || 0) + 1,
    });
    res.status(201).json({ success: true, data: chapter });
  } catch (err) { next(err); }
};

exports.updateChapter = async (req, res, next) => {
  try {
    const chapter = await Chapter.findById(req.params.id);
    if (!chapter) return res.status(404).json({ success: false, message: 'Chapter not found' });
    if (chapter.author.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    const updated = await Chapter.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
};

exports.deleteChapter = async (req, res, next) => {
  try {
    const chapter = await Chapter.findById(req.params.id);
    if (!chapter) return res.status(404).json({ success: false, message: 'Chapter not found' });
    if (chapter.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    await chapter.deleteOne();
    // Decrement novel chapter count
    await Novel.findByIdAndUpdate(chapter.novel, {
      $inc: { totalChapters: -1, totalWords: -chapter.wordCount },
    });
    res.json({ success: true, message: 'Chapter deleted' });
  } catch (err) { next(err); }
};

exports.publishChapter = async (req, res, next) => {
  try {
    const chapter = await Chapter.findById(req.params.id);
    if (!chapter) return res.status(404).json({ success: false, message: 'Chapter not found' });
    if (chapter.author.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    chapter.isPublished = true;
    chapter.publishedAt = new Date();
    await chapter.save();
    // Update novel stats
    await Novel.findByIdAndUpdate(chapter.novel, {
      $inc: { totalChapters: 1, totalWords: chapter.wordCount },
      lastChapterAt: new Date(),
    });
    res.json({ success: true, data: chapter });
  } catch (err) { next(err); }
};
