import Comment from '../model/commentModel.js';
import Recipe from '../model/recipeModel.js';
import User from '../model/userModel.js';
import { Op } from 'sequelize';

/**
 * @swagger
 * components:
 *   schemas:
 *     Comment:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         content:
 *           type: string
 *         recipeId:
 *           type: integer
 *         parentId:
 *           type: integer
 *           nullable: true
 *         userId:
 *           type: integer
 *         user:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *             name:
 *               type: string
 *         replies:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Comment'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */


/**
 * @swagger
 * /recipes/{recipeId}/comments:
 *   get:
 *     summary: Ambil semua komentar dari resep tertentu (termasuk balasan)
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: recipeId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID resep
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Nomor halaman
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Jumlah komentar per halaman
 *     responses:
 *       200:
 *         description: Komentar berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 comments:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Comment'
 *                 totalPages:
 *                   type: integer
 *                 currentPage:
 *                   type: integer
 *       500:
 *         description: Gagal mengambil komentar
 */
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

/**
 * @swagger
 * /recipes/{recipeId}/comments:
 *   post:
 *     summary: Tambahkan komentar atau balasan pada resep
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: recipeId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID resep
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 example: "Resepnya sangat enak!"
 *               parentId:
 *                 type: integer
 *                 nullable: true
 *                 example: null
 *     responses:
 *       201:
 *         description: Komentar berhasil ditambahkan
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 comment:
 *                   $ref: '#/components/schemas/Comment'
 *       400:
 *         description: Validasi gagal (komentar kosong, terlalu panjang, atau balasan tidak valid)
 *       404:
 *         description: Resep tidak ditemukan
 *       500:
 *         description: Gagal menambahkan komentar
 */

const createComment = async (req, res) => {
  const recipeId = parseInt(req.params.recipeId.trim(), 10);
  let { content, parentId } = req.body;

  try {
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

    const recipe = await Recipe.findByPk(recipeId);
    if (!recipe) return res.status(404).json({ message: 'Resep tidak ditemukan' });

    if (parentId) {
      const parentComment = await Comment.findByPk(parentId);
      if (!parentComment) {
        return res.status(400).json({ message: 'Komentar induk tidak ditemukan' });
      }
      if (parentComment.parentId) {
        return res.status(400).json({ message: 'Balasan hanya boleh 1 level' });
      }
    }

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

/**
 * @swagger
 * /comments/{id}:
 *   delete:
 *     summary: Hapus komentar (oleh pemilik atau admin)
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID komentar yang akan dihapus
 *     responses:
 *       200:
 *         description: Komentar berhasil dihapus
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       403:
 *         description: Tidak memiliki izin untuk menghapus komentar
 *       404:
 *         description: Komentar tidak ditemukan
 *       500:
 *         description: Gagal menghapus komentar
 */

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
