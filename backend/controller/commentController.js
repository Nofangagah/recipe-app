import Comment from '../model/commentModel.js';
import Recipe from '../model/recipeModel.js';
import User from '../model/userModel.js';
import { Op } from 'sequelize';

// 📌 Ambil semua komentar dari resep (dengan reply & pagination)
const getCommentsByRecipe = async (req, res) => {
  try {
    const recipeId = req.params.recipeId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await Comment.findAndCountAll({
      where: {
        recipeId,
        parentId: null,
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name'],
        },
        {
          model: Comment,
          as: 'replies',
          include: [
            {
              model: User,
                as: 'user',
              attributes: ['id', 'name'],
            },
          ],
        },
      ],
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json({
      comments: rows,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Gagal mengambil komentar", error });
  }
};

// ➕ Tambah komentar atau balasan (nested comment)
const createComment = async (req, res) => {
  const recipeId = parseInt(req.params.recipeId.trim(), 10); // Perbaikan penting
  let { content, parentId } = req.body;

  try {
    // Normalisasi dan validasi parentId
    if (typeof parentId === 'string') {
      parentId = parentId.trim();
      if (parentId.toLowerCase() === 'null' || parentId === '') {
        parentId = null;
      }
    }

    if (!content || content.trim() === '') {
      return res.status(400).json({ message: 'Komentar tidak boleh kosong' });
    }

    if (content.length > 300) {
      return res.status(400).json({ message: 'Komentar maksimal 300 karakter' });
    }

    // Pastikan resep ada
    const recipe = await Recipe.findByPk(recipeId);
    if (!recipe) return res.status(404).json({ message: 'Resep tidak ditemukan' });

    // Validasi nested reply hanya satu level
    if (parentId) {
      const parentComment = await Comment.findByPk(parentId);
      if (!parentComment) {
        return res.status(400).json({ message: 'Komentar induk tidak ditemukan' });
      }
      if (parentComment.parentId) {
        return res.status(400).json({ message: 'Balasan hanya boleh 1 level' });
      }
    }

    // Simpan komentar
    const comment = await Comment.create({
      userId: req.user.id,
      recipeId,
      content: content.trim(),
      parentId,
    });

    res.status(201).json({ message: 'Komentar ditambahkan', comment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal menambahkan komentar' });
  }
};

// ❌ Hapus komentar (hanya pemilik atau admin)
const deleteComment = async (req, res) => {
  const { id } = req.params;
  try {
    const comment = await Comment.findByPk(id);
    if (!comment) return res.status(404).json({ message: 'Komentar tidak ditemukan' });

    if (comment.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Tidak diizinkan menghapus' });
    }

    await comment.destroy();
    res.status(200).json({ message: 'Komentar berhasil dihapus' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal menghapus komentar' });
  }
};

export { getCommentsByRecipe, createComment, deleteComment };
