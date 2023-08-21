import { db } from "../../Database.js";
import { protectRoute } from "../../ProtectRoute.js";

export default function(router) {
    router.get('/api/users', protectRoute('*'), async (req, res) => {
        const users = db.prepare('SELECT * FROM users')
            .all()
            .map(user => {
                delete user.password;
                delete user.phone_number;
                delete user.admin;
                return user;
            });

        res.send({
            count: users.length,
            total: users.length,
            _embedded: {
                users: users
            },
            _links: {
                self: {
                    href: req.originalUrl
                }
            }
        })
    });
    return router;
}