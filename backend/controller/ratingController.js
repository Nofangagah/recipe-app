import Rating from '../model/ratingModel.js';
import Recipe from '../model/recipeModel.js';
import Sequelize from 'sequelize';


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