import Recipe from '../model/recipeModel.js';
import { uploadToGCS } from '../utils/storage.js';
import Ingredient from '../model/ingredientsModel.js';
import Instruction from '../model/instructionModel.js';
import db from '../config/database.js';
import { Op } from 'sequelize';

/**
 * @swagger
 * /recipes:
 *   get:
 *     summary: Ambil semua resep
 *     tags: [Recipes]
 *     responses:
 *       200:
 *         description: Daftar resep berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Recipe'
 *       500:
 *         description: Terjadi kesalahan server
 */

const getAllRecipes = async (req, res) => {
  try {
    const recipes = await Recipe.findAll({
      include: [
        { model: Ingredient, as: 'ingredients' },
        { model: Instruction, as: 'instructions' },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json(recipes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
}
/**
 * @swagger
 * /recipes/{id}:
 *   get:
 *     summary: Ambil detail resep berdasarkan ID
 *     tags: [Recipes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID resep
 *     responses:
 *       200:
 *         description: Detail resep berhasil diambil
 *       404:
 *         description: Resep tidak ditemukan
 *       500:
 *         description: Terjadi kesalahan server
 */
const getRecipeById = async (req, res) => {
  const { id } = req.params;

  try {
    const recipe = await Recipe.findByPk(id, {
      include: [
        { model: Ingredient, as: 'ingredients' },
        { model: Instruction, as: 'instructions' },
      ],
    });

    if (!recipe) {
      return res.status(404).json({ message: "Resep tidak ditemukan" });
    }

    res.status(200).json(recipe);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
}

/**
 * @swagger
 * /recipes:
 *   post:
 *     summary: Tambah resep baru
 *     tags: [Recipes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               time:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *               ingredients:
 *                 type: string
 *                 example: '[{"name": "Garam", "quantity": "1 sdt"}]'
 *               instructions:
 *                 type: string
 *                 example: '[{"step": 1, "description": "Campur semua bahan."}]'
 *     responses:
 *       201:
 *         description: Resep berhasil ditambahkan
 *       400:
 *         description: Foto wajib diisi
 *       500:
 *         description: Terjadi kesalahan server
 */

const createRecipe = async (req, res) => {
  try {
    let { title, description, time, ingredients, instructions } = req.body;
    const userId = req.user.id;

    if (!req.file) return res.status(400).json({ message: "Foto wajib diisi" });

    const imageUrl = await uploadToGCS(req.file);

    const recipe = await Recipe.create({
      title,
      description,
      time,
      image: imageUrl,
      userId,
    });
    if (typeof ingredients === 'string') ingredients = JSON.parse(ingredients);
    if (typeof instructions === 'string') instructions = JSON.parse(instructions);
    if (ingredients && Array.isArray(ingredients)) {
      await Promise.all(ingredients.map(ing =>
        Ingredient.create({ ...ing, recipeId: recipe.id })
      ));
    }

    if (instructions && Array.isArray(instructions)) {
      await Promise.all(instructions.map(inst =>
        Instruction.create({ ...inst, recipeId: recipe.id })
      ));
    }

    res.status(201).json({
      message: "Resep berhasil ditambahkan", recipe: {
        id: recipe.id,
        title: recipe.title,
        description: recipe.description,
        time: recipe.time,
        image: recipe.image,
        userId: recipe.userId,
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }

}
/**
 * @swagger
 * /recipes/{id}:
 *   put:
 *     summary: Perbarui resep (hanya milik sendiri)
 *     tags: [Recipes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID resep
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               time:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Resep berhasil diperbarui
 *       403:
 *         description: Tidak diizinkan
 *       404:
 *         description: Resep tidak ditemukan
 *       500:
 *         description: Terjadi kesalahan saat memperbarui resep
 */


const updateRecipe = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, time } = req.body;

    // Cari resep
    const recipe = await Recipe.findByPk(id);
    if (!recipe) {
      return res.status(404).json({ message: "Resep tidak ditemukan" });
    }

    // Cek kepemilikan
    if (recipe.userId !== req.user.id) {
      return res.status(403).json({ message: "Tidak diizinkan" });
    }

    // Upload image jika ada file
    let imageUrl = recipe.image;
    if (req.file) {
      imageUrl = await uploadToGCS(req.file);
    }

    // Update field
    await recipe.update({
      title: title || recipe.title,
      description: description || recipe.description,
      time: time || recipe.time,
      image: imageUrl
    });

    return res.status(200).json({ message: "Resep berhasil diperbarui" });
  } catch (err) {
    console.error("Gagal update resep:", err);
    return res.status(500).json({ message: "Terjadi kesalahan saat memperbarui resep" });
  }
};

/**
 * @swagger
 * /recipes/{id}:
 *   delete:
 *     summary: Hapus resep (hanya milik sendiri)
 *     tags: [Recipes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID resep
 *     responses:
 *       200:
 *         description: Resep berhasil dihapus
 *       403:
 *         description: Tidak diizinkan
 *       404:
 *         description: Resep tidak ditemukan
 *       500:
 *         description: Gagal menghapus resep
 */

const deleteRecipe = async (req, res) => {
  try {
    const { id } = req.params;

    const recipe = await Recipe.findByPk(id);
    if (!recipe) return res.status(404).json({ message: "Resep tidak ditemukan" });
    if (recipe.userId !== req.user.id) {
      return res.status(403).json({ message: "Tidak diizinkan" });
    }
    await recipe.destroy();
    res.status(200).json({ message: "Resep berhasil dihapus" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal menghapus resep" });
  }
};

export {
  getAllRecipes,
  getRecipeById,
  createRecipe,
  updateRecipe,
  deleteRecipe
};