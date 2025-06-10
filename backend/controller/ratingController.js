import Rating from '../model/ratingModel.js';
import Recipe from '../model/recipeModel.js';
import Sequelize from 'sequelize';


/**
 * @swagger
 * /ratings/recipe/{recipeId}:
 *   post:
 *     summary: Beri atau perbarui rating untuk resep
 *     tags: [Ratings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: recipeId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID resep yang ingin diberi rating
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *     responses:
 *       200:
 *         description: Rating berhasil ditambahkan atau diperbarui
 *       400:
 *         description: Rating tidak valid
 *       404:
 *         description: Resep tidak ditemukan
 *       500:
 *         description: Gagal memberi rating
 */
 const rateRecipe = async (req, res) => {
  const { recipeId } = req.params;
  const { rating } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'Rating harus antara 1 sampai 5' });
  }

  try {
    
    const recipe = await Recipe.findByPk(recipeId);
    if (!recipe) {
      return res.status(404).json({ message: 'Resep tidak ditemukan' });
    }

    const [userRating, created] = await Rating.upsert({
      userId: req.user.id,
      recipeId,
      rating,
    }, { returning: true });

    res.status(200).json({
      message: created ? 'Rating berhasil ditambahkan' : 'Rating diperbarui',
      data: userRating,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal memberi rating' });
  }
};

/**
 * @swagger
 * /ratings/recipe/{recipeId}/average:
 *   get:
 *     summary: Ambil rata-rata rating untuk resep
 *     tags: [Ratings]
 *     parameters:
 *       - in: path
 *         name: recipeId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Rata-rata rating dan jumlah voter
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 average:
 *                   type: number
 *                   example: 4.25
 *                 count:
 *                   type: integer
 *                   example: 12
 *       500:
 *         description: Gagal mengambil rating
 */

 const getAverageRating = async (req, res) => {
  const { recipeId } = req.params;

  try {
    const result = await Rating.findOne({
      where: { recipeId },
      attributes: [
        [Sequelize.fn('AVG', Sequelize.col('rating')), 'average'],
        [Sequelize.fn('COUNT', Sequelize.col('rating')), 'count'],
      ],
      raw: true,
    });

    const average = result.average ? parseFloat(parseFloat(result.average).toFixed(2)) : 0;
    const count = result.count ? parseInt(result.count) : 0;

    return res.status(200).json({ average, count });
  } catch (err) {
    console.error('Gagal mengambil rating:', err);
    return res.status(500).json({ message: 'Gagal mengambil rating' });
  }
};


/**
 * @swagger
 * /ratings/user:
 *   get:
 *     summary: Ambil semua rating yang diberikan user
 *     tags: [Ratings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Daftar rating user
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   recipe:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       title:
 *                         type: string
 *                       image:
 *                         type: string
 *                   rating:
 *                     type: integer
 *       500:
 *         description: Gagal mengambil rating user
 */
 const getUserRatings = async (req, res) => {
  try {
    const userId = req.user.id;

    const ratings = await Rating.findAll({
      where: { userId },
      include: {
        model: Recipe,
        as: 'recipe',
        attributes: ['id', 'title', 'image'],
      },
    });

    res.status(200).json(ratings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal mengambil rating user' });
  }
};

/**
 * @swagger
 * /ratings/recipe/{recipeId}:
 *   delete:
 *     summary: Hapus rating user untuk resep tertentu
 *     tags: [Ratings]
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
 *         description: Rating berhasil dihapus
 *       404:
 *         description: Rating tidak ditemukan
 *       500:
 *         description: Gagal menghapus rating
 */
 const deleteUserRating = async (req, res) => {
  const { recipeId } = req.params;

  try {
    const deleted = await Rating.destroy({
      where: {
        userId: req.user.id,
        recipeId,
      },
    });

    if (!deleted) {
      return res.status(404).json({ message: 'Rating tidak ditemukan' });
    }

    res.status(200).json({ message: 'Rating berhasil dihapus' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal menghapus rating' });
  }
};
;
/**
 * @swagger
 * /ratings/top:
 *   get:
 *     summary: Ambil resep dengan rating tertinggi
 *     tags: [Ratings]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *         description: Jumlah maksimum resep yang ingin diambil
 *     responses:
 *       200:
 *         description: Daftar resep dengan rating tertinggi
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   recipeId:
 *                     type: integer
 *                   averageRating:
 *                     type: number
 *                   totalVotes:
 *                     type: integer
 *                   recipe:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       title:
 *                         type: string
 *                       image:
 *                         type: string
 *       500:
 *         description: Gagal mengambil resep teratas
 */

 const getTopRatedRecipes = async (req, res) => {
  const limit = parseInt(req.query.limit) || 5;

  try {
    const topRecipes = await Rating.findAll({
      attributes: [
        'recipeId',
        [Sequelize.fn('AVG', Sequelize.col('rating')), 'averageRating'],
        [Sequelize.fn('COUNT', Sequelize.col('rating')), 'totalVotes'],
      ],
      group: ['recipeId'],
      order: [[Sequelize.literal('averageRating'), 'DESC']],
      limit,
      include: {
        model: Recipe,
        as: 'recipe',
        attributes: ['id', 'title', 'image'],
      },
    });

    res.status(200).json(topRecipes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal mengambil resep teratas' });
  }
};



export{ rateRecipe, getAverageRating, getUserRatings, deleteUserRating, getTopRatedRecipes};