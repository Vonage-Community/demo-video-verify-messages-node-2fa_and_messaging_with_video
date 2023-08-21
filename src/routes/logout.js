export default function(router) {
    router.get('/logout', async (req, res) => {
        req.session.destroy();
        res.redirect('/login');
    });

    return router;
}