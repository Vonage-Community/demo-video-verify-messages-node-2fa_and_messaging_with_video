import bcrypt from 'bcrypt';
import { db } from "../../Database.js";
import { protectRoute } from "../../ProtectRoute.js";

export default function(router) {
    router.get('/admin/users', protectRoute('admin'), async (req, res) => {
        const users = db.prepare('SELECT * FROM users').all();

        res.render('admin/users/index.twig', { users });
    });

    router.all('/admin/users/create', protectRoute('admin'), async (req, res) => {
        let username;
        let phoneNumber;
        let admin = false;
        if (req.method === 'POST') {
            username = req.body.username;
            const password = req.body.password;
            phoneNumber = req.body.phone_number;
            admin = req.body.admin || 0;
            if (admin === 'on') { admin = 1; }

            if (!username) {
                res.flash('error', 'Must enter a username');
            }

            if (!password) {
                res.flash('error', 'Must enter a password');
            }

            try {
                const newPassword = await bcrypt.hash(password, 10);
                db.prepare('INSERT INTO users (username, password, phone_number, admin) VALUES (?, ?, ?, ?)').run(username, newPassword, phoneNumber, admin);
                res.flash('success', 'New user created');
                res.redirect('/admin/users');
                return;
            } catch (e) {
                console.log(e);
                res.flash('error', 'Unable to create new user');
            }
        }

        res.render('admin/users/form.twig', { method: 'Create', user: { username, phone_number: phoneNumber, admin }});
    });

    router.all('/admin/users/:id', protectRoute('admin'), async (req, res) => {
        const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);

        if (req.method === 'POST') {
            const username = req.body.username;
            const password = req.body.password;
            const phoneNumber = req.body.phone_number;
            let admin = req.body.admin || 0;
            if (admin === 'on') { admin = 1; }
            let notifySms = req.body.notify_sms || 0;
            if (notifySms === 'on') { notifySms = 1; }

            if (req.body.password) {
                const newPassword = await bcrypt.hash(password, 10);
                db.prepare('UPDATE users SET username = ?, password = ?, phone_number = ?, notify_sms = ?, admin = ? WHERE id = ?').run(username, newPassword, phoneNumber, notifySms, admin, req.params.id);
            } else {
                db.prepare('UPDATE users SET username = ?, phone_number = ?, notify_sms = ?, admin = ? WHERE id = ?').run(username, phoneNumber, notifySms, admin, req.params.id);
            }
            res.flash('success', 'User updated');
            res.redirect('/admin/users');
            return;
        }

        res.render('admin/users/form.twig', { method: 'Edit', user });
    });

    router.all('/admin/users/delete/:id', protectRoute('admin'), async (req, res) => {
        const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);

        if (req.method === 'POST') {
            db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
            res.flash('success', 'User deleted');
            res.redirect('/admin/users');
            return;
        }

        res.render('admin/users/delete.twig', { method: 'Edit', user });
    });

    return router;
}