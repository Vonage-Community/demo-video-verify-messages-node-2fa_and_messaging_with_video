import { protectRoute } from "../../ProtectRoute.js";
import { db } from "../../Database.js";
import { vonage } from "../../Vonage.js";
import { SMS } from "@vonage/messages";

export default function(router) {
    router.post('/api/meetings/:id/users', protectRoute('*'), async (req, res) => {
        const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(req.params.id);
        if (room.owner_id !== req.session.user.id) {
            res.status(404).send({
                title: 'Unable to find requested meeting'
            });
            return;
        }

        const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.body.user_id);
        try {
            db.prepare('INSERT INTO room_users (room_id, user_id) VALUES (?, ?)').run(req.params.id, req.body.user_id);
            if (user.notify_sms && user.phone_number) {
                vonage.messages.send(new SMS(
                    `You have been invited to a new meeting: ${room.room_name}`,
                    user.phone_number,
                    process.env.VONAGE_FROM_NUMBER
                ));
            }
        } catch (e) {
            // Ignore for now
        }
        
        const users = db.prepare('SELECT users.id, users.username FROM room_users JOIN users ON users.id=room_users.user_id WHERE room_users.room_id = ?').all(req.params.id);

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