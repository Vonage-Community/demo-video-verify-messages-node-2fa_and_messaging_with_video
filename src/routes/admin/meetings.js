import { db } from "../../Database.js";
import { protectRoute } from "../../ProtectRoute.js";

export default function(router) {
    router.get('/admin/meetings', protectRoute('admin'), async (req, res) => {
        const rooms = db.prepare('SELECT rooms.*,users.username FROM rooms JOIN users ON rooms.owner_id = users.id').all();

        res.render('admin/meetings/index.twig', { rooms });
    });

    router.get('/admin/meetings/:id/delete', protectRoute('admin'), async (req, res) => {
        db.prepare('DELETE FROM rooms WHERE id = ?').run(parseInt(req.params.id));
        db.prepare('DELETE FROM room_users WHERE room_id = ?').run(parseInt(req.params.id));

        res.flash('success', 'Deleted meeting');

        res.redirect('/admin/meetings');
    });

    return router;
}