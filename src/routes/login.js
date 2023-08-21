import bcrypt from 'bcrypt';
import { db } from "../Database.js";
import { vonage } from '../Vonage.js';

export default function(router) {
    router.all('/login', async (req, res) => {
        if (req.method === "POST") {
            const { username, password } = req.body;
            const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
            if (user) {
                const verified = await bcrypt.compare(password, user.password);
                if (verified) {
                    req.session.user = user;
    
                    if (user.phone_number) {
                        const response = await vonage.verify.start({
                            number: user.phone_number,
                            brand: process.env.VONAGE_VERIFY_BRAND,
                        });
                        req.session.mfa = false;
                        req.session.request_id = response.requestId;
                        req.session.save();
                        res.redirect('/login/verify');
                        return;
                    } else {
                        req.session.mfa = true;
                        req.session.save();
                        res.redirect(req.session.return_url || '/');
                        return;
                    }
                } else {
                    res.flash('error', 'Unable to verify username or password');
                }
            } else {
                res.flash('error', 'Unable to verify username or password');
            }
        }
        res.render('login.twig');
    });

    router.all('/login/verify', async (req, res) => {
        if (req.method === 'POST') {
            const { pin } = req.body;
            const response = await vonage.verify.check(req.session.request_id, pin);
            if (response.status === '0') {
                delete req.session.request_id;
                req.session.authenticated = true;
                req.session.mfa = true;

                res.redirect(req.session.return_url || '/');
                return;
            } else {
                res.flash('error', 'Unable to verify PIN');
            }
        }
        res.render('verify.twig');
    })

    return router;
}