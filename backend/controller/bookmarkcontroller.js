import Bookmark from '../model/bookmarkModel.js';
import Recipe from '../model/recipeModel.js';

/**
 * @swagger
 * /bookmarks:
 *   post:
 *     summary: Tambah bookmark resep
 *     tags: [Bookmark]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               recipeId:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: Resep berhasil dibookmark
 *       400:
 *         description: Bookmark sudah ada
 *       404:
 *         description: Resep tidak ditemukan
 *       500:
 *         description: Gagal menambahkan bookmark
 */
const addBookmark = async (req, res) => {
  try {
    const userId = req.user.id;
    const { recipeId } = req.body;

    const recipe = await Recipe.findByPk(recipeId);
    if (!recipe) return res.status(404).json({ message: "Resep tidak ditemukan" });

    const existing = await Bookmark.findOne({ where: { userId, recipeId } });
    if (existing) return res.status(400).json({ message: "Bookmark sudah ada" });

    await Bookmark.create({ userId, recipeId });
    res.status(201).json({ message: "Resep berhasil dibookmark" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal menambahkan bookmark" });
  }
};

/**
 * @swagger
 * /bookmarks/{recipeId}:
 *   delete:
 *     summary: Hapus bookmark berdasarkan recipeId
 *     tags: [Bookmark]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: recipeId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Bookmark berhasil dihapus
 *       404:
 *         description: Bookmark tidak ditemukan
 *       500:
 *         description: Gagal menghapus bookmark
 */
const removeBookmark = async (req, res) => {
  try {
    const userId = req.user.id;
    const { recipeId } = req.params;

    const bookmark = await Bookmark.findOne({ where: { userId, recipeId } });
    if (!bookmark) return res.status(404).json({ message: "Bookmark tidak ditemukan" });

    await bookmark.destroy();
    res.status(200).json({ message: "Bookmark berhasil dihapus" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal menghapus bookmark" });
  }
};

/**
 * @swagger
 * /bookmarks:
 *   get:
 *     summary: Ambil semua bookmark milik user
 *     tags: [Bookmark]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Daftar bookmark
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   userId:
 *                     type: integer
 *                   recipeId:
 *                     type: integer
 *                   createdAt:
 *                     type: string
 *                   updatedAt:
 *                     type: string
 *                   recipe:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       title:
 *                         type: string
 *                       ingredients:
 *                         type: array
 *                         items:
 *                           type: object
 *                       instructions:
 *                         type: array
 *                         items:
 *                           type: object
 *       500:
 *         description: Gagal mengambil data bookmark
 */
const getMyBookmarks = async (req, res) => {
  try {
    const userId = req.user.id;

    const bookmarks = await Bookmark.findAll({
      where: { userId },
      include: {
        model: Recipe,
        as: 'recipe',
        include: ['ingredients', 'instructions'],
      },
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json(bookmarks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal mengambil data bookmark" });
  }
};

export {
  addBookmark,
  removeBookmark,
  getMyBookmarks
};
