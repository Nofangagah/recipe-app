import Bookmark from '../model/bookmarkModel.js';
import Recipe from '../model/recipeModel.js';

// 📌 Tambah bookmark
const addBookmark = async (req, res) => {
  try {
    const userId = req.user.id;
    const { recipeId } = req.body;

    // Cek apakah recipe-nya ada
    const recipe = await Recipe.findByPk(recipeId);
    if (!recipe) return res.status(404).json({ message: "Resep tidak ditemukan" });

    // Cek duplikat
    const existing = await Bookmark.findOne({ where: { userId, recipeId } });
    if (existing) return res.status(400).json({ message: "Bookmark sudah ada" });

    await Bookmark.create({ userId, recipeId });
    res.status(201).json({ message: "Resep berhasil dibookmark" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal menambahkan bookmark" });
  }
};

// ❌ Hapus bookmark
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

// 📋 Ambil semua bookmark milik user
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
