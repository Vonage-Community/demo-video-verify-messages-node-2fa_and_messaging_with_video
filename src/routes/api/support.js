import { protectRoute } from "../../ProtectRoute.js";
import { aistudio } from "../../Vonage.js";

export default function(router) {
    router.post('/api/support/init', protectRoute('*'), async (req, res) => {
        const session = await aistudio.startConversation();
        req.session.aistudio_session = session;
        res.status(204).send();
    });

    router.post('/api/support/conversation', protectRoute('*'), async (req, res) => {
        const resp = await aistudio.stepConversation(
            req.session.aistudio_session.session_id,
            req.session.aistudio_session.session_token,
            req.body.input
        );
        res.send(resp);
    })
    return router;
}