import { db } from "../Database.js";
import { protectRoute } from "../ProtectRoute.js";

export default function(router) {
    router.get('/', protectRoute('*'), async (req, res) => {
        const rooms = db.prepare('SELECT * FROM rooms JOIN room_users ON room_users.room_id = rooms.id WHERE room_users.user_id = ?').all(req.session.user.id);

        res.render('index.twig', { rooms });
    });
    return router;
}