import User from '../model/userModel.js';



/**
 * @swagger
 * /users/profile:
 *   put:
 *     summary: Edit profil pengguna (khusus role "user")
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Budi Santoso
 *     responses:
 *       200:
 *         description: Profil berhasil diperbarui
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Profil berhasil diperbarui
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     name:
 *                       type: string
 *                       example: Budi Santoso
 *                     email:
 *                       type: string
 *                       example: budi@example.com
 *                     role:
 *                       type: string
 *                       example: user
 *       400:
 *         description: Data user tidak valid atau nama kosong
 *       403:
 *         description: Role tidak diizinkan mengedit profil
 *       404:
 *         description: User tidak ditemukan
 *       500:
 *         description: Terjadi kesalahan saat memperbarui profil
 */


const editProfile = async (req, res) => {
  const { id, role } = req.user;

  // Validasi token payload
  if (!id || !role) {
    return res.status(400).json({ message: 'Invalid user data' });
  }

  // Hanya user biasa yang boleh edit profil
  if (role !== 'user') {
    return res.status(403).json({ message: 'Hanya user biasa yang boleh mengedit profil.' });
  }

  try {
    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    const { name } = req.body;

    // Validasi input
    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Nama tidak boleh kosong' });
    }

    // Update nama
    user.name = name;
    await user.save();

    return res.status(200).json({
      message: 'Profil berhasil diperbarui',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Terjadi kesalahan saat memperbarui profil', error: error.message });
  }
};

export default editProfile;
