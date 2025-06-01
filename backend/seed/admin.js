import User from '../model/userModel.js';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
dotenv.config();

const createAdmin = async () => {

try {
    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);

    const [admin, created] = await User.findOrCreate({
        where: { email: process.env.ADMIN_EMAIL },
        defaults: {
            name: process.env.ADMIN_NAME,
            password: hashedPassword,
            role: 'admin',
        },
    });
    if (created) {
        console.log('Admin user created successfully');
    } else {
        console.log('Admin user already exists');
    }
    
    
    
} catch (error) {
    console.error('Error creating admin user:', error);
    throw error;
}

}
 createAdmin()
    .then(() => console.log('Admin seeding completed'))
    .catch((error) => console.error('Error during admin seeding:', error));
