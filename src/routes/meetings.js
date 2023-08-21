import { adjectives, animals, colors, uniqueNamesGenerator } from "unique-names-generator";
import { protectRoute } from "../ProtectRoute.js";
import { db } from "../Database.js";
import { video } from "../Vonage.js";

export default function(router) {
    router.all('/meetings/create', protectRoute('*'), async (req, res) => {
        const randomName = uniqueNamesGenerator({ dictionaries: [adjectives, colors, animals] });

        if (req.method === 'POST') {
            const { meeting_name } = req.body;
            const session = await video.createSession();
            const resp = db.prepare('INSERT INTO rooms (room_name, owner_id, session_id) VALUES (?, ?, ?)').run(meeting_name, req.session.user.id, session.sessionId);
            db.prepare('INSERT INTO room_users (room_id, user_id) VALUES (?,?)').run(resp.lastInsertRowid, req.session.user.id);

            res.flash('success', 'Created new room');
            res.redirect('/');
            return;
        }

        res.render('meetings/create.twig', { randomName });
    });

    router.get('/meetings/:id', protectRoute('*'), async (req, res) => {
        const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(req.params.id);
        const currentUsers = db.prepare('SELECT users.id, users.username FROM room_users JOIN users ON users.id=room_users.user_id WHERE room_users.room_id = ?').all(req.params.id);

        if (currentUsers.filter(user => user.id === req.session.user.id).length === 0) {
            res.flash('error', 'Unable to find meeting');
            res.redirect('/');
            return;
        }

        const role = room.owner_id === req.session.user.id ? 'moderator' : 'publisher'

        res.render('meetings/view.twig', {
            applicationId: process.env.API_APPLICATION_ID,
            sessionId: room.session_id,
            token: video.generateClientToken(room.session_id, { role }),
            role,
            currentUsers,
            meetingId: req.params.id,
        });
    });

    return router;
}